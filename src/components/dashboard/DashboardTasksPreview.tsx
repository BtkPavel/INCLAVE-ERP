import type { CSSProperties } from 'react';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardTasksPreview.module.css';

const COLUMNS = [
  { label: 'К выполнению', cards: 2 },
  { label: 'В работе', cards: 1 },
  { label: 'Готово', cards: 2 },
] as const;

export function DashboardTasksPreview() {
  return (
    <div className={shared.shell} style={{ '--preview-accent': '#3d9a8b' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>Мои задачи</span>
        <span className={shared.badge}>12 всего</span>
      </div>

      <div className={shared.body}>
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <div key={col.label} className={styles.column}>
              <span className={styles.colLabel}>{col.label}</span>
              <div className={styles.cards}>
                {Array.from({ length: col.cards }, (_, i) => (
                  <span key={i} className={styles.card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.barTodo}`} />
          5 к выполнению
        </span>
        <span className={shared.footerStat}>
          <span className={`${shared.footerBar} ${styles.barDone}`} />
          7 выполнено
        </span>
      </div>
    </div>
  );
}
