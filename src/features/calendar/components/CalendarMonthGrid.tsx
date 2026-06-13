import type { CalendarEvent } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import type { PublicHoliday } from '../holidays/publicHolidays';
import {
  formatDayNumber,
  getMonthGridDays,
  isSameMonth,
  isToday,
  WEEKDAYS_SHORT,
} from '../utils/dates';
import { EventChip } from './EventChip';
import { HolidayChip } from './HolidayChip';
import { TaskChip } from './TaskChip';
import styles from './CalendarMonthGrid.module.css';

interface CalendarMonthGridProps {
  viewDate: Date;
  getEventsForDay: (date: Date) => CalendarEvent[];
  getTasksForDay: (date: Date) => Task[];
  getHolidaysForDay: (date: Date) => PublicHoliday[];
  isSelected: (date: Date) => boolean;
  onSelectDate: (date: Date) => void;
  onCreateOnDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
}

const MAX_ITEMS = 2;

export function CalendarMonthGrid({
  viewDate,
  getEventsForDay,
  getTasksForDay,
  getHolidaysForDay,
  isSelected,
  onSelectDate,
  onCreateOnDate,
  onEventClick,
  onTaskClick,
}: CalendarMonthGridProps) {
  const days = getMonthGridDays(viewDate);

  return (
    <div className={styles.grid}>
      <div className={styles.weekdays}>
        {WEEKDAYS_SHORT.map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
      </div>

      <div className={styles.days}>
        {days.map((date) => {
          const dayEvents = getEventsForDay(date);
          const dayTasks = getTasksForDay(date);
          const holidays = getHolidaysForDay(date);
          const inMonth = isSameMonth(date, viewDate);
          const selected = isSelected(date);
          const today = isToday(date);
          const isHoliday = holidays.length > 0;
          const totalItems = dayTasks.length + dayEvents.length;
          const extra = totalItems - MAX_ITEMS;
          const hasItems = totalItems > 0;

          const visibleTasks = dayTasks.slice(0, MAX_ITEMS);
          const visibleEvents = dayEvents.slice(
            0,
            Math.max(0, MAX_ITEMS - visibleTasks.length),
          );

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`${styles.cell} ${!inMonth ? styles.outside : ''} ${selected ? styles.selected : ''} ${today ? styles.today : ''} ${isHoliday ? styles.holiday : ''} ${hasItems ? styles.hasEvents : ''}`}
              onClick={() => onSelectDate(date)}
              onDoubleClick={() => onCreateOnDate(date)}
            >
              <span className={styles.dayNum}>{formatDayNumber(date)}</span>
              <div className={styles.events}>
                {holidays.map((holiday) => (
                  <HolidayChip key={holiday.id} holiday={holiday} compact />
                ))}
                {visibleTasks.map((task) => (
                  <TaskChip key={task.id} task={task} compact onClick={onTaskClick} />
                ))}
                {visibleEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    compact
                    onClick={onEventClick}
                  />
                ))}
                {extra > 0 && (
                  <span className={styles.more}>+{extra} ещё</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
