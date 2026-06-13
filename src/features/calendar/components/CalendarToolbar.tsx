import { formatPeriod } from '../utils/dates';
import { VIEW_MODE_LABELS } from '../constants';
import type { CalendarViewMode } from '../hooks/useCalendar';
import styles from './CalendarToolbar.module.css';

const VIEW_MODES: CalendarViewMode[] = ['day', 'week', 'month', 'year'];

interface CalendarToolbarProps {
  viewDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
}

export function CalendarToolbar({
  viewDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onCreate,
}: CalendarToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button type="button" className={styles.navBtn} onClick={onPrev} aria-label="Назад">
          ‹
        </button>
        <button type="button" className={styles.navBtn} onClick={onNext} aria-label="Вперёд">
          ›
        </button>
        <button type="button" className={styles.todayBtn} onClick={onToday}>
          Сегодня
        </button>
        <h2 className={styles.period}>{formatPeriod(viewDate, viewMode)}</h2>
      </div>

      <div className={styles.right}>
        <div className={styles.viewToggle} role="group" aria-label="Режим просмотра">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.viewBtn} ${viewMode === mode ? styles.viewActive : ''}`}
              onClick={() => onViewModeChange(mode)}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <button type="button" className={styles.createBtn} onClick={onCreate}>
          + Событие
        </button>
      </div>
    </div>
  );
}
