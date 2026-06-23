import { useNotificationBell } from '../notifications/useTaskNotifications';
import styles from './NotificationBell.module.css';

export function NotificationBell() {
  const { unread, permission, enableNotifications } = useNotificationBell();
  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <button
      type="button"
      className={`${styles.bell} ${isGranted ? styles.active : ''} ${isDenied ? styles.denied : ''}`}
      onClick={() => void enableNotifications()}
      aria-label={
        isGranted
          ? `Уведомления включены${unread > 0 ? `, ${unread} непрочитанных` : ''}`
          : isDenied
            ? 'Уведомления заблокированы в браузере'
            : 'Включить уведомления о задачах'
      }
      title={
        isGranted
          ? 'Уведомления о задачах включены'
          : isDenied
            ? 'Разрешите уведомления в настройках браузера'
            : 'Включить уведомления'
      }
    >
      <span className={styles.icon} aria-hidden>
        🔔
      </span>
      {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
    </button>
  );
}
