import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Обзор', icon: '◈', end: true },
  { to: '/projects', label: 'Проекты', icon: '▣' },
  { to: '/calendar', label: 'Календарь', icon: '◷' },
  { to: '/tasks', label: 'Задачи', icon: '☑' },
  { to: '/finance', label: 'Финансы', icon: '₽', end: false },
  { to: '/hr', label: 'Кадры', icon: '◎', end: false },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={onClose}
          aria-label="Закрыть меню"
        />
      )}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <nav className={styles.nav}>
          <p className={styles.sectionLabel}>Модули</p>
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end ?? true}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ''}`
                  }
                  onClick={onClose}
                >
                  <span className={styles.icon} aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.footer}>
          <span className={styles.mono}>INCLAVE ERP v0.1</span>
        </div>
      </aside>
    </>
  );
}
