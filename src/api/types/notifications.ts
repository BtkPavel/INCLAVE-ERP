export type NotificationType = 'task_assigned' | 'task_comment' | 'task_status';

export interface AppNotification {
  id: string;
  userRole: string;
  type: NotificationType;
  taskId: string;
  taskTitle: string;
  message: string;
  createdAt: string;
  read: boolean;
}
