import type { PaginatedResponse } from '../types/common';
import type {
  AssignTaskDto,
  CreateTaskCommentDto,
  CreateTaskDto,
  Task,
  TaskComment,
  TaskListParams,
  TaskStats,
  UpdateTaskDto,
} from '../types/tasks';
import { apiClient } from '../client';
import type { QueryParams } from '../client';
import { buildUrl } from '../architecture';
import { tasksService } from '../../backend/tasks/tasksService';

const BASE = buildUrl('tasks', 'list').replace(/\/$/, '');

export const tasksApi = {
  list(params?: TaskListParams): Promise<PaginatedResponse<Task>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(tasksService.list(params));
    }
    return apiClient.get(BASE, { params: params as QueryParams });
  },

  get(id: string): Promise<{ data: Task }> {
    return apiClient.get(buildUrl('tasks', 'get', { id }));
  },

  create(dto: CreateTaskDto): Promise<{ data: Task }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(tasksService.create(dto));
    }
    return apiClient.post(BASE, dto);
  },

  update(id: string, dto: UpdateTaskDto): Promise<{ data: Task }> {
    if (apiClient.isMockMode()) {
      const result = tasksService.update(id, dto);
      if (!result) {
        return Promise.reject(new Error('Задача не найдена'));
      }
      return Promise.resolve(result);
    }
    return apiClient.patch(buildUrl('tasks', 'update', { id }), dto);
  },

  delete(id: string): Promise<void> {
    if (apiClient.isMockMode()) {
      tasksService.delete(id);
      return Promise.resolve();
    }
    return apiClient.delete(buildUrl('tasks', 'delete', { id }));
  },

  complete(id: string): Promise<{ data: Task }> {
    if (apiClient.isMockMode()) {
      const result = tasksService.complete(id);
      if (!result) {
        return Promise.reject(new Error('Задача не найдена'));
      }
      return Promise.resolve(result);
    }
    return apiClient.post(buildUrl('tasks', 'complete', { id }));
  },

  assign(id: string, dto: AssignTaskDto): Promise<{ data: Task }> {
    return apiClient.post(buildUrl('tasks', 'assign', { id }), dto);
  },

  byProject(projectId: string, params?: TaskListParams): Promise<PaginatedResponse<Task>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(tasksService.list(params));
    }
    return apiClient.get(buildUrl('tasks', 'byProject', { projectId }), {
      params: params as QueryParams,
    });
  },

  stats(): Promise<{ data: TaskStats }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(tasksService.stats());
    }
    return apiClient.get(buildUrl('tasks', 'stats'));
  },

  listWithDueDate(): Promise<{ data: Task[] }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(tasksService.listWithDueDate());
    }
    return apiClient.get(`${BASE}/with-due-date`);
  },

  listComments(taskId: string): Promise<{ data: TaskComment[] }> {
    return apiClient.get(`${BASE}/${taskId}/comments`);
  },

  addComment(taskId: string, dto: CreateTaskCommentDto): Promise<{ data: TaskComment }> {
    return apiClient.post(`${BASE}/${taskId}/comments`, dto);
  },
};
