import type { FetchLike } from '../src/client';

export interface RecordedRequest {
  url: URL;
  headers: Record<string, string>;
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
}

/**
 * Fetch stub fed by an ordered list of response factories.
 * The last factory repeats if more requests arrive than factories given.
 */
export function makeFetch(...factories: Array<(url: URL) => Response>) {
  const requests: RecordedRequest[] = [];
  const fetchFn: FetchLike = async (input, init) => {
    const url = new URL(String(input));
    requests.push({
      url,
      headers: (init?.headers as Record<string, string>) ?? {},
    });
    const factory = factories[Math.min(requests.length - 1, factories.length - 1)];
    if (!factory) throw new Error('makeFetch: no response factory provided');
    return factory(url);
  };
  return { fetchFn, requests };
}

export async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}
