import type { CongressClient, QueryParams } from '../client';
import type { CountUrlRef, LatestAction } from './bills';

export interface MemberTermItem {
  chamber?: string;
  startYear?: number;
  endYear?: number | null;
}

export interface MemberListItem {
  bioguideId: string;
  name?: string;
  state?: string;
  district?: number | null;
  partyName?: string;
  terms?: { item?: MemberTermItem[] };
  depiction?: { attribution?: string; imageUrl?: string };
  updateDate?: string;
  url?: string;
}

export interface MemberDetailTerm {
  chamber?: string;
  congress?: number;
  memberType?: string;
  startYear?: number;
  endYear?: number | null;
  stateCode?: string;
  stateName?: string;
  district?: number | null;
}

export interface MemberDetail {
  bioguideId: string;
  directOrderName?: string;
  invertedOrderName?: string;
  honorificName?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  currentMember?: boolean;
  state?: string;
  district?: number | null;
  partyHistory?: { partyAbbreviation?: string; partyName?: string; startYear?: number }[];
  terms?: MemberDetailTerm[];
  leadership?: { congress?: number; type?: string }[];
  depiction?: { attribution?: string; imageUrl?: string };
  addressInformation?: {
    officeAddress?: string;
    city?: string;
    district?: string;
    zipCode?: number;
    phoneNumber?: string;
  };
  officialWebsiteUrl?: string;
  sponsoredLegislation?: CountUrlRef;
  cosponsoredLegislation?: CountUrlRef;
  updateDate?: string;
}

export interface MemberLegislationItem {
  congress?: number;
  number?: string;
  type?: string;
  title?: string;
  introducedDate?: string;
  policyArea?: { name?: string };
  latestAction?: LatestAction;
  url?: string;
}

export interface MembersListParams {
  /** Filter to members who served in a given congress, e.g. 118. */
  congress?: number | string;
  /** Two-letter state code, e.g. 'CA'. */
  state?: string;
  /** District number — requires state. */
  district?: number | string;
  /** Only members currently serving. */
  currentMember?: boolean;
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export class MembersResource {
  constructor(private readonly client: CongressClient) {}

  list(params: MembersListParams = {}): AsyncGenerator<MemberListItem> {
    const { congress, state, district, ...query } = params;
    let path = '/member';
    if (congress !== undefined && state !== undefined) {
      if (district === undefined) {
        throw new Error(
          'congress-api: Congress.gov only supports congress+state member filtering with a district. Add district, or drop congress or state.',
        );
      }
      path = `/member/congress/${congress}/${String(state).toUpperCase()}/${district}`;
    } else if (congress !== undefined) {
      path = `/member/congress/${congress}`;
    } else if (state !== undefined) {
      path =
        district !== undefined
          ? `/member/${String(state).toUpperCase()}/${district}`
          : `/member/${String(state).toUpperCase()}`;
    } else if (district !== undefined) {
      throw new Error('congress-api: filtering members by district requires state');
    }
    return this.client.paginate<MemberListItem>(path, 'members', query as QueryParams);
  }

  /** Get one member by Bioguide ID, e.g. get('P000197'). */
  async get(bioguideId: string): Promise<MemberDetail> {
    const data = await this.client.get<{ member: MemberDetail }>(
      `/member/${encodeURIComponent(bioguideId)}`,
    );
    return data.member;
  }

  sponsoredLegislation(
    bioguideId: string,
    params: { limit?: number; offset?: number } = {},
  ): AsyncGenerator<MemberLegislationItem> {
    return this.client.paginate<MemberLegislationItem>(
      `/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`,
      'sponsoredLegislation',
      params as QueryParams,
    );
  }

  cosponsoredLegislation(
    bioguideId: string,
    params: { limit?: number; offset?: number } = {},
  ): AsyncGenerator<MemberLegislationItem> {
    return this.client.paginate<MemberLegislationItem>(
      `/member/${encodeURIComponent(bioguideId)}/cosponsored-legislation`,
      'cosponsoredLegislation',
      params as QueryParams,
    );
  }
}
