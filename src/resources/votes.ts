import type { CongressClient, QueryParams } from '../client';

/**
 * House roll call votes, via Congress.gov's `house-vote` endpoints (beta).
 * Senate roll call votes are not yet published by the Congress.gov API.
 */
export interface HouseRollCallVoteListItem {
  congress?: number;
  identifier?: number;
  legislationNumber?: string;
  legislationType?: string;
  legislationUrl?: string;
  result?: string;
  rollCallNumber?: number;
  sessionNumber?: number;
  sourceDataURL?: string;
  startDate?: string;
  updateDate?: string;
  url?: string;
  voteType?: string;
}

export interface HouseVotePartyTotal {
  party?: { name?: string; type?: string };
  nayTotal?: number;
  yeaTotal?: number;
  notVotingTotal?: number;
  presentTotal?: number;
  voteParty?: string;
}

export interface HouseRollCallVote extends HouseRollCallVoteListItem {
  votePartyTotal?: HouseVotePartyTotal[];
  voteQuestion?: string;
}

export interface HouseVoteMemberPosition {
  bioguideID?: string;
  firstName?: string;
  lastName?: string;
  voteCast?: string;
  voteParty?: string;
  voteState?: string;
}

export interface HouseVoteMemberVotes extends HouseRollCallVoteListItem {
  results?: HouseVoteMemberPosition[];
  voteQuestion?: string;
}

export interface VotesListParams {
  congress?: number | string;
  /** Session number (1 or 2) — requires congress. */
  session?: number | string;
  limit?: number;
  offset?: number;
}

export class VotesResource {
  constructor(private readonly client: CongressClient) {}

  /** Iterate House roll call votes, optionally scoped to a congress/session. */
  list(params: VotesListParams = {}): AsyncGenerator<HouseRollCallVoteListItem> {
    const { congress, session, ...query } = params;
    if (session !== undefined && congress === undefined) {
      throw new Error('congress-api: filtering votes by session requires congress');
    }
    let path = '/house-vote';
    if (congress !== undefined) path += `/${congress}`;
    if (session !== undefined) path += `/${session}`;
    return this.client.paginate<HouseRollCallVoteListItem>(
      path,
      'houseRollCallVotes',
      query as QueryParams,
    );
  }

  /** Get one House roll call vote, e.g. get(119, 1, 17). */
  async get(
    congress: number | string,
    session: number | string,
    voteNumber: number | string,
  ): Promise<HouseRollCallVote> {
    const data = await this.client.get<{ houseRollCallVote: HouseRollCallVote }>(
      `/house-vote/${congress}/${session}/${voteNumber}`,
    );
    return data.houseRollCallVote;
  }

  /** How each member voted on one House roll call vote. */
  async memberVotes(
    congress: number | string,
    session: number | string,
    voteNumber: number | string,
  ): Promise<HouseVoteMemberVotes> {
    const data = await this.client.get<{
      houseRollCallVoteMemberVotes: HouseVoteMemberVotes;
    }>(`/house-vote/${congress}/${session}/${voteNumber}/members`);
    return data.houseRollCallVoteMemberVotes;
  }
}
