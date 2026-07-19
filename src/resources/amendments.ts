import type { CongressClient, QueryParams } from '../client';
import type {
  BillAction,
  BillCosponsor,
  BillSponsor,
  BillTextVersion,
  CountUrlRef,
  LatestAction,
} from './bills';

export type AmendmentType = 'hamdt' | 'samdt' | 'suamdt';

export interface AmendmentListItem {
  congress?: number;
  number?: string;
  type?: string;
  description?: string;
  purpose?: string;
  latestAction?: LatestAction;
  updateDate?: string;
  url?: string;
}

export interface AmendedBillRef {
  congress?: number;
  number?: string;
  type?: string;
  originChamber?: string;
  originChamberCode?: string;
  title?: string;
  url?: string;
}

export interface AmendmentDetail extends AmendmentListItem {
  chamber?: string;
  proposedDate?: string | null;
  submittedDate?: string;
  amendedBill?: AmendedBillRef;
  sponsors?: BillSponsor[];
  onBehalfOfSponsor?: {
    bioguideId?: string;
    fullName?: string;
    type?: string;
    url?: string;
  }[];
  actions?: CountUrlRef;
  cosponsors?: CountUrlRef & { countIncludingWithdrawnCosponsors?: number };
  amendmentsToAmendment?: CountUrlRef;
  textVersions?: CountUrlRef;
  notes?: string;
}

export interface AmendmentsListParams {
  congress?: number | string;
  amendmentType?: AmendmentType | string;
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
  offset?: number;
}

export interface PageOnlyParams {
  limit?: number;
  offset?: number;
}

export class AmendmentsResource {
  constructor(private readonly client: CongressClient) {}

  list(params: AmendmentsListParams = {}): AsyncGenerator<AmendmentListItem> {
    const { congress, amendmentType, ...query } = params;
    if (amendmentType !== undefined && congress === undefined) {
      throw new Error('congress-api: filtering amendments by amendmentType requires congress');
    }
    let path = '/amendment';
    if (congress !== undefined) path += `/${congress}`;
    if (amendmentType !== undefined) path += `/${String(amendmentType).toLowerCase()}`;
    return this.client.paginate<AmendmentListItem>(path, 'amendments', query as QueryParams);
  }

  /** Get one amendment, e.g. get(117, 'samdt', 2137). */
  async get(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
  ): Promise<AmendmentDetail> {
    const data = await this.client.get<{ amendment: AmendmentDetail }>(
      this.itemPath(congress, amendmentType, amendmentNumber),
    );
    return data.amendment;
  }

  actions(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<BillAction> {
    return this.client.paginate<BillAction>(
      `${this.itemPath(congress, amendmentType, amendmentNumber)}/actions`,
      'actions',
      params as QueryParams,
    );
  }

  cosponsors(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<BillCosponsor> {
    return this.client.paginate<BillCosponsor>(
      `${this.itemPath(congress, amendmentType, amendmentNumber)}/cosponsors`,
      'cosponsors',
      params as QueryParams,
    );
  }

  /** Amendments to an amendment. */
  amendments(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<AmendmentListItem> {
    return this.client.paginate<AmendmentListItem>(
      `${this.itemPath(congress, amendmentType, amendmentNumber)}/amendments`,
      'amendments',
      params as QueryParams,
    );
  }

  /** Text versions — available for amendments from the 117th Congress onward. */
  text(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
    params: PageOnlyParams = {},
  ): AsyncGenerator<BillTextVersion> {
    return this.client.paginate<BillTextVersion>(
      `${this.itemPath(congress, amendmentType, amendmentNumber)}/text`,
      'textVersions',
      params as QueryParams,
    );
  }

  private itemPath(
    congress: number | string,
    amendmentType: AmendmentType | string,
    amendmentNumber: number | string,
  ): string {
    return `/amendment/${congress}/${String(amendmentType).toLowerCase()}/${amendmentNumber}`;
  }
}
