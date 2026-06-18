import type { UserRole } from './users';

const PRODUCT_OFFICE_PREFIXES = ['/projects', '/calendar', '/tasks'];

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role !== 'product_office') return true;
  return PRODUCT_OFFICE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function getDefaultPath(role: UserRole): string {
  if (role === 'product_office') return '/projects';
  return '/';
}

export function getNavItemsForRole(role: UserRole) {
  const all = [
    { to: '/', label: 'Обзор', icon: '◈', end: true },
    { to: '/projects', label: 'Проекты', icon: '▣' },
    { to: '/calendar', label: 'Календарь', icon: '◷' },
    { to: '/tasks', label: 'Задачи', icon: '☑' },
    { to: '/finance', label: 'Финансы', icon: '₽', end: false },
    { to: '/hr', label: 'Кадры', icon: '◎', end: false },
  ];

  if (role === 'product_office') {
    return all.filter((item) =>
      PRODUCT_OFFICE_PREFIXES.includes(item.to),
    );
  }

  return all;
}

export function canUseAssistant(_role: UserRole): boolean {
  return true;
}
