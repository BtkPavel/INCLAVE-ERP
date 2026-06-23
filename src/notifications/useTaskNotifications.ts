import { useEffect, useState } from 'react';
import { notificationsApi } from '../api/modules/notifications.api';
import type { AppNotification } from '../api/types/notifications';
import { useAuth } from '../auth/AuthContext';
import {
  getNotificationState,
  requestNotificationPermission,
  showAppNotification,
  showWelcomeNotification,
  type NotificationPermissionState,
} from './notifications';

const POLL_INTERVAL_MS = 15_000;
const SEEN_KEY = 'inclave-seen-notification-ids';
const ENABLED_AT_KEY = 'inclave-notifications-enabled-at';

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  const list = [...ids].slice(-500);
  localStorage.setItem(SEEN_KEY, JSON.stringify(list));
}

function notificationTitle(type: AppNotification['type']): string {
  if (type === 'task_assigned') return 'INCLAVE ERP · Назначение';
  if (type === 'task_comment') return 'INCLAVE ERP · Комментарий';
  return 'INCLAVE ERP · Статус задачи';
}

export function useNotifications(): {
  unread: number;
  permission: NotificationPermissionState;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [permission, setPermission] = useState<NotificationPermissionState>('default');

  useEffect(() => {
    setPermission(getNotificationState());
  }, []);

  async function poll(): Promise<void> {
    if (!user || apiClientDisabled()) return;
    try {
      const response = await notificationsApi.list();
      setUnread(response.meta.unread);
      if (getNotificationState() !== 'granted') return;

      const seen = loadSeenIds();
      const enabledAt = localStorage.getItem(ENABLED_AT_KEY);
      let changed = false;
      const toMarkRead: string[] = [];

      for (const item of response.data) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        changed = true;

        if (!item.read) {
          const isAfterEnable = !enabledAt || new Date(item.createdAt) > new Date(enabledAt);
          if (isAfterEnable) {
            showAppNotification(notificationTitle(item.type), item.message, `inclave-notif-${item.id}`);
            toMarkRead.push(item.id);
          }
        }
      }
      if (changed) {
        saveSeenIds(seen);
        if (toMarkRead.length > 0) {
          const result = await notificationsApi.markRead(toMarkRead);
          setUnread(result.data.unread);
        }
      }
    } catch {
      // ignore polling errors
    }
  }

  useEffect(() => {
    if (!user) return;
    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [user]);

  return { unread, permission, refresh: poll };
}

function apiClientDisabled(): boolean {
  return import.meta.env.VITE_API_MOCK === 'true';
}

export function useNotificationBell() {
  const { user } = useAuth();
  const { unread, permission, refresh } = useNotifications();
  const [localPermission, setLocalPermission] = useState<NotificationPermissionState>(permission);

  useEffect(() => {
    setLocalPermission(permission);
  }, [permission]);

  async function enableNotifications(): Promise<void> {
    const result = await requestNotificationPermission();
    setLocalPermission(result);
    if (result === 'granted' && user) {
      localStorage.setItem(ENABLED_AT_KEY, new Date().toISOString());
      showWelcomeNotification(user.name);
      await refresh();
    } else if (result === 'granted') {
      localStorage.setItem(ENABLED_AT_KEY, new Date().toISOString());
    }
  }

  return { unread, permission: localPermission, enableNotifications, refresh };
}
