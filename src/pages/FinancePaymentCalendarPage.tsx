import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  toDateKey,
} from '../features/calendar/utils/dates';
import { PaymentCalendarView } from '../features/finance/components/PaymentCalendarView';
import { usePaymentCalendar } from '../hooks/useModuleApi';
import styles from './FinancePaymentCalendarPage.module.css';

export function FinancePaymentCalendarPage() {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));

  const range = useMemo(() => {
    const from = toDateKey(startOfMonth(viewDate));
    const to = toDateKey(endOfMonth(viewDate));
    return { from, to };
  }, [viewDate]);

  const calendarState = usePaymentCalendar(range.from, range.to);
  const entries =
    calendarState.status === 'success' ? calendarState.data.data : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.fig}>FIG 1.4.4</span>
          <h2 className={styles.title}>Платежный календарь</h2>
          <p className={styles.subtitle}>
            График предстоящих оплат по операционным расходам. Не связан с основным календарём событий.
          </p>
        </div>
        <Link to="/finance/expense" className={styles.backLink}>
          ← К расходам
        </Link>
      </div>

      {calendarState.status === 'loading' || calendarState.status === 'idle' ? (
        <div className={styles.loading}>Загрузка платежного календаря…</div>
      ) : calendarState.status === 'error' ? (
        <div className={styles.error} role="alert">
          {calendarState.error}
        </div>
      ) : (
        <PaymentCalendarView
          entries={entries}
          viewDate={viewDate}
          onPrevMonth={() => setViewDate((date) => addMonths(date, -1))}
          onNextMonth={() => setViewDate((date) => addMonths(date, 1))}
          onToday={() => setViewDate(startOfMonth(new Date()))}
        />
      )}
    </div>
  );
}
