import { useEffect, useState } from 'react';
import {
  getNotificationState,
  requestNotificationPermission,
  showWelcomeNotification,
  type NotificationPermissionState,
} from '../notifications/notifications';
import { useAuth } from '../auth/AuthContext';
import styles from './NotificationBanner.module.css';

export function NotificationBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationPermissionState>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setState(getNotificationState());
  }, []);

  if (!user || dismissed || state === 'granted' || state === 'unsupported') {
    return null;
  }

  async function handleEnable() {
    const result = await requestNotificationPermission();
    setState(result);
    if (result === 'granted' && user) {
      showWelcomeNotification(user.name);
      setDismissed(true);
    }
  }

  return (
    <div className={styles.banner} role="status">
      <div className={styles.content}>
        <span className={styles.icon}>🔔</span>
        <div>
          <p className={styles.title}>Включите уведомления</p>
          <p className={styles.text}>
            {state === 'denied'
              ? 'Уведомления заблокированы в настройках браузера. Разрешите их вручную.'
              : 'Получайте оповещения о задачах и событиях в календаре.'}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        {state !== 'denied' && (
          <button type="button" className={styles.enableBtn} onClick={handleEnable}>
            Разрешить
          </button>
        )}
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={() => setDismissed(true)}
        >
          Позже
        </button>
      </div>
    </div>
  );
}
