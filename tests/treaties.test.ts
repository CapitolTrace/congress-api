import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('TreatiesResource', () => {
  it('lists treaties scoped to a congress', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        treaties: [{ congressReceived: 117, number: 3, topic: 'International Law' }],
        pagination: { count: 1 },
      }),
    );
    const treaties = await collect(congress(fetchFn).treaties.list({ congress: 117 }));

    expect(requests[0]!.url.pathname).toBe('/v3/treaty/117');
    expect(treaties[0]!.number).toBe(3);
  });

  it('gets one treaty and unwraps the envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ treaty: { congressReceived: 117, number: 3 } }),
    );
    const treaty = await congress(fetchFn).treaty(117, 3);

    expect(requests[0]!.url.pathname).toBe('/v3/treaty/117/3');
    expect(treaty.number).toBe(3);
  });

  it('supports partitioned treaty suffixes', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ treaty: { congressReceived: 114, number: 13, suffix: 'A' } }),
    );
    const treaty = await congress(fetchFn).treaty(114, 13, 'A');

    expect(requests[0]!.url.pathname).toBe('/v3/treaty/114/13/A');
    expect(treaty.suffix).toBe('A');
  });

  it('iterates treaty actions', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        actions: [{ actionDate: '2022-12-21', type: 'Floor' }],
        pagination: { count: 1 },
      }),
    );
    const actions = await collect(congress(fetchFn).treaties.actions(117, 3));

    expect(requests[0]!.url.pathname).toBe('/v3/treaty/117/3/actions');
    expect(actions[0]!.type).toBe('Floor');
  });
});
