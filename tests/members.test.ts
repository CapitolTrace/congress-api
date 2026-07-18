import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('MembersResource', () => {
  it('lists all members from /member', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ members: [{ bioguideId: 'P000197' }], pagination: { count: 1 } }),
    );
    const members = await collect(congress(fetchFn).members.list());

    expect(requests[0]!.url.pathname).toBe('/v3/member');
    expect(members[0]!.bioguideId).toBe('P000197');
  });

  it('routes state filters through path segments and uppercases the code', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ members: [], pagination: { count: 0 } }),
    );
    await collect(congress(fetchFn).members.list({ state: 'ca' }));
    expect(requests[0]!.url.pathname).toBe('/v3/member/CA');
  });

  it('routes state + district filters', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ members: [], pagination: { count: 0 } }),
    );
    await collect(congress(fetchFn).members.list({ state: 'CA', district: 11 }));
    expect(requests[0]!.url.pathname).toBe('/v3/member/CA/11');
  });

  it('routes congress filter and passes currentMember as a query param', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ members: [], pagination: { count: 0 } }),
    );
    await collect(congress(fetchFn).members.list({ congress: 118, currentMember: true }));

    expect(requests[0]!.url.pathname).toBe('/v3/member/congress/118');
    expect(requests[0]!.url.searchParams.get('currentMember')).toBe('true');
  });

  it('routes congress + state + district filters', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ members: [], pagination: { count: 0 } }),
    );
    await collect(congress(fetchFn).members.list({ congress: 118, state: 'ca', district: 11 }));
    expect(requests[0]!.url.pathname).toBe('/v3/member/congress/118/CA/11');
  });

  it('rejects congress + state without district (upstream limitation)', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).members.list({ congress: 118, state: 'CA' })).toThrow(
      /requires a district|with a district/,
    );
  });

  it('rejects district without state', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).members.list({ district: 11 })).toThrow(/requires state/);
  });

  it('gets one member by bioguide id', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({ member: { bioguideId: 'P000197', directOrderName: 'Nancy Pelosi' } }),
    );
    const member = await congress(fetchFn).member('P000197');

    expect(requests[0]!.url.pathname).toBe('/v3/member/P000197');
    expect(member.directOrderName).toBe('Nancy Pelosi');
  });

  it('iterates sponsored legislation', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        sponsoredLegislation: [{ congress: 118, number: '21', type: 'HR' }],
        pagination: { count: 1 },
      }),
    );
    const items = await collect(congress(fetchFn).members.sponsoredLegislation('P000197'));

    expect(requests[0]!.url.pathname).toBe('/v3/member/P000197/sponsored-legislation');
    expect(items[0]!.number).toBe('21');
  });
});
