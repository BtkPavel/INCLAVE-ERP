import type { FinanceActivityScope, PaymentRecurrence } from '../../api/types/finance';

export const BILLING_STATUS_LABELS = {
  one_time: 'Разовый',
  cyclic: 'Циклично',
} as const;

export const PAYMENT_RECURRENCE_OPTIONS: Array<{
  value: PaymentRecurrence;
  label: string;
}> = [
  { value: 'monthly', label: 'Раз в месяц' },
  { value: 'quarterly', label: 'Раз в 3 месяца' },
  { value: 'yearly', label: 'Раз в год' },
];

export const ACTIVITY_SCOPE_CORE_LABELS = {
  income: 'Выручка по основной деятельности',
  expense: 'Расход по основной деятельности',
} as const;

export function formatActivityMeta(
  scope: FinanceActivityScope,
  kind: 'income' | 'expense',
  productName?: string | null,
): string {
  if (scope === 'product' && productName) return `Продукт · ${productName}`;
  if (scope === 'product') return 'Продукт';
  return ACTIVITY_SCOPE_CORE_LABELS[kind];
}
