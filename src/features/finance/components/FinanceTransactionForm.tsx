import { useState } from 'react';
import type { CreateTransactionDto, Transaction, TransactionType } from '../../../api/types/finance';
import { DatePicker } from '../../../components/DatePicker';
import styles from './FinanceTransactionForm.module.css';

interface FinanceTransactionFormProps {
  type: TransactionType;
  createLabel: string;
  descriptionPlaceholder: string;
  onSubmit: (dto: CreateTransactionDto) => Promise<void>;
  initial?: Transaction | null;
  onCancel?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceTransactionForm({
  type,
  createLabel,
  descriptionPlaceholder,
  onSubmit,
  initial,
  onCancel,
}: FinanceTransactionFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [category, setCategory] = useState(initial?.category ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!description.trim()) {
      setError('Укажите описание');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Укажите корректную сумму');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: category.trim() || undefined,
        date,
        accountId: 'main',
      });
      if (!initial) {
        setDescription('');
        setAmount('');
        setCategory('');
        setDate(todayIso());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Описание</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={descriptionPlaceholder}
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
            placeholder="выручка, услуги..."
          />
        </label>

        <label className={styles.field}>
          <span>Дата</span>
          <DatePicker value={date} onChange={setDate} required />
        </label>
      </div>

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
          {saving ? 'Сохранение…' : initial ? 'Сохранить' : createLabel}
        </button>
      </div>
    </form>
  );
}
