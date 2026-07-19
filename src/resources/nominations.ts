import type { CongressClient, QueryParams } from '../client';
import type { CountUrlRef, LatestAction } from './bills';

export interface NominationListItem {
  congress?: number;
  number?: number;
  partNumber?: string;
  citation?: string;
  description?: string;
  organization?: string;
  receivedDate?: string;
  nominationType?: { isCivilian?: boolean; isMilitary?: boolean };
  latestAction?: LatestAction;
  updateDate?: string;
  url?: string;
}

export interface Nominee {
  ordinal?: number;
  introText?: string;
  organization?: string;
  positionTitle?: string;
  division?: string;
  nomineeCount?: number;
  url?: string;
}

export interface NominationDetail extends NominationListItem {
  isPrivileged?: boolean;
  isList?: boolean;
  executiveCalendarNumber?: string;
  nominees?: Nominee[];
  actions?: CountUrlRef;
  committees?: CountUrlRef;
  hearings?: CountUrlRef;
}

export interface NominationAction {
  actionCode?: string;
  actionDate?: string;
  actionType?: string;
  text?: string;
  committees?: { name?: string; systemCode?: string; url?: string }[];
}

export interface NominationCommitteeActivity {
  name?: string;
  date?: string;
}

export interface NominationCommittee {
  name?: string;
  chamber?: string;
  systemCode?: string;
  type?: string;
  activities?: NominationCommitteeActivity[];
  url?: string;
}

export interface NominationHearing {
  chamber?: string;
  citation?: string;
  date?: string;
  errataNumber?: number;
  jacketNumber?: number;
  number?: number;
  part?: number;
  updateDate?: string;
  url?: string;
}

export interface NomineePerson {
  ordinal?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  prefix?: string;
  suffix?: string;
  state?: string;
  effectiveDate?: string;
  predecessorName?: string;
  corpsCode?: string;
}

export interface NominationsListParams {
  congress?: number | string;
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export interface PageOnlyParams {
  limit?: number;
  offset?: number;
}

export class NominationsResource {
  constructor(private readonly client: CongressClient) {}

  list(params: NominationsListParams = {}): AsyncGenerator<NominationListItem> {
    const { congress, ...query } = params;
    const path = congress !== undefined ? `/nomination/${congress}` : '/nomination';
    return this.client.paginate<NominationListItem>(path, 'nominations', query as QueryParams);
  }

  /** Get one nomination, e.g. get(118, 12). */
  async get(congress: number | string, nominationNumber: number | string): Promise<NominationDetail> {
    const data = await this.client.get<{ nomination: NominationDetail }>(
      `/nomination/${congress}/${nominationNumber}`,
    );
    return data.nomination;
  }

  actions(
    congress: number | string,
    nominationNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<NominationAction> {
    return this.client.paginate<NominationAction>(
      `/nomination/${congress}/${nominationNumber}/actions`,
      'actions',
      params as QueryParams,
    );
  }

  committees(
    congress: number | string,
    nominationNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<NominationCommittee> {
    return this.client.paginate<NominationCommittee>(
      `/nomination/${congress}/${nominationNumber}/committees`,
      'committees',
      params as QueryParams,
    );
  }

  hearings(
    congress: number | string,
    nominationNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<NominationHearing> {
    return this.client.paginate<NominationHearing>(
      `/nomination/${congress}/${nominationNumber}/hearings`,
      'hearings',
      params as QueryParams,
    );
  }

  /** The individual nominees within one part of a partitioned nomination. */
  nominees(
    congress: number | string,
    nominationNumber: number | string,
    ordinal: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<NomineePerson> {
    return this.client.paginate<NomineePerson>(
      `/nomination/${congress}/${nominationNumber}/${ordinal}`,
      'nominees',
      params as QueryParams,
    );
  }
}
