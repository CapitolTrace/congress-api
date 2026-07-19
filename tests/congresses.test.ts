import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('CongressesResource', () => {
  it('lists congresses', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        congresses: [{ name: '118th Congress', startYear: '2023' }],
        pagination: { count: 1 },
      }),
    );
    const congresses = await collect(congress(fetchFn).congresses.list());

    expect(requests[0]!.url.pathname).toBe('/v3/congress');
    expect(congresses[0]!.name).toBe('118th Congress');
  });

  it('gets one congress by number', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ congress: { name: '118th Congress', sessions: [{ number: 1 }] } }),
    );
    const info = await congress(fetchFn).congresses.get(118);

    expect(requests[0]!.url.pathname).toBe('/v3/congress/118');
    expect(info.sessions?.[0]?.number).toBe(1);
  });

  it('gets the current congress', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ congress: { name: '119th Congress' } }),
    );
    const info = await congress(fetchFn).congresses.current();

    expect(requests[0]!.url.pathname).toBe('/v3/congress/current');
    expect(info.name).toBe('119th Congress');
  });
});
