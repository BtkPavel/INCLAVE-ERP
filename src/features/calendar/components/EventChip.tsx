import type { CSSProperties } from 'react';
import type { CalendarEvent } from '../../../api/types/calendar';
import { EVENT_PRIORITY_COLORS, EVENT_PRIORITY_LABELS } from '../constants';
import { formatTime } from '../utils/dates';
import styles from './EventChip.module.css';

interface EventChipProps {
  event: CalendarEvent;
  compact?: boolean;
  /** Только отображение (клик обрабатывает родитель). */
  static?: boolean;
  onClick?: (event: CalendarEvent) => void;
}

export function EventChip({ event, compact, static: isStatic, onClick }: EventChipProps) {
  const priority = event.priority ?? 'medium';
  const color = EVENT_PRIORITY_COLORS[priority];

  const content = (
    <>
      {!event.allDay && !compact && (
        <span className={styles.time}>{formatTime(event.startAt)}</span>
      )}
      {!compact && (priority === 'urgent' || priority === 'high') && (
        <span className={styles.priority}>{EVENT_PRIORITY_LABELS[priority]}</span>
      )}
      <span className={styles.title}>
        {event.reminderMinutes !== null && (
          <span className={styles.bell} title="Напоминание">🔔 </span>
        )}
        {event.title}
      </span>
    </>
  );

  const className = `${styles.chip} ${compact ? styles.compact : ''}`;

  if (isStatic) {
    return (
      <div
        className={className}
        style={{ '--event-color': color } as CSSProperties}
        title={`${event.title} · ${EVENT_PRIORITY_LABELS[priority]}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={{ '--event-color': color } as CSSProperties}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={`${event.title} · ${EVENT_PRIORITY_LABELS[priority]}`}
    >
      {content}
    </button>
  );
}
