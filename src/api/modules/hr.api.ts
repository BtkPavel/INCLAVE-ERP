import type { PaginatedResponse } from '../types/common';
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeListParams,
  UpdateEmployeeDto,
} from '../types/hr';
import { apiClient, apiMocks } from '../client';
import type { QueryParams } from '../client';
import { buildUrl } from '../architecture';

const BASE = buildUrl('hr', 'list').replace(/\/employees$/, '');

export const hrApi = {
  list(params?: EmployeeListParams): Promise<PaginatedResponse<Employee>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(apiMocks.emptyPage(params?.page, params?.perPage));
    }
    return apiClient.get(`${BASE}/employees`, { params: params as QueryParams });
  },

  get(id: string): Promise<{ data: Employee }> {
    return apiClient.get(buildUrl('hr', 'get', { id }));
  },

  create(dto: CreateEmployeeDto): Promise<{ data: Employee }> {
    return apiClient.post(`${BASE}/employees`, dto);
  },

  update(id: string, dto: UpdateEmployeeDto): Promise<{ data: Employee }> {
    return apiClient.patch(buildUrl('hr', 'update', { id }), dto);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(buildUrl('hr', 'delete', { id }));
  },
};
