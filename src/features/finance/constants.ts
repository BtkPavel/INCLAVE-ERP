import type { PaymentRecurrence } from '../../api/types/finance';

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
