import type { ReactNode } from 'react';
import type { ApiResourceState } from '../hooks/useApiResource';
import styles from './ApiModuleShell.module.css';

interface ApiModuleShellProps<T> {
  state: ApiResourceState<T>;
  emptyTitle: string;
  emptyDescription: string;
  figLabel: string;
  children?: (data: T) => ReactNode;
}

export function ApiModuleShell<T>({
  state,
  emptyTitle,
  emptyDescription,
  figLabel,
  children,
}: ApiModuleShellProps<T>) {
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className={styles.status}>
        <span className={styles.spinner} aria-hidden />
        <p>Загрузка данных API…</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={styles.error} role="alert">
        <p className={styles.errorTitle}>Ошибка API</p>
        <p className={styles.errorText}>{state.error}</p>
      </div>
    );
  }

  const isEmpty =
    Array.isArray(state.data)
      ? state.data.length === 0
      : state.data &&
          typeof state.data === 'object' &&
          'data' in state.data &&
          Array.isArray((state.data as { data: unknown[] }).data) &&
          (state.data as { data: unknown[] }).data.length === 0;

  if (isEmpty && !children) {
    return (
      <div className={styles.empty}>
        <span className={styles.fig}>{figLabel}</span>
        <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
        <p className={styles.emptyDesc}>{emptyDescription}</p>
        <span className={styles.badge}>API подключён · данных нет</span>
      </div>
    );
  }

  if (children) {
    return <>{children(state.data)}</>;
  }

  return null;
}
