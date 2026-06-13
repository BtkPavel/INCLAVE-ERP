import type { CSSProperties } from 'react';
import type { CalendarEvent } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import type { PublicHoliday } from '../holidays/publicHolidays';
import { EVENT_PRIORITY_COLORS, EVENT_PRIORITY_LABELS } from '../constants';
import { compareByPriority } from '../utils/priority';
import { formatTime, getDayHours, isToday, parseTimeFromISO } from '../utils/dates';
import { EventChip } from './EventChip';
import { HolidayList } from './HolidayChip';
import { TaskChip } from './TaskChip';
import styles from './CalendarDayView.module.css';

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  holidays: PublicHoliday[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
  onCreate: () => void;
}

export function CalendarDayView({
  date,
  events,
  tasks,
  holidays,
  onEventClick,
  onTaskClick,
  onCreate,
}: CalendarDayViewProps) {
  const hours = getDayHours(7, 22);
  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = events.filter((e) => !e.allDay);

  function eventsAtHour(hour: number): CalendarEvent[] {
    return timedEvents
      .filter((e) => parseTimeFromISO(e.startAt).hours === hour)
      .sort((a, b) => {
        const byPriority = compareByPriority(a.priority ?? 'medium', b.priority ?? 'medium');
        if (byPriority !== 0) return byPriority;
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
  }

  return (
    <div className={styles.day}>
      {holidays.length > 0 && (
        <div className={styles.holidays}>
          <span className={styles.holidaysLabel}>Государственные праздники</span>
          <HolidayList holidays={holidays} />
        </div>
      )}

      {tasks.length > 0 && (
        <div className={styles.tasks}>
          <span className={styles.tasksLabel}>Задачи на этот день</span>
          <div className={styles.tasksList}>
            {tasks.map((task) => (
              <TaskChip key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        </div>
      )}

      {allDayEvents.length > 0 && (
        <div className={styles.allDay}>
          <span className={styles.allDayLabel}>Весь день</span>
          <div className={styles.allDayEvents}>
            {allDayEvents.map((e) => (
              <EventChip key={e.id} event={e} onClick={onEventClick} />
            ))}
          </div>
        </div>
      )}

      <div className={styles.timeline}>
        {hours.map((hour) => {
          const slotEvents = eventsAtHour(hour);
          return (
            <div key={hour} className={styles.row}>
              <span className={styles.hour}>
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className={styles.slot}>
                {slotEvents.map((event) => {
                  const priority = event.priority ?? 'medium';
                  const color = EVENT_PRIORITY_COLORS[priority];
                  return (
                  <button
                    key={event.id}
                    type="button"
                    className={styles.slotEvent}
                    style={{ '--event-color': color } as CSSProperties}
                    onClick={() => onEventClick(event)}
                  >
                    <span className={styles.slotTime}>
                      {formatTime(event.startAt)}–{formatTime(event.endAt)}
                    </span>
                    <span className={styles.slotTitle}>{event.title}</span>
                    <span className={styles.slotPriority}>{EVENT_PRIORITY_LABELS[priority]}</span>
                    {event.reminderMinutes !== null && (
                      <span className={styles.reminder} title="Напоминание">🔔</span>
                    )}
                  </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && tasks.length === 0 && holidays.length === 0 && (
        <div className={styles.empty}>
          <p>Нет событий на этот день</p>
          <button type="button" className={styles.addBtn} onClick={onCreate}>
            + Добавить событие
          </button>
        </div>
      )}

      {isToday(date) && (
        <div className={styles.nowLine} aria-hidden>
          <span className={styles.nowLabel}>Сегодня</span>
        </div>
      )}
    </div>
  );
}
