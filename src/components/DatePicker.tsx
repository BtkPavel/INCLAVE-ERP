import { useEffect, useId, useRef, useState } from 'react';
import {
  addMonths,
  formatMonthYear,
  fromDateKey,
  getMonthGridDays,
  isSameMonth,
  isToday,
  toDateKey,
  WEEKDAYS_SHORT,
} from '../features/calendar/utils/dates';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  disabled?: boolean;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const date = fromDateKey(iso);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isDisabledDate(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Выберите дату',
  clearable = false,
  required = false,
  disabled = false,
}: DatePickerProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? fromDateKey(value) : new Date(),
  );

  useEffect(() => {
    if (value) {
      setViewDate(fromDateKey(value));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const days = getMonthGridDays(viewDate);

  function selectDate(iso: string) {
    if (isDisabledDate(iso, min, max)) return;
    onChange(iso);
    setOpen(false);
  }

  function handleToday() {
    const today = toDateKey(new Date());
    if (!isDisabledDate(today, min, max)) {
      onChange(today);
      setViewDate(new Date());
      setOpen(false);
    }
  }

  function handleClear() {
    onChange('');
    setOpen(false);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        id={id}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${!value ? styles.triggerEmpty : ''}`}
        onClick={() => !disabled && setOpen((state) => !state)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.icon} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5.5 1.5v2.5M10.5 1.5v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
        <span className={styles.value}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <span className={styles.chevron} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          className={styles.hiddenInput}
          value={value}
          required
          onChange={() => undefined}
          aria-hidden
        />
      )}

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Выбор даты">
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setViewDate((date) => addMonths(date, -1))}
              aria-label="Предыдущий месяц"
            >
              ‹
            </button>
            <span className={styles.month}>{formatMonthYear(viewDate)}</span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setViewDate((date) => addMonths(date, 1))}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS_SHORT.map((day) => (
              <span key={day} className={styles.weekday}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.grid}>
            {days.map((date) => {
              const iso = toDateKey(date);
              const inMonth = isSameMonth(date, viewDate);
              const selected = value === iso;
              const today = isToday(date);
              const blocked = isDisabledDate(iso, min, max);

              return (
                <button
                  key={iso}
                  type="button"
                  className={`${styles.day} ${!inMonth ? styles.dayOutside : ''} ${selected ? styles.daySelected : ''} ${today ? styles.dayToday : ''} ${blocked ? styles.dayDisabled : ''}`}
                  onClick={() => selectDate(iso)}
                  disabled={blocked}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            {clearable && (
              <button type="button" className={styles.footerBtn} onClick={handleClear}>
                Удалить
              </button>
            )}
            <button type="button" className={styles.footerBtnAccent} onClick={handleToday}>
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
