import type { PaginatedResponse } from '../api/types/common';
import type { TaxRecord } from '../api/types/finance';
import { ApiModuleShell } from '../components/ApiModuleShell';
import { useFinanceSection } from '../hooks/useModuleApi';
import styles from './FinanceTaxesPage.module.css';

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function FinanceTaxesPage() {
  const data = useFinanceSection('taxes');

  return (
    <ApiModuleShell
      state={data}
      figLabel="FIG 1.4.3"
      emptyTitle="Налоги"
      emptyDescription="Налог рассчитывается только при режиме «доход на прибыль». Сейчас другой режим налогообложения или нет данных."
    >
      {(response) => {
        const page = response as PaginatedResponse<TaxRecord>;
        const [tax] = page.data;

        if (!tax) {
          return null;
        }

        return (
          <div className={styles.panel}>
            <span className={styles.fig}>FIG 1.4.3</span>

            <div className={styles.hero}>
              <div>
                <p className={styles.label}>К уплате</p>
                <p className={styles.amount}>{formatMoney(tax.amount, tax.currency)}</p>
              </div>
              <span className={styles.badge}>Доход на прибыль</span>
            </div>

            <div className={styles.formula}>
              <p className={styles.formulaTitle}>Формула расчёта (backend)</p>
              <code className={styles.formulaCode}>
                налог = прибыль × {formatRate(tax.rate ?? 0.06)}
              </code>
              <p className={styles.formulaHint}>
                прибыль = доходы − расходы
              </p>
            </div>

            <dl className={styles.breakdown}>
              <div className={styles.row}>
                <dt>Доходы</dt>
                <dd>{formatMoney(tax.income ?? 0, tax.currency)}</dd>
              </div>
              <div className={styles.row}>
                <dt>Расходы</dt>
                <dd>{formatMoney(tax.expenses ?? 0, tax.currency)}</dd>
              </div>
              <div className={`${styles.row} ${styles.rowAccent}`}>
                <dt>Прибыль</dt>
                <dd>{formatMoney(tax.profit ?? 0, tax.currency)}</dd>
              </div>
              <div className={`${styles.row} ${styles.rowTax}`}>
                <dt>{tax.name}</dt>
                <dd>{formatMoney(tax.amount, tax.currency)}</dd>
              </div>
            </dl>

            <p className={styles.meta}>
              Срок уплаты: {new Date(tax.dueDate).toLocaleDateString('ru-RU')}
            </p>
          </div>
        );
      }}
    </ApiModuleShell>
  );
}
