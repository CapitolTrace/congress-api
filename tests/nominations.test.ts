import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('NominationsResource', () => {
  it('lists nominations scoped to a congress', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        nominations: [{ congress: 118, number: 12, citation: 'PN12' }],
        pagination: { count: 1 },
      }),
    );
    const noms = await collect(congress(fetchFn).nominations.list({ congress: 118 }));

    expect(requests[0]!.url.pathname).toBe('/v3/nomination/118');
    expect(noms[0]!.citation).toBe('PN12');
  });

  it('gets one nomination and unwraps the envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        nomination: { congress: 118, number: 12, isPrivileged: false },
      }),
    );
    const nom = await congress(fetchFn).nomination(118, 12);

    expect(requests[0]!.url.pathname).toBe('/v3/nomination/118/12');
    expect(nom.isPrivileged).toBe(false);
  });

  it('iterates nomination actions', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        actions: [{ actionDate: '2023-01-23', text: 'Received in the Senate' }],
        pagination: { count: 1 },
      }),
    );
    const actions = await collect(congress(fetchFn).nominations.actions(118, 12));

    expect(requests[0]!.url.pathname).toBe('/v3/nomination/118/12/actions');
    expect(actions[0]!.text).toBe('Received in the Senate');
  });

  it('iterates nomination hearings', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        hearings: [{ chamber: 'Senate', jacketNumber: 53398 }],
        pagination: { count: 1 },
      }),
    );
    const hearings = await collect(congress(fetchFn).nominations.hearings(118, 12));

    expect(requests[0]!.url.pathname).toBe('/v3/nomination/118/12/hearings');
    expect(hearings[0]!.jacketNumber).toBe(53398);
  });

  it('iterates nominees for a partitioned nomination ordinal', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        nominees: [{ ordinal: 1, lastName: 'Smith' }],
        pagination: { count: 1 },
      }),
    );
    const nominees = await collect(congress(fetchFn).nominations.nominees(118, 12, 1));

    expect(requests[0]!.url.pathname).toBe('/v3/nomination/118/12/1');
    expect(nominees[0]!.lastName).toBe('Smith');
  });
});
