import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import styles from './ModulePage.module.css';

const PROJECT_SECTIONS = [
  { to: '/projects/invest', label: 'Инвест проекты' },
  { to: '/projects/current', label: 'Текущие проекты' },
] as const;

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const activeIndex = PROJECT_SECTIONS.findIndex((section) =>
    pathname.startsWith(section.to),
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return PROJECT_SECTIONS.map((section, index) => ({
    label: section.label,
    to: index === currentIndex ? undefined : section.to,
  }));
}

export function ProjectsPage() {
  const { pathname } = useLocation();
  const isRoot = pathname === '/projects' || pathname === '/projects/';

  if (isRoot) {
    return <Navigate to="/projects/invest" replace />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.1</span>
        <h1 className={styles.title}>Проекты</h1>
        <p className={styles.subtitle}>
          Управление проектами и инициативами предприятия INCLAVE
        </p>
      </header>

      <Breadcrumbs items={getBreadcrumbs(pathname)} />

      <Outlet />
    </div>
  );
}
