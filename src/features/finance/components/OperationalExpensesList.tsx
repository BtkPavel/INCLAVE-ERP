import type { OperationalExpense } from '../../../api/types/finance';
import {
  BILLING_STATUS_LABELS,
  formatActivityMeta,
  PAYMENT_RECURRENCE_OPTIONS,
} from '../constants';
import styles from './OperationalExpensesList.module.css';

interface OperationalExpensesListProps {
  expenses: OperationalExpense[];
  productNameById?: Record<string, string>;
  onEdit: (expense: OperationalExpense) => void;
  onDelete: (id: string) => void;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function recurrenceLabel(recurrence: OperationalExpense['recurrence']): string {
  if (!recurrence) return '—';
  return PAYMENT_RECURRENCE_OPTIONS.find((item) => item.value === recurrence)?.label ?? recurrence;
}

export function OperationalExpensesList({
  expenses,
  productNameById = {},
  onEdit,
  onDelete,
}: OperationalExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Операционных расходов пока нет</p>
        <p className={styles.emptyHint}>Добавьте расход и при необходимости отметьте его как цикличный</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {expenses.map((expense) => (
        <li key={expense.id} className={styles.item}>
          <div className={styles.main}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{expense.title}</h3>
              <span
                className={`${styles.badge} ${expense.billingStatus === 'cyclic' ? styles.badgeCyclic : ''}`}
              >
                {BILLING_STATUS_LABELS[expense.billingStatus]}
              </span>
            </div>
            <p className={styles.meta}>
              {formatActivityMeta(
                expense.activityScope ?? 'core',
                'expense',
                expense.projectId ? productNameById[expense.projectId] : null,
              )}
              {' · '}
              {formatMoney(expense.amount, expense.currency)}
              {expense.category ? ` · ${expense.category}` : ''}
              {' · '}первый платёж {new Date(expense.startDate).toLocaleDateString('ru-RU')}
            </p>
            {expense.billingStatus === 'cyclic' && (
              <p className={styles.recurrence}>{recurrenceLabel(expense.recurrence)}</p>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.editBtn} onClick={() => onEdit(expense)}>
              Изменить
            </button>
            <button type="button" className={styles.deleteBtn} onClick={() => onDelete(expense.id)}>
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
