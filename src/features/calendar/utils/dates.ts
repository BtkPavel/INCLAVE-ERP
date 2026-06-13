const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
] as const;

export function mondayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function addDays(date: Date, count: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + count);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[mondayIndex(date)];
}

export function formatDayNumber(date: Date): number {
  return date.getDate();
}

export function formatFullDate(date: Date): string {
  const weekday = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][date.getDay()];
  return `${date.getDate()} ${MONTHS[date.getMonth()].toLowerCase()}, ${weekday}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthGridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = addDays(first, -mondayIndex(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function addYears(date: Date, count: number): Date {
  return new Date(date.getFullYear() + count, date.getMonth(), date.getDate());
}

export function formatYear(date: Date): string {
  return String(date.getFullYear());
}

export function formatWeekRange(anchor: Date): string {
  const days = getWeekDays(anchor);
  const start = days[0];
  const end = days[6];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS[start.getMonth()].toLowerCase()} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()].toLowerCase()} – ${end.getDate()} ${MONTHS[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
}

export function formatPeriod(date: Date, mode: 'day' | 'week' | 'month' | 'year'): string {
  switch (mode) {
    case 'day':
      return formatFullDate(date);
    case 'week':
      return formatWeekRange(date);
    case 'month':
      return formatMonthYear(date);
    case 'year':
      return formatYear(date);
  }
}

export function getYearMonths(year: Date): Date[] {
  const y = year.getFullYear();
  return Array.from({ length: 12 }, (_, i) => new Date(y, i, 1));
}

export function getDayHours(start = 7, end = 22): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function getWeekDays(anchor: Date): Date[] {
  const start = addDays(anchor, -mondayIndex(anchor));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function toISODateTime(date: Date, hours: number, minutes: number): string {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function parseTimeFromISO(iso: string): { hours: number; minutes: number } {
  const d = new Date(iso);
  return { hours: d.getHours(), minutes: d.getMinutes() };
}

export { WEEKDAYS_SHORT, MONTHS };
