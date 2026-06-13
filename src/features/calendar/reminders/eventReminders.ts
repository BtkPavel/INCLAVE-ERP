import type { CalendarEvent } from '../../../api/types/calendar';
import { showEventReminder } from '../../../notifications/notifications';

const FIRED_KEY = 'inclave-erp-reminder-fired';

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFired(fired: Set<string>): void {
  localStorage.setItem(FIRED_KEY, JSON.stringify([...fired]));
}

export function clearReminderForEvent(eventId: string): void {
  const fired = loadFired();
  for (const key of fired) {
    if (key.startsWith(`${eventId}:`)) fired.delete(key);
  }
  saveFired(fired);
}

function reminderFireAt(event: CalendarEvent): number | null {
  if (event.reminderMinutes === null || event.reminderMinutes === undefined) return null;
  const start = new Date(event.startAt).getTime();
  return start - event.reminderMinutes * 60 * 1000;
}

function reminderLabel(minutes: number): string {
  if (minutes === 0) return 'сейчас';
  if (minutes === 1440) return 'через 1 день';
  if (minutes >= 60) return `через ${minutes / 60} ч`;
  return `через ${minutes} мин`;
}

export function checkEventReminders(events: CalendarEvent[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = Date.now();
  const fired = loadFired();
  let changed = false;

  for (const event of events) {
    const fireAt = reminderFireAt(event);
    if (fireAt === null) continue;

    const key = `${event.id}:${fireAt}`;
    if (fired.has(key)) continue;

    if (now >= fireAt && now < new Date(event.startAt).getTime() + 60_000) {
      const offset = event.reminderMinutes ?? 0;
      showEventReminder(
        event.title,
        offset === 0
          ? 'Событие начинается'
          : `Напоминание: начало ${reminderLabel(offset)}`,
      );
      fired.add(key);
      changed = true;
    }
  }

  if (changed) saveFired(fired);
}

export function scheduleReminderCheck(
  getEvents: () => CalendarEvent[],
): () => void {
  const tick = () => checkEventReminders(getEvents());
  tick();
  const id = window.setInterval(tick, 30_000);
  return () => window.clearInterval(id);
}
