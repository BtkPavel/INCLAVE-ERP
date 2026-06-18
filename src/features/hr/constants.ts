import type { EmployeeStatus, PaymentType } from '../../api/types/hr';
import type { UserRole } from '../../auth/users';

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Активен',
  on_leave: 'В отпуске',
  terminated: 'Уволен',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  paid: 'С оплатой',
  unpaid: 'Без оплаты',
};

export const SYSTEM_ROLE_OPTIONS: { id: UserRole | ''; label: string }[] = [
  { id: '', label: 'Без доступа в ERP' },
  { id: 'director', label: 'Директор' },
  { id: 'accountant', label: 'Бухгалтер' },
  { id: 'product_office', label: 'Product Office' },
];

export function systemRoleLabel(role: string | null): string {
  if (!role) return 'Без доступа';
  return SYSTEM_ROLE_OPTIONS.find((option) => option.id === role)?.label ?? role;
}
