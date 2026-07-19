import type { CongressClient, QueryParams } from '../client';

export interface CongressSession {
  chamber?: string;
  number?: number;
  type?: string;
  startDate?: string;
  endDate?: string | null;
}

export interface CongressInfo {
  name?: string;
  number?: number;
  startYear?: string;
  endYear?: string;
  sessions?: CongressSession[];
  updateDate?: string;
  url?: string;
}

export interface PageOnlyParams {
  limit?: number;
  offset?: number;
}

export class CongressesResource {
  constructor(private readonly client: CongressClient) {}

  /** Iterate all congresses, most recent first. */
  list(params: PageOnlyParams = {}): AsyncGenerator<CongressInfo> {
    return this.client.paginate<CongressInfo>('/congress', 'congresses', params as QueryParams);
  }

  /** Get one congress by number, e.g. get(118). */
  async get(congressNumber: number | string): Promise<CongressInfo> {
    const data = await this.client.get<{ congress: CongressInfo }>(
      `/congress/${congressNumber}`,
    );
    return data.congress;
  }

  /** Get the congress currently in session. */
  async current(): Promise<CongressInfo> {
    const data = await this.client.get<{ congress: CongressInfo }>('/congress/current');
    return data.congress;
  }
}
