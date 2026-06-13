import type { CalendarEvent, CreateEventDto } from '../../../api/types/calendar';
import { loadJson, saveJson } from '../../../storage/persistence';
import { endOfMonth, endOfYear, startOfMonth, startOfYear } from '../utils/dates';

const STORAGE_KEY = 'inclave-erp-calendar-events';

function normalizeEvent(raw: CalendarEvent): CalendarEvent {
  return {
    ...raw,
    reminderMinutes: raw.reminderMinutes ?? null,
    priority: raw.priority ?? 'medium',
  };
}

function loadAll(): CalendarEvent[] {
  return loadJson<CalendarEvent[]>(STORAGE_KEY, []).map(normalizeEvent);
}

function saveAll(events: CalendarEvent[]): void {
  saveJson(STORAGE_KEY, events);
}

function inRange(event: CalendarEvent, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const start = new Date(event.startAt).getTime();
  if (from && start < new Date(from).getTime()) return false;
  if (to && start > new Date(to).getTime()) return false;
  return true;
}

export const eventsStorage = {
  list(from?: string, to?: string): CalendarEvent[] {
    return loadAll()
      .filter((e) => inRange(e, from, to))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  },

  listAll(): CalendarEvent[] {
    return loadAll();
  },

  get(id: string): CalendarEvent | undefined {
    return loadAll().find((e) => e.id === id);
  },

  create(dto: CreateEventDto): CalendarEvent {
    const events = loadAll();
    const ts = new Date().toISOString();
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description ?? null,
      type: dto.type ?? 'other',
      priority: dto.priority ?? 'medium',
      startAt: dto.startAt,
      endAt: dto.endAt,
      allDay: dto.allDay ?? false,
      reminderMinutes: dto.reminderMinutes ?? null,
      projectId: dto.projectId ?? null,
      createdBy: 'local',
      createdAt: ts,
      updatedAt: ts,
    };
    events.push(event);
    saveAll(events);
    return event;
  },

  update(id: string, dto: Partial<CreateEventDto>): CalendarEvent {
    const events = loadAll();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Event not found');
    events[idx] = {
      ...events[idx],
      ...dto,
      description: dto.description ?? events[idx].description,
      reminderMinutes: dto.reminderMinutes !== undefined ? dto.reminderMinutes : events[idx].reminderMinutes,
      priority: dto.priority ?? events[idx].priority ?? 'medium',
      updatedAt: new Date().toISOString(),
    };
    saveAll(events);
    return events[idx];
  },

  delete(id: string): void {
    saveAll(loadAll().filter((e) => e.id !== id));
  },

  monthRange(month: Date): { from: string; to: string } {
    return {
      from: startOfMonth(month).toISOString(),
      to: endOfMonth(month).toISOString(),
    };
  },

  yearRange(year: Date): { from: string; to: string } {
    return {
      from: startOfYear(year).toISOString(),
      to: endOfYear(year).toISOString(),
    };
  },
};
