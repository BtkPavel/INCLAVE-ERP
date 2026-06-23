import { useEffect, useRef } from 'react';
import type { AppNotification } from '../api/types/notifications';
import { useNotificationBell } from '../notifications/useTaskNotifications';
import styles from './NotificationBell.module.css';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type: AppNotification['type']): string {
  if (type === 'task_assigned') return 'Назначение';
  if (type === 'task_comment') return 'Комментарий';
  return 'Статус';
}

export function NotificationBell() {
  const { unread, permission, open, setOpen, items, loading, handleClick } = useNotificationBell();
  const rootRef = useRef<HTMLDivElement>(null);
  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.bell} ${isGranted ? styles.active : ''} ${isDenied ? styles.denied : ''}`}
        onClick={() => void handleClick()}
        aria-label={
          isGranted
            ? `Уведомления${unread > 0 ? `, ${unread} непрочитанных` : ''}`
            : isDenied
              ? 'Уведомления заблокированы в браузере'
              : 'Включить уведомления о задачах'
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className={styles.icon} aria-hidden>
          🔔
        </span>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && isGranted && (
        <div className={styles.panel} role="dialog" aria-label="Уведомления">
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Уведомления</h3>
          </div>

          {loading ? (
            <p className={styles.panelEmpty}>Загрузка…</p>
          ) : items.length === 0 ? (
            <p className={styles.panelEmpty}>Уведомлений нет</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <span className={styles.itemType}>{typeLabel(item.type)}</span>
                  <p className={styles.itemMessage}>{item.message}</p>
                  <span className={styles.itemTime}>{formatTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
