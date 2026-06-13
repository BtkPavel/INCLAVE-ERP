import type { EventType, ReminderMinutes, EventPriority } from '../../api/types/calendar';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'Встреча',
  deadline: 'Дедлайн',
  reminder: 'Напоминание',
  other: 'Другое',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: '#5e6ad2',
  deadline: '#d70510',
  reminder: '#8a8f98',
  other: '#62666d',
};

export const EVENT_PRIORITY_LABELS: Record<EventPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

export const EVENT_PRIORITY_COLORS: Record<EventPriority, string> = {
  low: '#8a8f98',
  medium: '#5e6ad2',
  high: '#c27803',
  urgent: '#d70510',
};

export const EVENT_PRIORITY_ORDER: Record<EventPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const REMINDER_OPTIONS: { value: ReminderMinutes | null; label: string }[] = [
  { value: null, label: 'Без напоминания' },
  { value: 0, label: 'В момент события' },
  { value: 5, label: 'За 5 минут' },
  { value: 15, label: 'За 15 минут' },
  { value: 30, label: 'За 30 минут' },
  { value: 60, label: 'За 1 час' },
  { value: 120, label: 'За 2 часа' },
  { value: 1440, label: 'За 1 день' },
];

export const VIEW_MODE_LABELS = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
} as const;
