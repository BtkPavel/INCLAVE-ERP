import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { OperationalExpense } from '../api/types/finance';
import {
  useOperationalExpenseActions,
  useOperationalExpenses,
} from '../hooks/useModuleApi';
import { OperationalExpenseForm } from '../features/finance/components/OperationalExpenseForm';
import { OperationalExpensesList } from '../features/finance/components/OperationalExpensesList';
import styles from './FinanceExpensePage.module.css';

export function FinanceExpensePage() {
  const { version, create, update, remove } = useOperationalExpenseActions();
  const expensesState = useOperationalExpenses(version);
  const [editing, setEditing] = useState<OperationalExpense | null>(null);

  const expenses =
    expensesState.status === 'success' ? expensesState.data.data : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.fig}>FIG 1.4.2</span>
          <h2 className={styles.title}>Расходы</h2>
          <p className={styles.subtitle}>
            Добавляйте расходы и назначайте статус «Циклично» — тогда платежи появятся в платежном календаре.
          </p>
        </div>
        <Link to="/finance/payment-calendar" className={styles.calendarLink}>
          Платежный календарь →
        </Link>
      </div>

      <OperationalExpenseForm
        key={editing?.id ?? 'new'}
        initial={editing}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSubmit={async (dto) => {
          if (editing) {
            await update(editing.id, dto);
            setEditing(null);
          } else {
            await create(dto);
          }
        }}
      />

      {expensesState.status === 'loading' || expensesState.status === 'idle' ? (
        <div className={styles.loading}>Загрузка расходов…</div>
      ) : expensesState.status === 'error' ? (
        <div className={styles.error} role="alert">
          {expensesState.error}
        </div>
      ) : (
        <OperationalExpensesList
          expenses={expenses}
          onEdit={setEditing}
          onDelete={async (id) => {
            await remove(id);
            if (editing?.id === id) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
