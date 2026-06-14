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
import { useCompactMonthGrid } from '../hooks/useCompactMonthGrid';
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
  const compactGrid = useCompactMonthGrid();

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
            <div
              key={date.toISOString()}
              role="button"
              tabIndex={0}
              className={`${styles.cell} ${!inMonth ? styles.outside : ''} ${selected ? styles.selected : ''} ${today ? styles.today : ''} ${isHoliday ? styles.holiday : ''} ${hasItems ? styles.hasEvents : ''} ${compactGrid ? styles.compactCell : ''}`}
              onClick={() => onSelectDate(date)}
              onDoubleClick={() => onCreateOnDate(date)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(date);
                }
              }}
            >
              <span className={styles.dayNum}>{formatDayNumber(date)}</span>
              {!compactGrid && (
                <div className={styles.events}>
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className={styles.holidayChip}>
                      <HolidayChip holiday={holiday} compact />
                    </div>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
