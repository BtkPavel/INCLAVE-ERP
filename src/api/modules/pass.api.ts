import { apiClient } from '../client';
import type { QueryParams } from '../client';
import type { PaginatedResponse } from '../types/common';
import type { CreatePassEntryDto, PassEntry, PassListParams, UpdatePassEntryDto } from '../types/pass';

const BASE = '/api/v1/pass';

export const passApi = {
  list(params?: PassListParams): Promise<PaginatedResponse<PassEntry>> {
    return apiClient.get(BASE, { params: params as QueryParams });
  },

  create(dto: CreatePassEntryDto): Promise<{ data: PassEntry }> {
    return apiClient.post(BASE, dto);
  },

  update(id: string, dto: UpdatePassEntryDto): Promise<{ data: PassEntry }> {
    return apiClient.patch(`${BASE}/${id}`, dto);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`${BASE}/${id}`);
  },
};
