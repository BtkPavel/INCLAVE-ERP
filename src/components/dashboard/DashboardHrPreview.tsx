import type { CSSProperties } from 'react';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardHrPreview.module.css';

const TEAM = [
  { initials: 'ИА', name: 'Иванов' },
  { initials: 'КМ', name: 'Козлова' },
  { initials: 'ПВ', name: 'Петров' },
];

export function DashboardHrPreview() {
  return (
    <div className={shared.shell} style={{ '--preview-accent': '#8b5cf6' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>Команда</span>
        <span className={shared.badge}>24 человека</span>
      </div>

      <div className={shared.body}>
        <div className={styles.avatars}>
          {TEAM.map((person, index) => (
            <div key={person.initials} className={styles.person} style={{ zIndex: TEAM.length - index }}>
              <span className={styles.avatar}>{person.initials}</span>
              <span className={styles.personName}>{person.name}</span>
            </div>
          ))}
          <div className={styles.more}>
            <span className={styles.moreAvatar}>+21</span>
          </div>
        </div>

        <div className={styles.departments}>
          <span className={styles.deptChip}>Производство</span>
          <span className={styles.deptChip}>Офис</span>
          <span className={styles.deptChip}>Склад</span>
        </div>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerDot} ${styles.dotStaff}`} />
          18 штат
        </span>
        <span className={shared.footerStat}>
          <span className={`${shared.footerDot} ${styles.dotOutsource}`} />
          6 аутсорс
        </span>
      </div>
    </div>
  );
}
