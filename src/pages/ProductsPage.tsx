import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import styles from './ModulePage.module.css';

const PRODUCT_DETAIL_RE = /^\/products\/([^/]+)(?:\/documentation)?$/;

export interface ProductsOutletContext {
  setDetailLabel: (label: string | null) => void;
}

function parseProductDetail(pathname: string) {
  const match = pathname.match(PRODUCT_DETAIL_RE);
  if (!match) return null;
  return { projectId: match[1], isDocumentation: pathname.endsWith('/documentation') };
}

function getBreadcrumbs(pathname: string, detailLabel: string | null): BreadcrumbItem[] {
  const detail = parseProductDetail(pathname);
  if (detail) {
    const base = `/products/${detail.projectId}`;
    if (detail.isDocumentation) {
      return [
        { label: 'Продукты', to: '/products' },
        { label: detailLabel ?? 'Загрузка…', to: base },
        { label: 'Документация' },
      ];
    }
    return [
      { label: 'Продукты', to: '/products' },
      { label: detailLabel ?? 'Загрузка…' },
    ];
  }
  return [{ label: 'Продукты' }];
}

export function ProductsPage() {
  const { pathname } = useLocation();
  const [detailLabel, setDetailLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!parseProductDetail(pathname)) {
      setDetailLabel(null);
    }
  }, [pathname]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.1.3</span>
        <h1 className={styles.title}>Продукты</h1>
        <p className={styles.subtitle}>
          Продуктовая линейка компании: каждый инвест-проект является отдельным продуктом
        </p>
      </header>

      <Breadcrumbs items={getBreadcrumbs(pathname, detailLabel)} />

      <Outlet context={{ setDetailLabel } satisfies ProductsOutletContext} />
    </div>
  );
}
