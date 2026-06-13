import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/errors';

export type ApiResourceState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export function useApiResource<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiResourceState<T>>({ status: 'idle' });

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    fetcher()
      .then((data) => setState({ status: 'success', data }))
      .catch((err: unknown) => {
        const message = ApiError.isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Ошибка загрузки';
        setState({ status: 'error', error: message });
      });
  }, [fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
