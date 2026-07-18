import type { CongressClient, QueryParams } from '../client';

export type BillType =
  | 'hr'
  | 's'
  | 'hjres'
  | 'sjres'
  | 'hconres'
  | 'sconres'
  | 'hres'
  | 'sres';

export interface LatestAction {
  actionDate?: string;
  actionTime?: string;
  text?: string;
}

export interface CountUrlRef {
  count?: number;
  url?: string;
}

export interface BillListItem {
  congress: number;
  number: string;
  type: string;
  title?: string;
  originChamber?: string;
  originChamberCode?: string;
  latestAction?: LatestAction;
  updateDate?: string;
  updateDateIncludingText?: string;
  url?: string;
}

export interface BillSponsor {
  bioguideId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  state?: string;
  district?: number;
  isByRequest?: string;
  url?: string;
}

export interface BillDetail extends BillListItem {
  introducedDate?: string;
  policyArea?: { name?: string };
  sponsors?: BillSponsor[];
  laws?: { number?: string; type?: string }[];
  constitutionalAuthorityStatementText?: string;
  actions?: CountUrlRef;
  amendments?: CountUrlRef;
  committees?: CountUrlRef;
  cosponsors?: CountUrlRef & { countIncludingWithdrawnCosponsors?: number };
  relatedBills?: CountUrlRef;
  subjects?: CountUrlRef;
  summaries?: CountUrlRef;
  textVersions?: CountUrlRef;
  titles?: CountUrlRef;
}

export interface RecordedVote {
  chamber?: string;
  congress?: number;
  date?: string;
  rollNumber?: number;
  sessionNumber?: number;
  url?: string;
}

export interface BillAction {
  actionCode?: string;
  actionDate?: string;
  actionTime?: string;
  text?: string;
  type?: string;
  sourceSystem?: { code?: number; name?: string };
  recordedVotes?: RecordedVote[];
}

export interface BillCosponsor {
  bioguideId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  state?: string;
  district?: number;
  sponsorshipDate?: string;
  isOriginalCosponsor?: boolean;
  sponsorshipWithdrawnDate?: string;
  url?: string;
}

export interface BillSubjects {
  legislativeSubjects?: { name?: string; updateDate?: string }[];
  policyArea?: { name?: string; updateDate?: string };
}

export interface BillSummary {
  actionDate?: string;
  actionDesc?: string;
  text?: string;
  updateDate?: string;
  versionCode?: string;
}

export interface BillTextVersion {
  date?: string | null;
  type?: string;
  formats?: { type?: string; url?: string }[];
}

export interface BillTitle {
  title?: string;
  titleType?: string;
  titleTypeCode?: number;
  updateDate?: string;
  billTextVersionCode?: string;
  billTextVersionName?: string;
}

export interface BillsListParams {
  congress?: number | string;
  billType?: BillType | string;
  fromDateTime?: string;
  toDateTime?: string;
  sort?: 'updateDate+asc' | 'updateDate+desc';
  limit?: number;
  offset?: number;
}

export interface PageParams {
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export class BillsResource {
  constructor(private readonly client: CongressClient) {}

  /** Iterate bills, newest-updated first. Filter by congress and bill type. */
  list(params: BillsListParams = {}): AsyncGenerator<BillListItem> {
    const { congress, billType, ...query } = params;
    if (billType !== undefined && congress === undefined) {
      throw new Error('congress-api: filtering bills by billType requires congress');
    }
    let path = '/bill';
    if (congress !== undefined) path += `/${congress}`;
    if (billType !== undefined) path += `/${String(billType).toLowerCase()}`;
    return this.client.paginate<BillListItem>(path, 'bills', query as QueryParams);
  }

  /** Get full details for one bill, e.g. get(118, 'hr', 1). */
  async get(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
  ): Promise<BillDetail> {
    const data = await this.client.get<{ bill: BillDetail }>(
      this.itemPath(congress, billType, billNumber),
    );
    return data.bill;
  }

  actions(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
    params: PageParams = {},
  ): AsyncGenerator<BillAction> {
    return this.client.paginate<BillAction>(
      `${this.itemPath(congress, billType, billNumber)}/actions`,
      'actions',
      params as QueryParams,
    );
  }

  cosponsors(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
    params: PageParams = {},
  ): AsyncGenerator<BillCosponsor> {
    return this.client.paginate<BillCosponsor>(
      `${this.itemPath(congress, billType, billNumber)}/cosponsors`,
      'cosponsors',
      params as QueryParams,
    );
  }

  /** Legislative subjects + policy area for one bill. */
  async subjects(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
  ): Promise<BillSubjects> {
    const data = await this.client.get<{ subjects?: BillSubjects }>(
      `${this.itemPath(congress, billType, billNumber)}/subjects`,
    );
    return data.subjects ?? {};
  }

  summaries(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
    params: PageParams = {},
  ): AsyncGenerator<BillSummary> {
    return this.client.paginate<BillSummary>(
      `${this.itemPath(congress, billType, billNumber)}/summaries`,
      'summaries',
      params as QueryParams,
    );
  }

  /** Text versions (PDF/HTML/XML links) for one bill. */
  text(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
    params: PageParams = {},
  ): AsyncGenerator<BillTextVersion> {
    return this.client.paginate<BillTextVersion>(
      `${this.itemPath(congress, billType, billNumber)}/text`,
      'textVersions',
      params as QueryParams,
    );
  }

  titles(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
    params: PageParams = {},
  ): AsyncGenerator<BillTitle> {
    return this.client.paginate<BillTitle>(
      `${this.itemPath(congress, billType, billNumber)}/titles`,
      'titles',
      params as QueryParams,
    );
  }

  private itemPath(
    congress: number | string,
    billType: BillType | string,
    billNumber: number | string,
  ): string {
    return `/bill/${congress}/${String(billType).toLowerCase()}/${billNumber}`;
  }
}
