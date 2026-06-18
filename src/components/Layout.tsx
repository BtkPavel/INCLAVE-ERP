import { useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { canAccessPath, getDefaultPath } from '../auth/permissions';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationBanner } from './NotificationBanner';
import { useTaskNotifications } from '../notifications/useTaskNotifications';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useTaskNotifications();

  if (user && !canAccessPath(user.role, location.pathname, user.permissions)) {
    return <Navigate to={getDefaultPath(user.role, user.permissions)} replace />;
  }

  return (
    <div className={styles.app}>
      <Header
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((v) => !v)}
      />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className={`${styles.main} app-main`}>
        <div className={`${styles.content} app-content`}>
          <NotificationBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
