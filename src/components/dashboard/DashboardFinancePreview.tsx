import type { CSSProperties } from 'react';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardFinancePreview.module.css';

const ROWS = [
  { label: 'Доходы', value: '124 500', width: 88, tone: 'income' as const },
  { label: 'Расходы', value: '68 200', width: 58, tone: 'expense' as const },
  { label: 'Прибыль', value: '56 300', width: 48, tone: 'profit' as const },
];

export function DashboardFinancePreview() {
  return (
    <div className={shared.shell} style={{ '--preview-accent': '#c27803' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>Июнь 2026</span>
        <span className={shared.badge}>BYN</span>
      </div>

      <div className={shared.body}>
        <ul className={styles.rows}>
          {ROWS.map((row) => (
            <li key={row.label} className={styles.row}>
              <div className={styles.rowTop}>
                <span className={styles.label}>{row.label}</span>
                <span className={styles.value}>{row.value}</span>
              </div>
              <div className={styles.track}>
                <span
                  className={`${styles.bar} ${styles[`bar_${row.tone}`]}`}
                  style={{ width: `${row.width}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.barIncome}`} />
          +12% к маю
        </span>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.barExpense}`} />
          налог 18%
        </span>
      </div>
    </div>
  );
}
