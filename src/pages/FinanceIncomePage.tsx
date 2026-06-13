import { useState } from 'react';
import type { Transaction } from '../api/types/finance';
import { FinanceTransactionForm } from '../features/finance/components/FinanceTransactionForm';
import { FinanceTransactionList } from '../features/finance/components/FinanceTransactionList';
import { useFinanceSection, useTransactionActions } from '../hooks/useModuleApi';
import styles from './FinanceExpensePage.module.css';

export function FinanceIncomePage() {
  const { version, create, update, remove } = useTransactionActions();
  const incomeState = useFinanceSection('income', version);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const items =
    incomeState.status === 'success'
      ? (incomeState.data.data as Transaction[])
      : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.fig}>FIG 1.4.1</span>
          <h2 className={styles.title}>Доходы</h2>
          <p className={styles.subtitle}>
            Учёт поступлений: добавляйте доходы и отслеживайте выручку предприятия.
          </p>
        </div>
      </div>

      <FinanceTransactionForm
        key={editing?.id ?? 'new-income'}
        type="income"
        createLabel="Создать доход"
        descriptionPlaceholder="Оплата по договору, услуги..."
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

      {incomeState.status === 'loading' || incomeState.status === 'idle' ? (
        <div className={styles.loading}>Загрузка доходов…</div>
      ) : incomeState.status === 'error' ? (
        <div className={styles.error} role="alert">
          {incomeState.error}
        </div>
      ) : (
        <FinanceTransactionList
          items={items}
          emptyText="Доходов пока нет — создайте первый доход выше"
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
