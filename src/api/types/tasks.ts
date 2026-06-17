import type { Id, ISODate, ListParams } from './common';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: Id;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: Id | null;
  sprintId: Id | null;
  assigneeId: Id | null;
  dueDate: ISODate | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface TaskListParams extends ListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: Id;
  assigneeId?: Id;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: Id | null;
  sprintId?: Id | null;
  assigneeId?: Id;
  dueDate?: ISODate;
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

export interface AssignTaskDto {
  assigneeId: Id;
}
