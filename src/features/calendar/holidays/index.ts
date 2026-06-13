import { getHolidaysOnDate } from '../holidays/publicHolidays';

export function getHolidaysForDay(date: Date) {
  return getHolidaysOnDate(date);
}

export { getHolidaysOnDate, hasHoliday } from '../holidays/publicHolidays';
export type { PublicHoliday, HolidayCountry } from '../holidays/publicHolidays';
