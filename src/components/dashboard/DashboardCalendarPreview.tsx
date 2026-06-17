import type { CSSProperties } from 'react';
import {
  formatMonthYear,
  formatWeekdayShort,
  getWeekDays,
  isToday,
} from '../../features/calendar/utils/dates';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardCalendarPreview.module.css';

const EVENT_WEEKDAYS = new Set([1, 3, 4]);

export function DashboardCalendarPreview() {
  const today = new Date();
  const week = getWeekDays(today);

  return (
    <div className={shared.shell} style={{ '--preview-accent': '#5e6ad2' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>{formatMonthYear(today)}</span>
        <span className={shared.badge}>текущая неделя</span>
      </div>

      <div className={shared.body}>
        <div className={styles.week}>
          {week.map((date, index) => {
            const todayCell = isToday(date);
            const hasEvent = EVENT_WEEKDAYS.has(index);

            return (
              <div
                key={date.toISOString()}
                className={`${styles.dayCol} ${todayCell ? styles.dayColToday : ''}`}
              >
                <span className={styles.weekday}>{formatWeekdayShort(date)}</span>
                <span className={`${styles.dayCircle} ${todayCell ? styles.dayCircleToday : ''}`}>
                  {date.getDate()}
                </span>
                <span className={styles.eventMark} data-active={hasEvent ? 'true' : 'false'} />
              </div>
            );
          })}
        </div>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.footerMeeting}`} />
          3 встречи
        </span>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.footerDeadline}`} />
          2 дедлайна
        </span>
      </div>
    </div>
  );
}
