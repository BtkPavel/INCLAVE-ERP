import type {
  OperationalExpense,
  PaymentCalendarEntry,
  PaymentCalendarParams,
  PaymentRecurrence,
} from '../../api/types/finance';

const RECURRENCE_MONTHS: Record<PaymentRecurrence, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsKeepDay(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function nextOccurrenceDate(current: Date, recurrence: PaymentRecurrence): Date {
  return addMonthsKeepDay(current, RECURRENCE_MONTHS[recurrence]);
}

function isWithinRange(date: Date, from: Date, to: Date): boolean {
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
}

function buildEntry(
  expense: OperationalExpense,
  dueDate: Date,
  occurrenceIndex: number,
): PaymentCalendarEntry {
  return {
    id: `${expense.id}-${toIsoDate(dueDate)}-${occurrenceIndex}`,
    expenseId: expense.id,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    dueDate: toIsoDate(dueDate),
    billingStatus: expense.billingStatus,
    recurrence: expense.recurrence,
  };
}

function generateForExpense(
  expense: OperationalExpense,
  from: Date,
  to: Date,
): PaymentCalendarEntry[] {
  const start = parseDate(expense.startDate);
  const entries: PaymentCalendarEntry[] = [];

  if (expense.billingStatus === 'one_time') {
    if (isWithinRange(start, from, to)) {
      entries.push(buildEntry(expense, start, 0));
    }
    return entries;
  }

  if (!expense.recurrence) {
    return entries;
  }

  let current = new Date(start);
  let index = 0;
  const horizon = addMonthsKeepDay(to, RECURRENCE_MONTHS[expense.recurrence]);

  while (current.getTime() <= horizon.getTime()) {
    if (current.getTime() >= from.getTime() && current.getTime() <= to.getTime()) {
      entries.push(buildEntry(expense, current, index));
    }

    current = nextOccurrenceDate(current, expense.recurrence);
    index += 1;

    if (index > 500) break;
  }

  return entries;
}

export function buildPaymentCalendar(
  expenses: OperationalExpense[],
  params: PaymentCalendarParams,
): PaymentCalendarEntry[] {
  const from = parseDate(params.from);
  const to = parseDate(params.to);

  return expenses
    .flatMap((expense) => generateForExpense(expense, from, to))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export const PAYMENT_RECURRENCE_LABELS: Record<PaymentRecurrence, string> = {
  monthly: 'Раз в месяц',
  quarterly: 'Раз в 3 месяца',
  yearly: 'Раз в год',
};
