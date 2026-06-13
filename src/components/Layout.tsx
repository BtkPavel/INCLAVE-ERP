import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationBanner } from './NotificationBanner';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
