import { describe, expect, it } from 'vitest';
import { CongressClient } from '../src/client';
import { CongressApiError, RateLimitError } from '../src/errors';
import { collect, jsonResponse, makeFetch } from './helpers';

function client(fetchFn: ReturnType<typeof makeFetch>['fetchFn'], overrides = {}) {
  return new CongressClient({
    apiKey: 'test-key',
    fetch: fetchFn,
    retryBaseDelayMs: 0,
    ...overrides,
  });
}

describe('CongressClient', () => {
  it('requires an apiKey', () => {
    expect(() => new CongressClient({ apiKey: '' })).toThrow(/apiKey is required/);
  });

  it('sends the API key as a header and requests JSON format', async () => {
    const { fetchFn, requests } = makeFetch(() => jsonResponse({ ok: true }));
    await client(fetchFn).get('/bill');

    expect(requests).toHaveLength(1);
    const req = requests[0]!;
    expect(req.url.origin + req.url.pathname).toBe('https://api.congress.gov/v3/bill');
    expect(req.url.searchParams.get('format')).toBe('json');
    expect(req.headers['X-Api-Key']).toBe('test-key');
    expect(req.url.searchParams.has('api_key')).toBe(false);
  });

  it('serializes query params and skips undefined values', async () => {
    const { fetchFn, requests } = makeFetch(() => jsonResponse({}));
    await client(fetchFn).get('/bill', { offset: 20, sort: 'updateDate+desc', skip: undefined });

    const params = requests[0]!.url.searchParams;
    expect(params.get('offset')).toBe('20');
    expect(params.get('sort')).toBe('updateDate+desc');
    expect(params.has('skip')).toBe(false);
  });

  it('throws CongressApiError with status and message on 4xx', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ error: { message: 'Unknown bill type' } }, { status: 404 }),
    );
    const err = await client(fetchFn)
      .get('/bill/118/xx/1')
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(CongressApiError);
    expect((err as CongressApiError).status).toBe(404);
    expect((err as CongressApiError).message).toContain('404');
    expect((err as CongressApiError).message).toContain('Unknown bill type');
    expect(requests, 'no retries on non-429 4xx').toHaveLength(1);
  });

  it('retries 429 responses and honors Retry-After', async () => {
    const { fetchFn, requests } = makeFetch(
      () => jsonResponse({ error: 'OVER_RATE_LIMIT' }, { status: 429, headers: { 'retry-after': '0' } }),
      () => jsonResponse({ ok: true }),
    );
    const data = await client(fetchFn).get<{ ok: boolean }>('/bill');

    expect(data.ok).toBe(true);
    expect(requests).toHaveLength(2);
  });

  it('throws RateLimitError after exhausting retries', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ error: 'OVER_RATE_LIMIT' }, { status: 429, headers: { 'retry-after': '0' } }),
    );
    const err = await client(fetchFn, { maxRetries: 2 })
      .get('/bill')
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfterSeconds).toBe(0);
    expect(requests, 'initial request + 2 retries').toHaveLength(3);
  });

  it('retries 5xx responses', async () => {
    const { fetchFn, requests } = makeFetch(
      () => jsonResponse({}, { status: 503 }),
      () => jsonResponse({ ok: true }),
    );
    const data = await client(fetchFn).get<{ ok: boolean }>('/bill');

    expect(data.ok).toBe(true);
    expect(requests).toHaveLength(2);
  });

  it('retries network errors up to maxRetries', async () => {
    let calls = 0;
    const failingFetch = async () => {
      calls += 1;
      throw new Error('socket hang up');
    };
    const err = await client(failingFetch, { maxRetries: 1 })
      .get('/bill')
      .catch((e: unknown) => e);

    expect((err as Error).message).toBe('socket hang up');
    expect(calls).toBe(2);
  });

  describe('paginate', () => {
    it('follows pagination.next until exhausted', async () => {
      const { fetchFn, requests } = makeFetch(
        () =>
          jsonResponse({
            bills: [{ number: '1' }, { number: '2' }],
            pagination: {
              count: 3,
              next: 'https://api.congress.gov/v3/bill?offset=2&limit=2&format=json',
            },
          }),
        () => jsonResponse({ bills: [{ number: '3' }], pagination: { count: 3 } }),
      );

      const items = await collect(client(fetchFn).paginate<{ number: string }>('/bill', 'bills'));

      expect(items.map((b) => b.number)).toEqual(['1', '2', '3']);
      expect(requests).toHaveLength(2);
      expect(requests[1]!.url.searchParams.get('offset')).toBe('2');
    });

    it('clamps limit to the API maximum of 250', async () => {
      const { fetchFn, requests } = makeFetch(() =>
        jsonResponse({ bills: [], pagination: { count: 0 } }),
      );
      await collect(client(fetchFn).paginate('/bill', 'bills', { limit: 9999 }));

      expect(requests[0]!.url.searchParams.get('limit')).toBe('250');
    });

    it('yields nothing when the list key is omitted (empty result set)', async () => {
      const { fetchFn } = makeFetch(() => jsonResponse({ pagination: { count: 0 } }));
      const items = await collect(client(fetchFn).paginate('/bill', 'bills'));
      expect(items).toEqual([]);
    });

    it('throws a clear error when the list key holds a non-array', async () => {
      const { fetchFn } = makeFetch(() =>
        jsonResponse({ bills: { nope: true }, pagination: { count: 1 } }),
      );
      await expect(collect(client(fetchFn).paginate('/bill', 'bills'))).rejects.toThrow(
        /Expected "bills" to be an array/,
      );
    });
  });
});
