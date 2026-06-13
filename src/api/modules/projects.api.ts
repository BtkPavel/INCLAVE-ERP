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
};
