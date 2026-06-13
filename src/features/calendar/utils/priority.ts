import type { EventPriority } from '../../../api/types/calendar';
import { EVENT_PRIORITY_COLORS, EVENT_PRIORITY_ORDER } from '../constants';

export function compareByPriority(a: EventPriority, b: EventPriority): number {
  return EVENT_PRIORITY_ORDER[a] - EVENT_PRIORITY_ORDER[b];
}

export function eventPriorityColor(priority: EventPriority): string {
  return EVENT_PRIORITY_COLORS[priority];
}
