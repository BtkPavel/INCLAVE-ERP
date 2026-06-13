import type { Id, ISODateTime, ListParams } from './common';
import type { TaskPriority } from './tasks';

export type EventType = 'meeting' | 'deadline' | 'reminder' | 'other';
export type EventPriority = TaskPriority;

/** Минуты до начала события; null — без напоминания */
export type ReminderMinutes = 0 | 5 | 15 | 30 | 60 | 120 | 1440;

export interface CalendarEvent {
  id: Id;
  title: string;
  description: string | null;
  type: EventType;
  priority: EventPriority;
  startAt: ISODateTime;
  endAt: ISODateTime;
  allDay: boolean;
  reminderMinutes: ReminderMinutes | null;
  projectId: Id | null;
  createdBy: Id;
  createdAt: string;
  updatedAt: string;
}

export interface EventListParams extends ListParams {
  from?: ISODateTime;
  to?: ISODateTime;
  projectId?: Id;
  type?: EventType;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type?: EventType;
  priority?: EventPriority;
  startAt: ISODateTime;
  endAt: ISODateTime;
  allDay?: boolean;
  reminderMinutes?: ReminderMinutes | null;
  projectId?: Id;
}

export type UpdateEventDto = Partial<CreateEventDto>;
