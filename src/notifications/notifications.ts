export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationState(): NotificationPermissionState {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

export function showWelcomeNotification(userName: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP', {
    body: `Добро пожаловать, ${userName}. Уведомления включены.`,
    icon: '/icon-192.png',
    tag: 'inclave-erp-welcome',
  });
}

export function showEventReminder(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP · Календарь', {
    body: `${title} — ${body}`,
    icon: '/icon-192.png',
    tag: `inclave-event-${title}-${Date.now()}`,
  });
}
