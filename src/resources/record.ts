import type { CongressClient, QueryParams } from '../client';

/**
 * The classic /congressional-record endpoint returns PascalCase keys —
 * a Congress.gov quirk this client passes through rather than hides.
 */
export interface RecordSectionLink {
  Label?: string;
  Ordinal?: number;
  PDF?: { Part?: string; Url?: string }[];
}

export interface RecordIssue {
  Congress?: string;
  Id?: number;
  Issue?: string;
  PublishDate?: string;
  Session?: string;
  Volume?: string;
  Links?: Record<string, RecordSectionLink>;
}

export interface DailyRecordIssue {
  congress?: number;
  issueDate?: string;
  issueNumber?: string;
  sessionNumber?: number;
  volumeNumber?: number;
  updateDate?: string;
  url?: string;
}

export interface RecordIssuesParams {
  /** Filter by year, e.g. 2023. */
  year?: number;
  /** Filter by month (1-12) — requires year for a meaningful result. */
  month?: number;
  /** Filter by day of month — requires year and month. */
  day?: number;
  limit?: number;
  offset?: number;
}

export interface DailyRecordListParams {
  volumeNumber?: number | string;
  /** Issue number — requires volumeNumber. */
  issueNumber?: number | string;
  limit?: number;
  offset?: number;
}

export class RecordResource {
  constructor(private readonly client: CongressClient) {}

  /** Congressional Record daily issues (classic endpoint, PascalCase keys). */
  async issues(params: RecordIssuesParams = {}): Promise<RecordIssue[]> {
    const { year, month, day, ...rest } = params;
    const data = await this.client.get<{ Results?: { Issues?: RecordIssue[] } }>(
      '/congressional-record',
      { ...rest, y: year, m: month, d: day } as QueryParams,
    );
    return data.Results?.Issues ?? [];
  }

  /** Daily Congressional Record issues (modern endpoint, auto-paginated). */
  daily(params: DailyRecordListParams = {}): AsyncGenerator<DailyRecordIssue> {
    const { volumeNumber, issueNumber, ...query } = params;
    if (issueNumber !== undefined && volumeNumber === undefined) {
      throw new Error('congress-api: filtering the daily record by issueNumber requires volumeNumber');
    }
    let path = '/daily-congressional-record';
    if (volumeNumber !== undefined) path += `/${volumeNumber}`;
    if (issueNumber !== undefined) path += `/${issueNumber}`;
    return this.client.paginate<DailyRecordIssue>(
      path,
      'dailyCongressionalRecord',
      query as QueryParams,
    );
  }
}
