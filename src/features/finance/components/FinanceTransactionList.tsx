import type { Transaction } from '../../../api/types/finance';
import styles from './FinanceTransactionList.module.css';

interface FinanceTransactionListProps {
  items: Transaction[];
  emptyText: string;
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function FinanceTransactionList({
  items,
  emptyText,
  onEdit,
  onDelete,
}: FinanceTransactionListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.main}>
            <h3 className={styles.title}>{item.description}</h3>
            <p className={styles.meta}>
              {formatMoney(item.amount, item.currency)}
              {item.category ? ` · ${item.category}` : ''}
              {' · '}
              {new Date(item.date).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.editBtn} onClick={() => onEdit(item)}>
              Изменить
            </button>
            <button type="button" className={styles.deleteBtn} onClick={() => onDelete(item.id)}>
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
