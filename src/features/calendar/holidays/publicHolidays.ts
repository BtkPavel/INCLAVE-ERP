import { toDateKey } from '../utils/dates';

export type HolidayCountry = 'BY' | 'RU';

export interface PublicHoliday {
  id: string;
  country: HolidayCountry;
  name: string;
  dateKey: string;
}

const COUNTRY_LABELS: Record<HolidayCountry, string> = {
  BY: 'РБ',
  RU: 'РФ',
};

export function getCountryLabel(country: HolidayCountry): string {
  return COUNTRY_LABELS[country];
}

/** Православная Пасха (григорианский календарь) */
export function getOrthodoxEaster(year: number): Date {
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;
  const d = (19 * a + 15) % 30;
  const e = (2 * b + 4 * c + 6 * d + 6) % 7;
  const julianDay = 22 + d + e;
  const julianMonth = julianDay > 31 ? 4 : 3;
  const julianDate = julianDay > 31 ? julianDay - 31 : julianDay;
  const gregorianOffset = year > 2099 ? 14 : 13;
  const date = new Date(year, julianMonth - 1, julianDate);
  date.setDate(date.getDate() + gregorianOffset);
  return date;
}

type FixedHoliday = {
  month: number;
  day: number;
  country: HolidayCountry;
  name: string;
};

const FIXED_HOLIDAYS: FixedHoliday[] = [
  // Общие
  { month: 1, day: 1, country: 'BY', name: 'Новый год' },
  { month: 1, day: 1, country: 'RU', name: 'Новый год' },
  { month: 1, day: 2, country: 'BY', name: 'Новый год' },
  { month: 1, day: 7, country: 'BY', name: 'Рождество Христово (православное)' },
  { month: 1, day: 7, country: 'RU', name: 'Рождество Христово (православное)' },
  { month: 3, day: 8, country: 'BY', name: 'День женщин' },
  { month: 3, day: 8, country: 'RU', name: 'Международный женский день' },
  { month: 5, day: 1, country: 'BY', name: 'Праздник труда' },
  { month: 5, day: 1, country: 'RU', name: 'Праздник Весны и Труда' },
  { month: 5, day: 9, country: 'BY', name: 'День Победы' },
  { month: 5, day: 9, country: 'RU', name: 'День Победы' },

  // Беларусь
  { month: 1, day: 2, country: 'RU', name: 'Новогодние каникулы' },
  { month: 1, day: 3, country: 'RU', name: 'Новогодние каникулы' },
  { month: 1, day: 4, country: 'RU', name: 'Новогодние каникулы' },
  { month: 1, day: 5, country: 'RU', name: 'Новогодние каникулы' },
  { month: 1, day: 6, country: 'RU', name: 'Новогодние каникулы' },
  { month: 1, day: 8, country: 'RU', name: 'Новогодние каникулы' },
  { month: 7, day: 3, country: 'BY', name: 'День Независимости (День Республики)' },
  { month: 11, day: 7, country: 'BY', name: 'День Октябрьской революции' },
  { month: 12, day: 25, country: 'BY', name: 'Рождество Христово (католическое)' },

  // Россия
  { month: 2, day: 23, country: 'RU', name: 'День защитника Отечества' },
  { month: 6, day: 12, country: 'RU', name: 'День России' },
  { month: 11, day: 4, country: 'RU', name: 'День народного единства' },
];

function movableHolidays(year: number): PublicHoliday[] {
  const easter = getOrthodoxEaster(year);
  const radunitsa = new Date(easter);
  radunitsa.setDate(radunitsa.getDate() + 9);

  return [
    {
      id: `${year}-easter-by`,
      country: 'BY',
      name: 'Православная Пасха',
      dateKey: toDateKey(easter),
    },
    {
      id: `${year}-easter-ru`,
      country: 'RU',
      name: 'Православная Пасха',
      dateKey: toDateKey(easter),
    },
    {
      id: `${year}-radunitsa-by`,
      country: 'BY',
      name: 'Радуница',
      dateKey: toDateKey(radunitsa),
    },
  ];
}

function fixedHolidaysForYear(year: number): PublicHoliday[] {
  return FIXED_HOLIDAYS.map((h, i) => {
    const date = new Date(year, h.month - 1, h.day);
    return {
      id: `${year}-fixed-${i}-${h.country}`,
      country: h.country,
      name: h.name,
      dateKey: toDateKey(date),
    };
  });
}

const cache = new Map<number, PublicHoliday[]>();

export function getHolidaysForYear(year: number): PublicHoliday[] {
  if (cache.has(year)) return cache.get(year)!;
  const holidays = [...fixedHolidaysForYear(year), ...movableHolidays(year)];
  cache.set(year, holidays);
  return holidays;
}

export function getHolidaysOnDate(date: Date): PublicHoliday[] {
  const key = toDateKey(date);
  return getHolidaysForYear(date.getFullYear()).filter((h) => h.dateKey === key);
}

export function hasHoliday(date: Date): boolean {
  return getHolidaysOnDate(date).length > 0;
}
