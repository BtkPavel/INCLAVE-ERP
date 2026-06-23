import crypto from 'node:crypto';

const STATUS_LABELS = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Выполнено',
  cancelled: 'Отменено',
};

export function loadNotifications(loadJson, key) {
  return loadJson(key, []);
}

export function saveNotifications(saveJson, key, notifications) {
  saveJson(key, notifications);
}

function pushNotification(notifications, payload) {
  notifications.push({
    id: crypto.randomUUID(),
    userRole: payload.userRole,
    type: payload.type,
    taskId: payload.taskId,
    taskTitle: payload.taskTitle,
    message: payload.message,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

export function notifyTaskAssigned(loadJson, saveJson, key, task, actorRole) {
  if (!task.assigneeId) return;
  const notifications = loadNotifications(loadJson, key);

  if (task.assigneeId !== actorRole) {
    pushNotification(notifications, {
      userRole: task.assigneeId,
      type: 'task_assigned',
      taskId: task.id,
      taskTitle: task.title,
      message: `Вам назначена задача: «${task.title}»`,
    });
  }

  if (actorRole !== 'director') {
    pushNotification(notifications, {
      userRole: 'director',
      type: 'task_assigned',
      taskId: task.id,
      taskTitle: task.title,
      message: `Назначена задача «${task.title}»`,
    });
  }

  saveNotifications(saveJson, key, notifications);
}

export function notifyTaskStatusChange(loadJson, saveJson, key, task, actorRole, oldStatus, newStatus) {
  if (oldStatus === newStatus) return;
  const notifications = loadNotifications(loadJson, key);
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const message = `Статус задачи «${task.title}»: ${statusLabel}`;

  if (task.assigneeId && task.assigneeId !== actorRole) {
    pushNotification(notifications, {
      userRole: task.assigneeId,
      type: 'task_status',
      taskId: task.id,
      taskTitle: task.title,
      message,
    });
  }

  if (actorRole !== 'director') {
    pushNotification(notifications, {
      userRole: 'director',
      type: 'task_status',
      taskId: task.id,
      taskTitle: task.title,
      message,
    });
  }

  saveNotifications(saveJson, key, notifications);
}

export function notifyTaskComment(loadJson, saveJson, key, task, actorRole, authorName, text) {
  const notifications = loadNotifications(loadJson, key);
  const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  const message = `Комментарий к «${task.title}»: ${preview}`;

  if (task.assigneeId && task.assigneeId !== actorRole) {
    pushNotification(notifications, {
      userRole: task.assigneeId,
      type: 'task_comment',
      taskId: task.id,
      taskTitle: task.title,
      message,
    });
  }

  if (actorRole !== 'director') {
    pushNotification(notifications, {
      userRole: 'director',
      type: 'task_comment',
      taskId: task.id,
      taskTitle: task.title,
      message: `${authorName}: ${preview}`,
    });
  }

  saveNotifications(saveJson, key, notifications);
}

export function listNotificationsForUser(loadJson, key, userRole, since) {
  let items = loadNotifications(loadJson, key).filter((item) => item.userRole === userRole);
  if (since) {
    const sinceMs = new Date(since).getTime();
    items = items.filter((item) => new Date(item.createdAt).getTime() > sinceMs);
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countUnreadForUser(loadJson, key, userRole) {
  return loadNotifications(loadJson, key).filter(
    (item) => item.userRole === userRole && !item.read,
  ).length;
}

export function markNotificationsRead(loadJson, saveJson, key, userRole, ids) {
  const notifications = loadNotifications(loadJson, key);
  const idSet = new Set(ids);
  for (let i = 0; i < notifications.length; i += 1) {
    if (notifications[i].userRole === userRole && (idSet.size === 0 || idSet.has(notifications[i].id))) {
      notifications[i] = { ...notifications[i], read: true };
    }
  }
  saveNotifications(saveJson, key, notifications);
  return notifications.filter((item) => item.userRole === userRole && !item.read).length;
}
