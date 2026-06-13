import type { CalendarEvent, CreateEventDto, EventType, EventPriority, ReminderMinutes } from '../../../api/types/calendar';
import { endOfMonth, endOfYear, startOfMonth, startOfYear, toISODateTime } from '../utils/dates';

const STORAGE_KEY = 'inclave-erp-calendar-events';

function normalizeEvent(raw: CalendarEvent): CalendarEvent {
  return {
    ...raw,
    reminderMinutes: raw.reminderMinutes ?? null,
    priority: raw.priority ?? 'medium',
  };
}

function loadAll(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedEvents();
    return (JSON.parse(raw) as CalendarEvent[]).map(normalizeEvent);
  } catch {
    return seedEvents();
  }
}

function saveAll(events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function seedEvents(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const seeds: Array<{
    title: string;
    type: EventType;
    day: number;
    sh: number;
    sm: number;
    eh: number;
    em: number;
    allDay?: boolean;
    reminderMinutes?: ReminderMinutes | null;
    priority?: EventPriority;
  }> = [
    { title: 'Совет директоров', type: 'meeting', day: 5, sh: 10, sm: 0, eh: 11, em: 30, reminderMinutes: 30, priority: 'high' },
    { title: 'Сдача отчётности', type: 'deadline', day: 12, sh: 18, sm: 0, eh: 18, em: 0, allDay: true, reminderMinutes: 1440, priority: 'urgent' },
    { title: 'Созвон с командой', type: 'meeting', day: 15, sh: 14, sm: 0, eh: 15, em: 0, reminderMinutes: 15, priority: 'medium' },
    { title: 'Проверка бюджета', type: 'reminder', day: 20, sh: 9, sm: 0, eh: 9, em: 30, reminderMinutes: 60, priority: 'low' },
    { title: 'Планёрка проектов', type: 'meeting', day: 25, sh: 11, sm: 0, eh: 12, em: 0, reminderMinutes: 15, priority: 'medium' },
  ];

  const events: CalendarEvent[] = seeds.map((s, i) => {
    const date = new Date(y, m, s.day);
    const startAt = toISODateTime(date, s.sh, s.sm);
    const endAt = toISODateTime(date, s.eh, s.em);
    const ts = new Date().toISOString();
    return {
      id: `seed-${i + 1}`,
      title: s.title,
      description: null,
      type: s.type,
      priority: s.priority ?? 'medium',
      startAt,
      endAt,
      allDay: s.allDay ?? false,
      reminderMinutes: s.reminderMinutes ?? null,
      projectId: null,
      createdBy: 'system',
      createdAt: ts,
      updatedAt: ts,
    };
  });

  saveAll(events);
  return events;
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
