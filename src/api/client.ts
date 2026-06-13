import { SESSION_KEY } from '../auth/users';
import { ApiError, networkError } from './errors';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  params?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

function isMockMode(): boolean {
  return import.meta.env.VITE_API_MOCK === 'true';
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('inclave-erp-token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (isJson && typeof payload === 'object' && payload !== null && 'message' in payload) {
      throw new ApiError(response.status, payload as { code: string; message: string });
    }
    throw new ApiError(response.status, {
      code: 'HTTP_ERROR',
      message: typeof payload === 'string' ? payload : `HTTP ${response.status}`,
    });
  }

  return payload as T;
}

export const apiClient = {
  isMockMode,

  async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = `${getBaseUrl()}${path}${buildQuery(options.params)}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      return parseResponse<T>(response);
    } catch (error) {
      if (ApiError.isApiError(error)) throw error;
      throw networkError();
    }
  },

  get<T>(path: string, options?: { params?: QueryParams; headers?: Record<string, string> }) {
    return this.request<T>('GET', path, options);
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('POST', path, { ...options, body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('PATCH', path, { ...options, body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('PUT', path, { ...options, body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('DELETE', path, options);
  },
};

export function saveAuthToken(token: string): void {
  localStorage.setItem('inclave-erp-token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('inclave-erp-token');
  localStorage.removeItem(SESSION_KEY);
}

function emptyPage<T>(page = 1, perPage = 20): { data: T[]; meta: { page: number; perPage: number; total: number; totalPages: number } } {
  return { data: [], meta: { page, perPage, total: 0, totalPages: 0 } };
}

export const apiMocks = {
  emptyPage,
};
