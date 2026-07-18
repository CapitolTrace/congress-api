import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('BillsResource', () => {
  it('lists bills scoped to congress and bill type', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ bills: [{ congress: 118, number: '1', type: 'HR' }], pagination: { count: 1 } }),
    );
    const bills = await collect(congress(fetchFn).bills.list({ congress: 118, billType: 'HR' }));

    expect(requests[0]!.url.pathname).toBe('/v3/bill/118/hr');
    expect(bills[0]!.number).toBe('1');
  });

  it('rejects billType without congress', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).bills.list({ billType: 'hr' })).toThrow(/requires congress/);
  });

  it('gets one bill and unwraps the envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ bill: { congress: 118, number: '1', type: 'HR', title: 'Lower Energy Costs Act' } }),
    );
    const bill = await congress(fetchFn).bill(118, 'hr', 1);

    expect(requests[0]!.url.pathname).toBe('/v3/bill/118/hr/1');
    expect(bill.title).toBe('Lower Energy Costs Act');
  });

  it('iterates bill actions', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        actions: [{ actionDate: '2023-03-30', text: 'Passed the House' }],
        pagination: { count: 1 },
      }),
    );
    const actions = await collect(congress(fetchFn).bills.actions(118, 'hr', 1));

    expect(requests[0]!.url.pathname).toBe('/v3/bill/118/hr/1/actions');
    expect(actions[0]!.text).toBe('Passed the House');
  });

  it('returns the subjects object (not a paginated list)', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        subjects: {
          legislativeSubjects: [{ name: 'Energy' }],
          policyArea: { name: 'Energy' },
        },
      }),
    );
    const subjects = await congress(fetchFn).bills.subjects(118, 'hr', 1);

    expect(requests[0]!.url.pathname).toBe('/v3/bill/118/hr/1/subjects');
    expect(subjects.legislativeSubjects?.[0]?.name).toBe('Energy');
    expect(subjects.policyArea?.name).toBe('Energy');
  });

  it('iterates text versions under the textVersions key', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        textVersions: [{ type: 'Engrossed in House', formats: [{ type: 'PDF' }] }],
        pagination: { count: 1 },
      }),
    );
    const versions = await collect(congress(fetchFn).bills.text(118, 'hr', 1));

    expect(requests[0]!.url.pathname).toBe('/v3/bill/118/hr/1/text');
    expect(versions[0]!.type).toBe('Engrossed in House');
  });
});
