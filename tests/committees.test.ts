import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('CommitteesResource', () => {
  it('lists committees with congress + chamber path segments', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        committees: [{ name: 'Transportation and Infrastructure Committee', systemCode: 'hspw00' }],
        pagination: { count: 1 },
      }),
    );
    const committees = await collect(
      congress(fetchFn).committees.list({ congress: 118, chamber: 'House' }),
    );

    expect(requests[0]!.url.pathname).toBe('/v3/committee/118/house');
    expect(committees[0]!.systemCode).toBe('hspw00');
  });

  it('lists committees by chamber alone', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ committees: [], pagination: { count: 0 } }),
    );
    await collect(congress(fetchFn).committees.list({ chamber: 'senate' }));
    expect(requests[0]!.url.pathname).toBe('/v3/committee/senate');
  });

  it('gets one committee by chamber + system code', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ committee: { systemCode: 'hspw00', isCurrent: true } }),
    );
    const committee = await congress(fetchFn).committee('house', 'hspw00');

    expect(requests[0]!.url.pathname).toBe('/v3/committee/house/hspw00');
    expect(committee.isCurrent).toBe(true);
  });

  it('extracts committee bills from the nested committee-bills.bills envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        'committee-bills': {
          bills: [{ congress: 118, number: '1', type: 'HR', relationshipType: 'Referred to' }],
        },
        pagination: { count: 1 },
      }),
    );
    const bills = await collect(congress(fetchFn).committees.bills('house', 'hspw00'));

    expect(requests[0]!.url.pathname).toBe('/v3/committee/house/hspw00/bills');
    expect(bills[0]!.relationshipType).toBe('Referred to');
  });

  it('iterates committee reports', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        reports: [{ citation: 'H. Rept. 118-1' }],
        pagination: { count: 1 },
      }),
    );
    const reports = await collect(congress(fetchFn).committees.reports('house', 'hspw00'));

    expect(requests[0]!.url.pathname).toBe('/v3/committee/house/hspw00/reports');
    expect(reports[0]!.citation).toBe('H. Rept. 118-1');
  });

  it('iterates committee nominations', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        nominations: [{ citation: 'PN12', number: 12 }],
        pagination: { count: 1 },
      }),
    );
    const noms = await collect(congress(fetchFn).committees.nominations('senate', 'ssas00'));

    expect(requests[0]!.url.pathname).toBe('/v3/committee/senate/ssas00/nominations');
    expect(noms[0]!.number).toBe(12);
  });
});
