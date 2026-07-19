import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('AmendmentsResource', () => {
  it('lists amendments scoped to congress and type', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        amendments: [{ congress: 117, number: '2137', type: 'SAMDT' }],
        pagination: { count: 1 },
      }),
    );
    const amendments = await collect(
      congress(fetchFn).amendments.list({ congress: 117, amendmentType: 'SAMDT' }),
    );

    expect(requests[0]!.url.pathname).toBe('/v3/amendment/117/samdt');
    expect(amendments[0]!.number).toBe('2137');
  });

  it('rejects amendmentType without congress', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).amendments.list({ amendmentType: 'samdt' })).toThrow(
      /requires congress/,
    );
  });

  it('gets one amendment and unwraps the envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        amendment: { congress: 117, number: '2137', amendedBill: { number: '3684' } },
      }),
    );
    const amendment = await congress(fetchFn).amendment(117, 'samdt', 2137);

    expect(requests[0]!.url.pathname).toBe('/v3/amendment/117/samdt/2137');
    expect(amendment.amendedBill?.number).toBe('3684');
  });

  it('iterates amendment cosponsors', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        cosponsors: [{ bioguideId: 'S000033', fullName: 'Sen. Sanders, Bernard [I-VT]' }],
        pagination: { count: 1 },
      }),
    );
    const cosponsors = await collect(congress(fetchFn).amendments.cosponsors(117, 'samdt', 2137));

    expect(requests[0]!.url.pathname).toBe('/v3/amendment/117/samdt/2137/cosponsors');
    expect(cosponsors[0]!.bioguideId).toBe('S000033');
  });

  it('iterates amendments to an amendment', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        amendments: [{ congress: 117, number: '2564', type: 'SAMDT' }],
        pagination: { count: 1 },
      }),
    );
    const nested = await collect(congress(fetchFn).amendments.amendments(117, 'samdt', 2137));

    expect(requests[0]!.url.pathname).toBe('/v3/amendment/117/samdt/2137/amendments');
    expect(nested[0]!.number).toBe('2564');
  });
});
