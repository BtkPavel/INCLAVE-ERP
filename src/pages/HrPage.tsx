import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import styles from './ModulePage.module.css';

const HR_SECTIONS = [
  { to: '/hr/staff', label: 'Штатный' },
  { to: '/hr/outsource', label: 'Аутсорс' },
] as const;

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const activeIndex = HR_SECTIONS.findIndex((section) =>
    pathname.startsWith(section.to),
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return HR_SECTIONS.map((section, index) => ({
    label: section.label,
    to: index === currentIndex ? undefined : section.to,
  }));
}

export function HrPage() {
  const { pathname } = useLocation();
  const isRoot = pathname === '/hr' || pathname === '/hr/';

  if (isRoot) {
    return <Navigate to="/hr/staff" replace />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.5</span>
        <h1 className={styles.title}>Кадры</h1>
        <p className={styles.subtitle}>
          Управление штатными сотрудниками и аутсорс-специалистами INCLAVE
        </p>
      </header>

      <Breadcrumbs items={getBreadcrumbs(pathname)} />

      <Outlet />
    </div>
  );
}
