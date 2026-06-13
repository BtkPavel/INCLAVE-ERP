import type { PublicHoliday } from '../holidays/publicHolidays';
import { getCountryLabel } from '../holidays/publicHolidays';
import styles from './HolidayChip.module.css';

interface HolidayChipProps {
  holiday: PublicHoliday;
  compact?: boolean;
}

export function HolidayChip({ holiday, compact }: HolidayChipProps) {
  return (
    <div
      className={`${styles.chip} ${compact ? styles.compact : ''}`}
      title={`${getCountryLabel(holiday.country)}: ${holiday.name}`}
    >
      <span className={styles.badge}>{getCountryLabel(holiday.country)}</span>
      <span className={styles.name}>{holiday.name}</span>
    </div>
  );
}

interface HolidayListProps {
  holidays: PublicHoliday[];
  compact?: boolean;
}

export function HolidayList({ holidays, compact }: HolidayListProps) {
  if (holidays.length === 0) return null;
  return (
    <div className={styles.list}>
      {holidays.map((h) => (
        <HolidayChip key={h.id} holiday={h} compact={compact} />
      ))}
    </div>
  );
}
