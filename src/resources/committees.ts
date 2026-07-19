import type { CongressClient, QueryParams } from '../client';
import type { CountUrlRef } from './bills';

export type Chamber = 'house' | 'senate' | 'joint';

export interface CommitteeRef {
  name?: string;
  systemCode?: string;
  url?: string;
}

export interface CommitteeListItem {
  chamber?: string;
  committeeTypeCode?: string;
  name?: string;
  systemCode?: string;
  parent?: CommitteeRef;
  subcommittees?: CommitteeRef[];
  updateDate?: string;
  url?: string;
}

export interface CommitteeHistoryEntry {
  officialName?: string;
  libraryOfCongressName?: string;
  startDate?: string;
  endDate?: string;
  committeeTypeCode?: string;
  establishingAuthority?: string;
  naraId?: string;
  locLinkedDataId?: string;
  superintendentDocumentNumber?: string;
  updateDate?: string;
}

export interface CommitteeDetail {
  systemCode?: string;
  type?: string;
  isCurrent?: boolean;
  history?: CommitteeHistoryEntry[];
  parent?: CommitteeRef;
  subcommittees?: CommitteeRef[];
  bills?: CountUrlRef;
  reports?: CountUrlRef;
  nominations?: CountUrlRef;
  communications?: CountUrlRef;
  updateDate?: string;
}

export interface CommitteeBill {
  congress?: number;
  number?: string;
  type?: string;
  relationshipType?: string;
  actionDate?: string;
  updateDate?: string;
  url?: string;
}

export interface CommitteeReportRef {
  chamber?: string;
  citation?: string;
  congress?: number;
  number?: number;
  part?: number;
  type?: string;
  updateDate?: string;
  url?: string;
}

export interface CommitteeNominationRef {
  citation?: string;
  congress?: number;
  description?: string;
  latestAction?: { actionDate?: string; text?: string };
  nominationType?: { isCivilian?: boolean; isMilitary?: boolean };
  number?: number;
  partNumber?: string;
  receivedDate?: string;
  updateDate?: string;
  url?: string;
}

export interface CommitteesListParams {
  congress?: number | string;
  chamber?: Chamber | string;
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export interface PageOnlyParams {
  limit?: number;
  offset?: number;
}

export class CommitteesResource {
  constructor(private readonly client: CongressClient) {}

  list(params: CommitteesListParams = {}): AsyncGenerator<CommitteeListItem> {
    const { congress, chamber, ...query } = params;
    let path = '/committee';
    if (congress !== undefined) path += `/${congress}`;
    if (chamber !== undefined) path += `/${String(chamber).toLowerCase()}`;
    return this.client.paginate<CommitteeListItem>(path, 'committees', query as QueryParams);
  }

  /** Get one committee by chamber + system code, e.g. get('house', 'hspw00'). */
  async get(chamber: Chamber | string, systemCode: string): Promise<CommitteeDetail> {
    const data = await this.client.get<{ committee: CommitteeDetail }>(
      this.itemPath(chamber, systemCode),
    );
    return data.committee;
  }

  /** Bills referred to a committee. */
  bills(
    chamber: Chamber | string,
    systemCode: string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<CommitteeBill> {
    return this.client.paginate<CommitteeBill>(
      `${this.itemPath(chamber, systemCode)}/bills`,
      'committee-bills.bills',
      params as QueryParams,
    );
  }

  reports(
    chamber: Chamber | string,
    systemCode: string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<CommitteeReportRef> {
    return this.client.paginate<CommitteeReportRef>(
      `${this.itemPath(chamber, systemCode)}/reports`,
      'reports',
      params as QueryParams,
    );
  }

  /** Nominations before a committee (Senate committees only). */
  nominations(
    chamber: Chamber | string,
    systemCode: string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<CommitteeNominationRef> {
    return this.client.paginate<CommitteeNominationRef>(
      `${this.itemPath(chamber, systemCode)}/nominations`,
      'nominations',
      params as QueryParams,
    );
  }

  private itemPath(chamber: Chamber | string, systemCode: string): string {
    return `/committee/${String(chamber).toLowerCase()}/${encodeURIComponent(systemCode)}`;
  }
}
