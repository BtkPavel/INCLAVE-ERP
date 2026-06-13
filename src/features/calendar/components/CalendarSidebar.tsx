import type { CalendarEvent } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import type { PublicHoliday } from '../holidays/publicHolidays';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../tasks/constants';
import { EVENT_TYPE_LABELS, EVENT_PRIORITY_LABELS, REMINDER_OPTIONS } from '../constants';
import { formatFullDate, formatTime } from '../utils/dates';
import { EventChip } from './EventChip';
import { HolidayList } from './HolidayChip';
import { TaskChip } from './TaskChip';
import styles from './CalendarSidebar.module.css';

interface CalendarSidebarProps {
  selectedDate: Date;
  dayEvents: CalendarEvent[];
  dayTasks: Task[];
  dayHolidays: PublicHoliday[];
  upcomingEvents: CalendarEvent[];
  upcomingTasks: Task[];
  onCreate: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
}

export function CalendarSidebar({
  selectedDate,
  dayEvents,
  dayTasks,
  dayHolidays,
  upcomingEvents,
  upcomingTasks,
  onCreate,
  onEventClick,
  onTaskClick,
}: CalendarSidebarProps) {
  const hasDayContent =
    dayEvents.length > 0 || dayTasks.length > 0 || dayHolidays.length > 0;

  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.fig}>FIG 1.2.2</span>
            <h3 className={styles.sectionTitle}>{formatFullDate(selectedDate)}</h3>
          </div>
          <button type="button" className={styles.addBtn} onClick={onCreate}>
            +
          </button>
        </div>

        {dayHolidays.length > 0 && (
          <div className={styles.holidaysBlock}>
            <span className={styles.holidaysTitle}>Государственные праздники</span>
            <HolidayList holidays={dayHolidays} />
          </div>
        )}

        {dayTasks.length > 0 && (
          <div className={styles.tasksBlock}>
            <span className={styles.tasksTitle}>Задачи</span>
            <ul className={styles.list}>
              {dayTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className={styles.eventCard}
                    onClick={() => onTaskClick(task)}
                  >
                    <TaskChip task={task} static />
                    <span className={styles.eventMeta}>
                      {TASK_STATUS_LABELS[task.status]} · {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasDayContent ? (
          <p className={styles.empty}>На этот день событий нет</p>
        ) : dayEvents.length > 0 ? (
          <ul className={styles.list}>
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={styles.eventCard}
                  onClick={() => onEventClick(event)}
                >
                  <EventChip event={event} static />
                  <span className={styles.eventMeta}>
                    {EVENT_TYPE_LABELS[event.type]}
                    {' · '}
                    {EVENT_PRIORITY_LABELS[event.priority ?? 'medium']}
                    {!event.allDay && ` · ${formatTime(event.startAt)}–${formatTime(event.endAt)}`}
                    {event.reminderMinutes !== null && (
                      <>
                        {' · 🔔 '}
                        {REMINDER_OPTIONS.find((o) => o.value === event.reminderMinutes)?.label}
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.section}>
        <span className={styles.fig}>FIG 1.2.3</span>
        <h3 className={styles.sectionTitle}>Ближайшие</h3>
        {upcomingEvents.length === 0 && upcomingTasks.length === 0 ? (
          <p className={styles.empty}>Нет предстоящих событий</p>
        ) : (
          <ul className={styles.upcoming}>
            {upcomingTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={styles.upcomingItem}
                  onClick={() => onTaskClick(task)}
                >
                  <span className={styles.upcomingDate}>
                    {task.dueDate
                      ? `${task.dueDate.slice(8, 10)}.${task.dueDate.slice(5, 7)}`
                      : '—'}
                  </span>
                  <span className={styles.upcomingTitle}>☑ {task.title}</span>
                </button>
              </li>
            ))}
            {upcomingEvents.map((event) => {
              const d = new Date(event.startAt);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    className={styles.upcomingItem}
                    onClick={() => onEventClick(event)}
                  >
                    <span className={styles.upcomingDate}>
                      {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.upcomingTitle}>
                      {event.reminderMinutes !== null && '🔔 '}
                      {event.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
