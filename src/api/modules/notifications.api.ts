import type { AppNotification } from '../types/notifications';
import { apiClient } from '../client';

const BASE = '/api/v1/notifications';

export const notificationsApi = {
  list(since?: string): Promise<{ data: AppNotification[]; meta: { unread: number } }> {
    return apiClient.get(BASE, { params: since ? { since } : undefined });
  },

  markRead(ids: string[] = []): Promise<{ data: { unread: number } }> {
    return apiClient.post(`${BASE}/mark-read`, { ids });
  },
};
