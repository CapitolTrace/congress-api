import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('RecordResource', () => {
  it('fetches classic record issues with y/m/d params and PascalCase envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        Results: {
          Issues: [
            { Congress: '118', Issue: '1', Volume: '169', PublishDate: '2023-01-03' },
          ],
        },
      }),
    );
    const issues = await congress(fetchFn).record.issues({ year: 2023, month: 1, day: 3 });

    const params = requests[0]!.url.searchParams;
    expect(requests[0]!.url.pathname).toBe('/v3/congressional-record');
    expect(params.get('y')).toBe('2023');
    expect(params.get('m')).toBe('1');
    expect(params.get('d')).toBe('3');
    expect(issues[0]!.Volume).toBe('169');
  });

  it('returns an empty array when Results is missing', async () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    const issues = await congress(fetchFn).record.issues();
    expect(issues).toEqual([]);
  });

  it('iterates daily record issues, scoped by volume and issue', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        dailyCongressionalRecord: [{ volumeNumber: 169, issueNumber: '1' }],
        pagination: { count: 1 },
      }),
    );
    const issues = await collect(
      congress(fetchFn).record.daily({ volumeNumber: 169, issueNumber: 1 }),
    );

    expect(requests[0]!.url.pathname).toBe('/v3/daily-congressional-record/169/1');
    expect(issues[0]!.volumeNumber).toBe(169);
  });

  it('rejects issueNumber without volumeNumber', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).record.daily({ issueNumber: 1 })).toThrow(
      /requires volumeNumber/,
    );
  });
});
