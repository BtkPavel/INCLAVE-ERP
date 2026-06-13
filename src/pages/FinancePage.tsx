import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import styles from './ModulePage.module.css';

const FINANCE_SECTIONS = [
  { to: '/finance/income', label: 'Доходы' },
  { to: '/finance/expense', label: 'Расходы' },
  { to: '/finance/taxes', label: 'Налоги' },
] as const;

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const resolvedPath = pathname.startsWith('/finance/payment-calendar')
    ? '/finance/expense'
    : pathname;
  const activeIndex = FINANCE_SECTIONS.findIndex((section) =>
    resolvedPath.startsWith(section.to),
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return FINANCE_SECTIONS.map((section, index) => ({
    label: section.label,
    to: index === currentIndex ? undefined : section.to,
  }));
}

export function FinancePage() {
  const { pathname } = useLocation();
  const isRoot = pathname === '/finance' || pathname === '/finance/';

  if (isRoot) {
    return <Navigate to="/finance/income" replace />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.4</span>
        <h1 className={styles.title}>Финансы</h1>
        <p className={styles.subtitle}>
          Учёт, отчётность и финансовый контроль предприятия INCLAVE
        </p>
      </header>

      <Breadcrumbs items={getBreadcrumbs(pathname)} />

      <Outlet />
    </div>
  );
}
