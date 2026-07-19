import type { CongressClient, QueryParams } from '../client';
import type { CountUrlRef } from './bills';

export interface TreatyPart {
  count?: number;
  urls?: string[];
}

export interface TreatyListItem {
  congressReceived?: number;
  congressConsidered?: number | null;
  number?: number;
  suffix?: string;
  topic?: string;
  transmittedDate?: string;
  parts?: TreatyPart;
  updateDate?: string;
  url?: string;
}

export interface TreatyDetail extends TreatyListItem {
  inForceDate?: string | null;
  oldNumber?: string | null;
  oldNumberDisplayName?: string | null;
  resolutionText?: string;
  countriesParties?: { name?: string }[];
  indexTerms?: { name?: string }[];
  relatedDocs?: { citation?: string; url?: string }[];
  titles?: { title?: string; titleType?: string }[];
  actions?: CountUrlRef;
}

export interface TreatyAction {
  actionCode?: string;
  actionDate?: string;
  text?: string;
  type?: string;
  committee?: { name?: string; systemCode?: string; url?: string } | null;
}

export interface TreatyCommittee {
  name?: string;
  chamber?: string;
  systemCode?: string;
  type?: string;
  subcommittees?: { name?: string; systemCode?: string; url?: string }[];
  activities?: { name?: string; date?: string }[];
  url?: string;
}

export interface TreatiesListParams {
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

export class TreatiesResource {
  constructor(private readonly client: CongressClient) {}

  list(params: TreatiesListParams = {}): AsyncGenerator<TreatyListItem> {
    const { congress, ...query } = params;
    const path = congress !== undefined ? `/treaty/${congress}` : '/treaty';
    return this.client.paginate<TreatyListItem>(path, 'treaties', query as QueryParams);
  }

  /**
   * Get one treaty, e.g. get(117, 3). Partitioned treaties take a suffix,
   * e.g. get(114, 13, 'A').
   */
  async get(
    congress: number | string,
    treatyNumber: number | string,
    suffix?: string,
  ): Promise<TreatyDetail> {
    const data = await this.client.get<{ treaty: TreatyDetail }>(
      this.itemPath(congress, treatyNumber, suffix),
    );
    return data.treaty;
  }

  actions(
    congress: number | string,
    treatyNumber: number | string,
    suffix?: string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<TreatyAction> {
    return this.client.paginate<TreatyAction>(
      `${this.itemPath(congress, treatyNumber, suffix)}/actions`,
      'actions',
      params as QueryParams,
    );
  }

  committees(
    congress: number | string,
    treatyNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<TreatyCommittee> {
    return this.client.paginate<TreatyCommittee>(
      `/treaty/${congress}/${treatyNumber}/committees`,
      'treatyCommittees',
      params as QueryParams,
    );
  }

  private itemPath(
    congress: number | string,
    treatyNumber: number | string,
    suffix?: string,
  ): string {
    let path = `/treaty/${congress}/${treatyNumber}`;
    if (suffix !== undefined) path += `/${encodeURIComponent(suffix)}`;
    return path;
  }
}
