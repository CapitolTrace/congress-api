export interface CongressApiErrorOptions {
  status: number;
  url: string;
  body?: unknown;
}

/** Thrown when the Congress.gov API returns a non-success response. */
export class CongressApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body?: unknown;

  constructor(message: string, options: CongressApiErrorOptions) {
    super(message);
    this.name = 'CongressApiError';
    this.status = options.status;
    this.url = options.url;
    this.body = options.body;
  }
}

/** Thrown when the rate limit is still exceeded after all retries. */
export class RateLimitError extends CongressApiError {
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    options: CongressApiErrorOptions & { retryAfterSeconds?: number },
  ) {
    super(message, options);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}
