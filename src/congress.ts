import { CongressClient, type CongressClientOptions } from './client';
import { BillsResource, type BillDetail, type BillType } from './resources/bills';
import { MembersResource, type MemberDetail } from './resources/members';
import { VotesResource, type HouseRollCallVote } from './resources/votes';

/**
 * Entry point for the Congress.gov API.
 *
 * ```ts
 * const congress = new Congress({ apiKey: process.env.CONGRESS_API_KEY! });
 * const bill = await congress.bill(118, 'hr', 1);
 * ```
 */
export class Congress {
  readonly client: CongressClient;
  readonly bills: BillsResource;
  readonly members: MembersResource;
  readonly votes: VotesResource;

  constructor(options: CongressClientOptions) {
    this.client = new CongressClient(options);
    this.bills = new BillsResource(this.client);
    this.members = new MembersResource(this.client);
    this.votes = new VotesResource(this.client);
  }

  /** Shorthand for `bills.get()`. */
  bill(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
  ): Promise<BillDetail> {
    return this.bills.get(congress, billType, billNumber);
  }

  /** Shorthand for `members.get()`. */
  member(bioguideId: string): Promise<MemberDetail> {
    return this.members.get(bioguideId);
  }

  /** Shorthand for `votes.get()` — House roll call votes. */
  vote(
    congress: number | string,
    session: number | string,
    voteNumber: number | string,
  ): Promise<HouseRollCallVote> {
    return this.votes.get(congress, session, voteNumber);
  }
}
