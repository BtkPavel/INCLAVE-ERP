import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import styles from './ModulePage.module.css';

const PROJECT_SECTIONS = [
  { to: '/projects/invest', label: 'Инвест проекты' },
  { to: '/projects/current', label: 'Текущие проекты' },
] as const;

const PROJECT_DETAIL_RE = /^\/projects\/(invest|current)\/([^/]+)(?:\/documentation)?$/;

export interface ProjectsOutletContext {
  setDetailLabel: (label: string | null) => void;
}

function parseProjectDetail(pathname: string) {
  const match = pathname.match(PROJECT_DETAIL_RE);
  if (!match) return null;
  return {
    section: match[1] as 'invest' | 'current',
    projectId: match[2],
    isDocumentation: pathname.endsWith('/documentation'),
  };
}

function getBreadcrumbs(pathname: string, detailLabel: string | null): BreadcrumbItem[] {
  const detail = parseProjectDetail(pathname);

  if (detail) {
    const section = detail.section === 'invest' ? PROJECT_SECTIONS[0] : PROJECT_SECTIONS[1];
    const base = `/projects/${detail.section}/${detail.projectId}`;
    if (detail.isDocumentation) {
      return [
        { label: section.label, to: section.to },
        { label: detailLabel ?? 'Загрузка…', to: base },
        { label: 'Документация' },
      ];
    }
    return [
      { label: section.label, to: section.to },
      { label: detailLabel ?? 'Загрузка…' },
    ];
  }

  const activeIndex = PROJECT_SECTIONS.findIndex(
    (section) => pathname === section.to || pathname === `${section.to}/`,
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return PROJECT_SECTIONS.map((section, index) => ({
    label: section.label,
    to: index === currentIndex ? undefined : section.to,
  }));
}

export function ProjectsPage() {
  const { pathname } = useLocation();
  const [detailLabel, setDetailLabel] = useState<string | null>(null);
  const isRoot = pathname === '/projects' || pathname === '/projects/';

  useEffect(() => {
    if (!parseProjectDetail(pathname)) {
      setDetailLabel(null);
    }
  }, [pathname]);

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

      <Breadcrumbs items={getBreadcrumbs(pathname, detailLabel)} />

      <Outlet context={{ setDetailLabel } satisfies ProjectsOutletContext} />
    </div>
  );
}
