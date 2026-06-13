import { CalendarView } from '../features/calendar/components/CalendarView';
import styles from './CalendarPage.module.css';

export function CalendarPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.2</span>
        <h1 className={styles.title}>Календарь</h1>
        <p className={styles.subtitle}>
          События, встречи, дедлайны и задачи со сроком INCLAVE
        </p>
      </header>
      <CalendarView />
    </div>
  );
}
