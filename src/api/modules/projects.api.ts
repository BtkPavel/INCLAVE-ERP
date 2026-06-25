import type { PaginatedResponse } from '../types/common';
import type {
  AddProjectMemberDto,
  CreateProjectDto,
  Project,
  ProjectListParams,
  ProjectMember,
  ProjectStats,
  UpdateProjectDto,
} from '../types/projects';
import type { CreateSprintDto, Sprint } from '../types/sprints';
import type { Task } from '../types/tasks';
import { apiClient, apiMocks } from '../client';
import type { QueryParams } from '../client';
import { buildUrl } from '../architecture';

const BASE = buildUrl('projects', 'list').replace(/\/$/, '');

export const projectsApi = {
  list(params?: ProjectListParams): Promise<PaginatedResponse<Project>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(apiMocks.emptyPage(params?.page, params?.perPage));
    }
    return apiClient.get(`${BASE}`, { params: params as QueryParams });
  },

  get(id: string): Promise<{ data: Project }> {
    if (apiClient.isMockMode()) {
      return Promise.reject(new Error('Not found'));
    }
    return apiClient.get(buildUrl('projects', 'get', { id }));
  },

  create(dto: CreateProjectDto): Promise<{ data: Project }> {
    return apiClient.post(BASE, dto);
  },

  update(id: string, dto: UpdateProjectDto): Promise<{ data: Project }> {
    return apiClient.patch(buildUrl('projects', 'update', { id }), dto);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(buildUrl('projects', 'delete', { id }));
  },

  members(projectId: string): Promise<{ data: ProjectMember[] }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({ data: [] });
    }
    return apiClient.get(buildUrl('projects', 'members', { id: projectId }));
  },

  addMember(projectId: string, dto: AddProjectMemberDto): Promise<{ data: ProjectMember }> {
    return apiClient.post(buildUrl('projects', 'addMember', { id: projectId }), dto);
  },

  removeMember(projectId: string, userId: string): Promise<void> {
    return apiClient.delete(
      buildUrl('projects', 'removeMember', { id: projectId, userId }),
    );
  },

  stats(): Promise<{ data: ProjectStats }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({
        data: { total: 0, active: 0, completed: 0, onHold: 0 },
      });
    }
    return apiClient.get(buildUrl('projects', 'stats'));
  },

  listTasks(projectId: string, sprintId?: string): Promise<{ data: Task[] }> {
    return apiClient.get(`${BASE}/${projectId}/tasks`, {
      params: sprintId ? { sprintId } : undefined,
    });
  },

  listSprints(projectId: string): Promise<{ data: Sprint[] }> {
    return apiClient.get(`${BASE}/${projectId}/sprints`);
  },

  createSprint(projectId: string, dto?: CreateSprintDto): Promise<{ data: Sprint }> {
    return apiClient.post(`${BASE}/${projectId}/sprints`, dto ?? {});
  },

  startSprint(projectId: string, sprintId: string): Promise<{ data: Sprint }> {
    return apiClient.post(`${BASE}/${projectId}/sprints/${sprintId}/start`);
  },

  completeSprint(projectId: string, sprintId: string): Promise<{ data: Sprint }> {
    return apiClient.post(`${BASE}/${projectId}/sprints/${sprintId}/complete`);
  },

  deleteSprint(projectId: string, sprintId: string): Promise<void> {
    return apiClient.delete(`${BASE}/${projectId}/sprints/${sprintId}`);
  },
};
