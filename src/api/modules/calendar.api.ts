import type { PaginatedResponse } from '../types/common';
import type {
  CalendarEvent,
  CreateEventDto,
  EventListParams,
  UpdateEventDto,
} from '../types/calendar';
import { eventsStorage } from '../../features/calendar/storage/eventsStorage';
import { apiClient } from '../client';
import type { QueryParams } from '../client';
import { buildUrl } from '../architecture';

const EVENTS = `${buildUrl('calendar', 'listEvents').replace(/\/events$/, '')}/events`;

export const calendarApi = {
  listEvents(params?: EventListParams): Promise<PaginatedResponse<CalendarEvent>> {
    if (apiClient.isMockMode()) {
      const data = eventsStorage.list(params?.from, params?.to);
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;
      return Promise.resolve({
        data,
        meta: { page, perPage, total: data.length, totalPages: 1 },
      });
    }
    return apiClient.get(EVENTS, { params: params as QueryParams });
  },

  getEvent(id: string): Promise<{ data: CalendarEvent }> {
    if (apiClient.isMockMode()) {
      const event = eventsStorage.get(id);
      if (!event) return Promise.reject(new Error('Not found'));
      return Promise.resolve({ data: event });
    }
    return apiClient.get(buildUrl('calendar', 'getEvent', { id }));
  },

  createEvent(dto: CreateEventDto): Promise<{ data: CalendarEvent }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({ data: eventsStorage.create(dto) });
    }
    return apiClient.post(EVENTS, dto);
  },

  updateEvent(id: string, dto: UpdateEventDto): Promise<{ data: CalendarEvent }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({ data: eventsStorage.update(id, dto) });
    }
    return apiClient.patch(buildUrl('calendar', 'updateEvent', { id }), dto);
  },

  deleteEvent(id: string): Promise<void> {
    if (apiClient.isMockMode()) {
      eventsStorage.delete(id);
      return Promise.resolve();
    }
    return apiClient.delete(buildUrl('calendar', 'deleteEvent', { id }));
  },

  upcoming(limit = 10): Promise<{ data: CalendarEvent[] }> {
    if (apiClient.isMockMode()) {
      const now = new Date().toISOString();
      const data = eventsStorage.list(now).slice(0, limit);
      return Promise.resolve({ data });
    }
    return apiClient.get(`${EVENTS}/upcoming`, { params: { limit } });
  },
};
