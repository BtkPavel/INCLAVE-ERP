import type { CalendarEvent } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import type { PublicHoliday } from '../holidays/publicHolidays';
import {
  formatDayNumber,
  formatWeekdayShort,
  getWeekDays,
  isToday,
} from '../utils/dates';
import { EventChip } from './EventChip';
import { HolidayList } from './HolidayChip';
import { TaskChip } from './TaskChip';
import styles from './CalendarWeekGrid.module.css';

interface CalendarWeekGridProps {
  viewDate: Date;
  getEventsForDay: (date: Date) => CalendarEvent[];
  getTasksForDay: (date: Date) => Task[];
  getHolidaysForDay: (date: Date) => PublicHoliday[];
  isSelected: (date: Date) => boolean;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
}

export function CalendarWeekGrid({
  viewDate,
  getEventsForDay,
  getTasksForDay,
  getHolidaysForDay,
  isSelected,
  onSelectDate,
  onEventClick,
  onTaskClick,
}: CalendarWeekGridProps) {
  const days = getWeekDays(viewDate);

  return (
    <div className={styles.week}>
      {days.map((date) => {
        const dayEvents = getEventsForDay(date);
        const dayTasks = getTasksForDay(date);
        const holidays = getHolidaysForDay(date);
        const selected = isSelected(date);
        const today = isToday(date);
        const isHoliday = holidays.length > 0;
        const isEmpty = dayEvents.length === 0 && dayTasks.length === 0 && holidays.length === 0;

        return (
          <button
            key={date.toISOString()}
            type="button"
            className={`${styles.column} ${selected ? styles.selected : ''} ${today ? styles.today : ''} ${isHoliday ? styles.holiday : ''}`}
            onClick={() => onSelectDate(date)}
          >
            <div className={styles.header}>
              <span className={styles.weekday}>{formatWeekdayShort(date)}</span>
              <span className={styles.dayNum}>{formatDayNumber(date)}</span>
            </div>
            <div className={styles.events}>
              <HolidayList holidays={holidays} />
              {isEmpty ? (
                <span className={styles.empty}>Нет событий</span>
              ) : (
                <>
                  {dayTasks.map((task) => (
                    <TaskChip key={task.id} task={task} onClick={onTaskClick} />
                  ))}
                  {dayEvents.map((event) => (
                    <EventChip key={event.id} event={event} onClick={onEventClick} />
                  ))}
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
