export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export function networkError(message = 'Нет соединения с сервером'): ApiError {
  return new ApiError(0, { code: 'NETWORK_ERROR', message });
}
