import { useMemo, useState } from 'react';
import type { PaymentCalendarEntry } from '../../../api/types/finance';
import { PAYMENT_RECURRENCE_OPTIONS } from '../constants';
import {
  formatMonthYear,
  getMonthGridDays,
  isSameMonth,
  isToday,
  toDateKey,
  WEEKDAYS_SHORT,
} from '../../calendar/utils/dates';
import styles from './PaymentCalendarView.module.css';

interface PaymentCalendarViewProps {
  entries: PaymentCalendarEntry[];
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function recurrenceShort(recurrence: PaymentCalendarEntry['recurrence']): string {
  if (!recurrence) return '';
  const labels: Record<string, string> = {
    monthly: '1 мес',
    quarterly: '3 мес',
    yearly: '1 год',
  };
  return labels[recurrence] ?? '';
}

export function PaymentCalendarView({
  entries,
  viewDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: PaymentCalendarViewProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const days = getMonthGridDays(viewDate);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, PaymentCalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.dueDate) ?? [];
      list.push(entry);
      map.set(entry.dueDate, list);
    }
    return map;
  }, [entries]);

  const monthTotal = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amount, 0),
    [entries],
  );

  const selectedEntries = selectedKey ? entriesByDate.get(selectedKey) ?? [] : [];

  return (
    <div className={styles.view}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button type="button" className={styles.navBtn} onClick={onPrevMonth} aria-label="Предыдущий месяц">
            ‹
          </button>
          <button type="button" className={styles.navBtn} onClick={onNextMonth} aria-label="Следующий месяц">
            ›
          </button>
          <button type="button" className={styles.todayBtn} onClick={onToday}>
            Сегодня
          </button>
          <h2 className={styles.period}>{formatMonthYear(viewDate)}</h2>
        </div>
        <p className={styles.total}>
          Платежи за месяц: <strong>{formatMoney(monthTotal, 'BYN')}</strong>
        </p>
      </div>

      <p className={styles.note}>
        Платежный календарь — отдельно от основного календаря событий. Цикличные расходы
        автоматически повторяются: {PAYMENT_RECURRENCE_OPTIONS.map((o) => o.label.toLowerCase()).join(', ')}.
      </p>

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
            const key = toDateKey(date);
            const dayEntries = entriesByDate.get(key) ?? [];
            const inMonth = isSameMonth(date, viewDate);
            const today = isToday(date);
            const selected = selectedKey === key;
            const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);

            return (
              <button
                key={key}
                type="button"
                className={`${styles.cell} ${!inMonth ? styles.outside : ''} ${today ? styles.today : ''} ${selected ? styles.selected : ''} ${dayEntries.length > 0 ? styles.hasPayments : ''}`}
                onClick={() => setSelectedKey(key)}
              >
                <span className={styles.dayNum}>{date.getDate()}</span>
                {dayEntries.length > 0 && (
                  <div className={styles.payments}>
                    {dayEntries.slice(0, 2).map((entry) => (
                      <span
                        key={entry.id}
                        className={`${styles.chip} ${entry.billingStatus === 'cyclic' ? styles.chipCyclic : ''}`}
                        title={entry.title}
                      >
                        {entry.title}
                      </span>
                    ))}
                    {dayEntries.length > 2 && (
                      <span className={styles.more}>+{dayEntries.length - 2}</span>
                    )}
                    <span className={styles.dayAmount}>{formatMoney(dayTotal, 'BYN')}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>
          {selectedKey
            ? new Date(selectedKey).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Выберите день'}
        </h3>
        {selectedEntries.length === 0 ? (
          <p className={styles.sidebarEmpty}>На этот день платежей нет</p>
        ) : (
          <ul className={styles.sidebarList}>
            {selectedEntries.map((entry) => (
              <li key={entry.id} className={styles.sidebarItem}>
                <div className={styles.sidebarItemTop}>
                  <span className={styles.sidebarItemTitle}>{entry.title}</span>
                  <span className={styles.sidebarItemAmount}>
                    {formatMoney(entry.amount, entry.currency)}
                  </span>
                </div>
                {entry.billingStatus === 'cyclic' && entry.recurrence && (
                  <span className={styles.sidebarRecurrence}>
                    Циклично · {recurrenceShort(entry.recurrence)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
