import { CongressClient, type CongressClientOptions } from './client';
import {
  AmendmentsResource,
  type AmendmentDetail,
  type AmendmentType,
} from './resources/amendments';
import { BillsResource, type BillDetail, type BillType } from './resources/bills';
import { CommitteesResource, type Chamber, type CommitteeDetail } from './resources/committees';
import { CongressesResource } from './resources/congresses';
import { MembersResource, type MemberDetail } from './resources/members';
import { NominationsResource, type NominationDetail } from './resources/nominations';
import { RecordResource } from './resources/record';
import { TreatiesResource, type TreatyDetail } from './resources/treaties';
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
  readonly committees: CommitteesResource;
  readonly nominations: NominationsResource;
  readonly treaties: TreatiesResource;
  readonly amendments: AmendmentsResource;
  readonly record: RecordResource;
  readonly congresses: CongressesResource;

  constructor(options: CongressClientOptions) {
    this.client = new CongressClient(options);
    this.bills = new BillsResource(this.client);
    this.members = new MembersResource(this.client);
    this.votes = new VotesResource(this.client);
    this.committees = new CommitteesResource(this.client);
    this.nominations = new NominationsResource(this.client);
    this.treaties = new TreatiesResource(this.client);
    this.amendments = new AmendmentsResource(this.client);
    this.record = new RecordResource(this.client);
    this.congresses = new CongressesResource(this.client);
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

  /** Shorthand for `committees.get()`. */
  committee(chamber: Chamber | string, systemCode: string): Promise<CommitteeDetail> {
    return this.committees.get(chamber, systemCode);
  }

  /** Shorthand for `nominations.get()`. */
  nomination(
    congress: number | string,
    nominationNumber: number | string,
  ): Promise<NominationDetail> {
    return this.nominations.get(congress, nominationNumber);
  }

  /** Shorthand for `treaties.get()`. */
  treaty(
    congress: number | string,
    treatyNumber: number | string,
    suffix?: string,
  ): Promise<TreatyDetail> {
    return this.treaties.get(congress, treatyNumber, suffix);
  }

  /** Shorthand for `amendments.get()`. */
  amendment(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
  ): Promise<AmendmentDetail> {
    return this.amendments.get(congress, amendmentType, amendmentNumber);
  }
}
