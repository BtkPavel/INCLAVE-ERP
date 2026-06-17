import type { CSSProperties } from 'react';
import shared from './dashboardPreview.shared.module.css';
import styles from './DashboardHrPreview.module.css';

const TEAM = [
  { initials: 'Д', name: 'Директор' },
  { initials: 'Б', name: 'Бухгалтер' },
];

export function DashboardHrPreview() {
  return (
    <div className={shared.shell} style={{ '--preview-accent': '#8b5cf6' } as CSSProperties} aria-hidden>
      <div className={shared.header}>
        <span className={shared.title}>Доступ к системе</span>
        <span className={shared.badge}>{TEAM.length} пользователя</span>
      </div>

      <div className={shared.body}>
        <div className={styles.avatars}>
          {TEAM.map((person, index) => (
            <div key={person.initials} className={styles.person} style={{ zIndex: TEAM.length - index }}>
              <span className={styles.avatar}>{person.initials}</span>
              <span className={styles.personName}>{person.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={shared.footer}>
        <span className={shared.footerStat}>
          <span className={`${shared.footerDot} ${styles.dotStaff}`} />
          Учётные записи ERP
        </span>
      </div>
    </div>
  );
}
