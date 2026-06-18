import { useAuth } from '../auth/AuthContext';
import { canUseAssistant } from '../auth/permissions';
import { ThemeToggle } from './ThemeToggle';
import { AiAssistantButton } from './AiAssistantButton';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className={`${styles.header} app-header`}>
      <div className={styles.gradient} aria-hidden />
      <div className={styles.inner}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            <span className={`${styles.menuIcon} ${menuOpen ? styles.menuIconOpen : ''}`} />
          </button>
          <a href="/" className={styles.logo}>
            <img src="/logowhite.svg" alt="INCLAVE" height={28} className="logoImage" />
            <span className={styles.erpBadge}>ERP</span>
          </a>
        </div>

        <div className={styles.right}>
          <div className={styles.toolbar}>
            <ThemeToggle />
            {user && canUseAssistant(user.role) && <AiAssistantButton />}
          </div>
          {user && (
            <>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.title}</span>
            </div>
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              Выйти
            </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
