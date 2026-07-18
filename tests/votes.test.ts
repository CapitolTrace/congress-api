import { describe, expect, it } from 'vitest';
import { Congress } from '../src/congress';
import { collect, jsonResponse, makeFetch } from './helpers';

function congress(fetchFn: ReturnType<typeof makeFetch>['fetchFn']) {
  return new Congress({ apiKey: 'test-key', fetch: fetchFn, retryBaseDelayMs: 0 });
}

describe('VotesResource', () => {
  it('lists House roll call votes scoped to congress and session', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        houseRollCallVotes: [{ congress: 119, rollCallNumber: 17, result: 'Passed' }],
        pagination: { count: 1 },
      }),
    );
    const votes = await collect(congress(fetchFn).votes.list({ congress: 119, session: 1 }));

    expect(requests[0]!.url.pathname).toBe('/v3/house-vote/119/1');
    expect(votes[0]!.rollCallNumber).toBe(17);
  });

  it('rejects session without congress', () => {
    const { fetchFn } = makeFetch(() => jsonResponse({}));
    expect(() => congress(fetchFn).votes.list({ session: 1 })).toThrow(/requires congress/);
  });

  it('gets one roll call vote and unwraps the envelope', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        houseRollCallVote: { congress: 119, rollCallNumber: 17, result: 'Passed' },
      }),
    );
    const vote = await congress(fetchFn).vote(119, 1, 17);

    expect(requests[0]!.url.pathname).toBe('/v3/house-vote/119/1/17');
    expect(vote.result).toBe('Passed');
  });

  it('fetches member positions for one vote', async () => {
    const { fetchFn, requests } = makeFetch(() =>
      jsonResponse({
        houseRollCallVoteMemberVotes: {
          congress: 119,
          rollCallNumber: 17,
          results: [{ bioguideID: 'P000197', voteCast: 'Nay' }],
        },
      }),
    );
    const memberVotes = await congress(fetchFn).votes.memberVotes(119, 1, 17);

    expect(requests[0]!.url.pathname).toBe('/v3/house-vote/119/1/17/members');
    expect(memberVotes.results?.[0]?.voteCast).toBe('Nay');
  });
});
