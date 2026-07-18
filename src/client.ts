import { CongressApiError, RateLimitError } from './errors';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface CongressClientOptions {
  /** Congress.gov API key. Free at https://api.congress.gov/sign-up/ */
  apiKey: string;
  /** Override the API base URL (e.g. to point at a proxy). Default: https://api.congress.gov/v3 */
  baseUrl?: string;
  /** Custom fetch implementation. Defaults to the global fetch. */
  fetch?: FetchLike;
  /** Retry attempts after the initial request, for 429/5xx/network errors. Default: 3 */
  maxRetries?: number;
  /** Per-request timeout in milliseconds. Default: 30000 */
  timeoutMs?: number;
  /** Base delay for exponential backoff in milliseconds. Default: 500 */
  retryBaseDelayMs?: number;
}

export type QueryValue = string | number | boolean | undefined;
export type QueryParams = Record<string, QueryValue>;

interface ListEnvelope {
  pagination?: { count?: number; next?: string };
  [key: string]: unknown;
}

const DEFAULT_BASE_URL = 'https://api.congress.gov/v3';
const MAX_PAGE_LIMIT = 250;

export class CongressClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly retryBaseDelayMs: number;

  constructor(options: CongressClientOptions) {
    if (!options.apiKey) {
      throw new Error(
        'congress-api: apiKey is required. Get a free key at https://api.congress.gov/sign-up/',
      );
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.maxRetries = options.maxRetries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 500;
  }

  /** GET a single endpoint and parse the JSON response. */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.requestJson<T>(this.buildUrl(path, params));
  }

  /**
   * Iterate every item of a paginated list endpoint, following
   * `pagination.next` until exhausted.
   */
  async *paginate<T>(
    path: string,
    listKey: string,
    params?: QueryParams,
  ): AsyncGenerator<T, void, undefined> {
    const limit = clampLimit(params?.limit);
    let url: string | null = this.buildUrl(path, { ...params, limit });
    while (url !== null) {
      const data: ListEnvelope = await this.requestJson<ListEnvelope>(url);
      const items: T[] = extractList<T>(data, listKey, url);
      for (const item of items) {
        yield item;
      }
      const next: string | undefined = data.pagination?.next;
      url = next !== undefined && items.length > 0 ? this.resolveNextUrl(next) : null;
    }
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(this.baseUrl + path);
    url.searchParams.set('format', 'json');
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private resolveNextUrl(next: string): string {
    const url = new URL(next, this.baseUrl + '/');
    if (!url.searchParams.has('format')) {
      url.searchParams.set('format', 'json');
    }
    return url.toString();
  }

  private async requestJson<T>(url: string): Promise<T> {
    const res = await this.requestWithRetry(url);
    try {
      return (await res.json()) as T;
    } catch {
      throw new CongressApiError('Congress.gov returned a non-JSON response', {
        status: res.status,
        url,
      });
    }
  }

  private async requestWithRetry(url: string): Promise<Response> {
    let attempt = 0;
    for (;;) {
      let res: Response;
      try {
        res = await this.fetchFn(url, {
          headers: { 'X-Api-Key': this.apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err) {
        if (attempt >= this.maxRetries) throw err;
        await sleep(this.backoffDelay(attempt));
        attempt += 1;
        continue;
      }

      if (res.status === 429 || res.status >= 500) {
        const retryAfterSeconds = parseRetryAfter(res.headers.get('retry-after'));
        if (attempt < this.maxRetries) {
          await sleep(
            retryAfterSeconds !== undefined
              ? retryAfterSeconds * 1000
              : this.backoffDelay(attempt),
          );
          attempt += 1;
          continue;
        }
        const body = await safeJson(res);
        if (res.status === 429) {
          throw new RateLimitError(
            `Congress.gov rate limit exceeded (429) after ${this.maxRetries} retries`,
            { status: 429, url, body, retryAfterSeconds },
          );
        }
        throw new CongressApiError(
          `Congress.gov API request failed with status ${res.status}${messageFrom(body)}`,
          { status: res.status, url, body },
        );
      }

      if (!res.ok) {
        const body = await safeJson(res);
        throw new CongressApiError(
          `Congress.gov API request failed with status ${res.status}${messageFrom(body)}`,
          { status: res.status, url, body },
        );
      }

      return res;
    }
  }

  private backoffDelay(attempt: number): number {
    return this.retryBaseDelayMs * 2 ** attempt + Math.random() * this.retryBaseDelayMs * 0.5;
  }
}

function clampLimit(limit: QueryValue): number {
  const n = typeof limit === 'number' ? limit : MAX_PAGE_LIMIT;
  return Math.min(Math.max(Math.floor(n), 1), MAX_PAGE_LIMIT);
}

function extractList<T>(data: ListEnvelope, key: string, url: string): T[] {
  const value = data[key];
  // Congress.gov omits the list key entirely for some empty result sets.
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new CongressApiError(
      `Expected "${key}" to be an array in the response (got keys: ${Object.keys(data).join(', ')})`,
      { status: 200, url, body: data },
    );
  }
  return value as T[];
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, (date - Date.now()) / 1000);
  return undefined;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

function messageFrom(body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as { error?: { message?: string } | string; message?: string };
    const msg =
      typeof b.error === 'string' ? b.error : (b.error?.message ?? b.message);
    if (msg) return `: ${msg}`;
  }
  return '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
