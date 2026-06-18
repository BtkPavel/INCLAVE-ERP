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
    icon: '/icons/inclave-192.png',
    tag: 'inclave-erp-welcome',
  });
}

export function showEventReminder(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP · Календарь', {
    body: `${title} — ${body}`,
    icon: '/icons/inclave-192.png',
    tag: `inclave-event-${title}-${Date.now()}`,
  });
}

export function showTaskAssignedNotification(taskTitle: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP · Задачи', {
    body: `Вам назначена задача: «${taskTitle}»`,
    icon: '/icons/inclave-192.png',
    tag: `inclave-task-assigned-${Date.now()}`,
  });
}

export function showDirectorTaskAssignedNotification(taskTitle: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP · Product Office', {
    body: `Назначена задача: «${taskTitle}»`,
    icon: '/icons/inclave-192.png',
    tag: `inclave-director-task-assigned-${Date.now()}`,
  });
}

export function showDirectorTaskCompletedNotification(taskTitle: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('INCLAVE ERP · Product Office', {
    body: `Задача выполнена: «${taskTitle}»`,
    icon: '/icons/inclave-192.png',
    tag: `inclave-director-task-done-${Date.now()}`,
  });
}
