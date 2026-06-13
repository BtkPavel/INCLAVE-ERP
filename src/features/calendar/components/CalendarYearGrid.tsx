import type { CalendarEvent } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import {
  formatMonthYear,
  getMonthGridDays,
  getYearMonths,
  isSameMonth,
  isToday,
  toDateKey,
} from '../utils/dates';
import { getHolidaysOnDate } from '../holidays/publicHolidays';
import styles from './CalendarYearGrid.module.css';

interface CalendarYearGridProps {
  year: Date;
  getEventsForDay: (date: Date) => CalendarEvent[];
  getTasksForDay: (date: Date) => Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectMonth: (monthIndex: number) => void;
}

function dayTitle(date: Date, tasks: Task[]): string | undefined {
  const holidays = getHolidaysOnDate(date);
  const parts: string[] = [];
  if (holidays.length > 0) {
    parts.push(...holidays.map((h) => `${h.country === 'BY' ? 'РБ' : 'РФ'}: ${h.name}`));
  }
  if (tasks.length > 0) {
    parts.push(...tasks.map((t) => `☑ ${t.title}`));
  }
  return parts.length > 0 ? parts.join('\n') : undefined;
}

export function CalendarYearGrid({
  year,
  getEventsForDay,
  getTasksForDay,
  selectedDate,
  onSelectDate,
  onSelectMonth,
}: CalendarYearGridProps) {
  const months = getYearMonths(year);

  return (
    <div className={styles.year}>
      {months.map((month) => {
        const days = getMonthGridDays(month);
        const monthItems = days.reduce((n, d) => {
          if (!isSameMonth(d, month)) return n;
          return n + getEventsForDay(d).length + getTasksForDay(d).length;
        }, 0);

        return (
          <div key={month.getMonth()} className={styles.monthCard}>
            <button
              type="button"
              className={styles.monthTitle}
              onClick={() => onSelectMonth(month.getMonth())}
            >
              {formatMonthYear(month)}
              {monthItems > 0 && (
                <span className={styles.monthCount}>{monthItems}</span>
              )}
            </button>

            <div className={styles.miniWeekdays}>
              {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className={styles.miniGrid}>
              {days.map((date) => {
                const inMonth = isSameMonth(date, month);
                if (!inMonth) {
                  return <span key={date.toISOString()} className={styles.miniEmpty} />;
                }
                const dayTasks = getTasksForDay(date);
                const hasEvents = getEventsForDay(date).length > 0;
                const hasTasks = dayTasks.length > 0;
                const isHoliday = getHolidaysOnDate(date).length > 0;
                const selected = toDateKey(date) === toDateKey(selectedDate);
                const today = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`${styles.miniDay} ${selected ? styles.miniSelected : ''} ${today ? styles.miniToday : ''} ${hasEvents ? styles.miniHasEvents : ''} ${hasTasks ? styles.miniHasTasks : ''} ${isHoliday ? styles.miniHoliday : ''}`}
                    onClick={() => onSelectDate(date)}
                    title={dayTitle(date, dayTasks) ?? String(date.getDate())}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
