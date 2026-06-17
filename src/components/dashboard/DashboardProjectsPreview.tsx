import type { CSSProperties } from 'react';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardProjectsPreview.module.css';

const PROJECTS = [
  { name: 'ERP внедрение', progress: 78, tone: 'accent' as const },
  { name: 'Склад', progress: 62, tone: 'teal' as const },
  { name: 'CRM', progress: 40, tone: 'muted' as const },
];

export function DashboardProjectsPreview() {
  return (
    <div className={shared.shell} style={{ '--preview-accent': '#5e6ad2' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>Активные проекты</span>
        <span className={shared.badge}>3 в работе</span>
      </div>

      <div className={shared.body}>
        <ul className={styles.list}>
          {PROJECTS.map((project) => (
            <li key={project.name} className={styles.item}>
              <div className={styles.itemTop}>
                <span className={styles.name}>{project.name}</span>
                <span className={styles.percent}>{project.progress}%</span>
              </div>
              <div className={styles.track}>
                <span
                  className={`${styles.fill} ${styles[`fill_${project.tone}`]}`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerDot} ${styles.dotActive}`} />
          2 активных
        </span>
        <span className={shared.footerStat}>
          <span className={`${shared.footerDot} ${styles.dotPause}`} />
          1 на паузе
        </span>
      </div>
    </div>
  );
}
