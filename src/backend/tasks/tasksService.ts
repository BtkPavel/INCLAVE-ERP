import type { PaginatedResponse } from '../../api/types/common';
import type {
  CreateTaskDto,
  Task,
  TaskListParams,
  TaskStats,
  UpdateTaskDto,
} from '../../api/types/tasks';
import type { UserRole } from '../../auth/users';
import { tasksStorage } from '../../features/tasks/storage/tasksStorage';

function paginate<T>(items: T[], page = 1, perPage = 50): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;

  return {
    data: items.slice(start, start + perPage),
    meta: { page, perPage, total, totalPages },
  };
}

let currentAssignee: UserRole = 'director';

export function setTasksAssignee(role: UserRole): void {
  currentAssignee = role;
}

export const tasksService = {
  list(params?: TaskListParams): PaginatedResponse<Task> {
    const items = tasksStorage.listForUser(currentAssignee, params?.status);
    return paginate(items, params?.page, params?.perPage);
  },

  create(dto: CreateTaskDto): { data: Task } {
    return { data: tasksStorage.create(currentAssignee, dto) };
  },

  update(id: string, dto: UpdateTaskDto): { data: Task } | null {
    const updated = tasksStorage.update(id, currentAssignee, dto);
    return updated ? { data: updated } : null;
  },

  complete(id: string): { data: Task } | null {
    const updated = tasksStorage.complete(id, currentAssignee);
    return updated ? { data: updated } : null;
  },

  delete(id: string): boolean {
    return tasksStorage.delete(id, currentAssignee);
  },

  stats(): { data: TaskStats } {
    return { data: tasksStorage.stats(currentAssignee) };
  },

  listWithDueDate(): { data: Task[] } {
    return { data: tasksStorage.listWithDueDate(currentAssignee) };
  },
};
