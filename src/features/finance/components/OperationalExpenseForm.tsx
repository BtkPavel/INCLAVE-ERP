import { useState } from 'react';
import type {
  CreateOperationalExpenseDto,
  ExpenseBillingStatus,
  FinanceActivityScope,
  OperationalExpense,
  PaymentRecurrence,
} from '../../../api/types/finance';
import {
  BILLING_STATUS_LABELS,
  PAYMENT_RECURRENCE_OPTIONS,
} from '../constants';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { FinanceActivityFields } from './FinanceActivityFields';
import { useInvestmentProducts } from '../hooks/useInvestmentProducts';
import styles from './OperationalExpenseForm.module.css';

interface OperationalExpenseFormProps {
  onSubmit: (dto: CreateOperationalExpenseDto) => Promise<void>;
  initial?: OperationalExpense | null;
  onCancel?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OperationalExpenseForm({
  onSubmit,
  initial,
  onCancel,
}: OperationalExpenseFormProps) {
  const { projects } = useInvestmentProducts();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [category, setCategory] = useState(initial?.category ?? '');
  const [activityScope, setActivityScope] = useState<FinanceActivityScope>(
    initial?.activityScope ?? 'core',
  );
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayIso());
  const [billingStatus, setBillingStatus] = useState<ExpenseBillingStatus>(
    initial?.billingStatus ?? 'one_time',
  );
  const [recurrence, setRecurrence] = useState<PaymentRecurrence>(
    initial?.recurrence ?? 'monthly',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!title.trim()) {
      setError('Укажите название расхода');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Укажите корректную сумму');
      return;
    }
    if (activityScope === 'product' && !projectId) {
      setError('Выберите продукт из инвест-проектов');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: parsedAmount,
        category: category.trim() || undefined,
        activityScope,
        projectId: activityScope === 'product' ? projectId : null,
        startDate,
        billingStatus,
        recurrence: billingStatus === 'cyclic' ? recurrence : null,
      });
      if (!initial) {
        setTitle('');
        setAmount('');
        setCategory('');
        setActivityScope('core');
        setProjectId('');
        setStartDate(todayIso());
        setBillingStatus('one_time');
        setRecurrence('monthly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить расход');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <FinanceActivityFields
        kind="expense"
        activityScope={activityScope}
        projectId={projectId}
        products={projects}
        onScopeChange={(scope) => {
          setActivityScope(scope);
          if (scope === 'core') setProjectId('');
        }}
        onProjectChange={setProjectId}
      />

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Название</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Аренда, подписка, услуги..."
            required
          />
        </label>

        <label className={styles.field}>
          <span>Сумма, BYN</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Категория</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="аренда, услуги..."
          />
        </label>

        <label className={styles.field}>
          <span>Дата первого платежа</span>
          <DatePicker value={startDate} onChange={setStartDate} required />
        </label>
      </div>

      <fieldset className={styles.statusGroup}>
        <legend>Статус платежа</legend>
        <div className={styles.statusOptions}>
          {(Object.keys(BILLING_STATUS_LABELS) as ExpenseBillingStatus[]).map((status) => (
            <label key={status} className={styles.radio}>
              <input
                type="radio"
                name="billingStatus"
                checked={billingStatus === status}
                onChange={() => setBillingStatus(status)}
              />
              <span>{BILLING_STATUS_LABELS[status]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {billingStatus === 'cyclic' && (
        <label className={styles.field}>
          <span>Цикличность оплат</span>
          <FormSelect value={recurrence} onChange={(v) => setRecurrence(v as PaymentRecurrence)}>
            {PAYMENT_RECURRENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </label>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Сохранение…' : initial ? 'Сохранить' : 'Создать расход'}
        </button>
      </div>
    </form>
  );
}
