export { API_MODULES, API_PREFIX, API_VERSION, buildUrl } from './architecture';
export type { ApiEndpoint, ApiModuleDefinition, ApiModuleName } from './architecture';

export { apiClient, apiMocks, clearAuthToken, saveAuthToken } from './client';
export { ApiError, networkError } from './errors';

export { authApi } from './modules/auth.api';
export { projectsApi } from './modules/projects.api';
export { calendarApi } from './modules/calendar.api';
export { tasksApi } from './modules/tasks.api';
export { financeApi } from './modules/finance.api';
export { hrApi } from './modules/hr.api';

export type * from './types/common';
export type * from './types/auth';
export type * from './types/projects';
export type * from './types/calendar';
export type * from './types/tasks';
export type * from './types/finance';
export type * from './types/hr';
