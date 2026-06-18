import type { AccessSettings, ModulePermissions } from '../types/auth';
import type { UserRole } from '../../auth/users';
import { apiClient } from '../client';

const BASE = '/api/v1/settings';

export const settingsApi = {
  get(): Promise<{ data: AccessSettings }> {
    return apiClient.get(BASE);
  },

  updatePassword(role: UserRole, password: string): Promise<{ data: { role: UserRole; updated: boolean } }> {
    return apiClient.patch(`${BASE}/passwords`, { role, password });
  },

  setProjectAccess(
    projectId: string,
    role: UserRole,
    granted: boolean,
  ): Promise<{ data: AccessSettings }> {
    return apiClient.post(`${BASE}/project-access`, { projectId, role, granted });
  },

  setCalendarSharing(
    ownerRole: UserRole,
    viewerRole: UserRole,
    granted: boolean,
  ): Promise<{ data: AccessSettings }> {
    return apiClient.post(`${BASE}/calendar-sharing`, { ownerRole, viewerRole, granted });
  },

  setModuleAccess(
    role: UserRole,
    modules: Partial<ModulePermissions>,
  ): Promise<{ data: AccessSettings }> {
    return apiClient.patch(`${BASE}/module-access`, { role, modules });
  },
};
