import type { UserRole } from '../auth/users';
import type { ModulePermissions, UserPermissions } from '../api/types/auth';

const MODULE_ROUTES: { key: keyof ModulePermissions; prefix: string }[] = [
  { key: 'overview', prefix: '/' },
  { key: 'projects', prefix: '/projects' },
  { key: 'projects', prefix: '/products' },
  { key: 'calendar', prefix: '/calendar' },
  { key: 'tasks', prefix: '/tasks' },
  { key: 'finance', prefix: '/finance' },
  { key: 'hr', prefix: '/hr' },
  { key: 'settings', prefix: '/settings' },
];

const DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  director: {
    overview: true,
    projects: true,
    calendar: true,
    tasks: true,
    finance: true,
    hr: true,
    settings: true,
  },
  accountant: {
    overview: true,
    projects: true,
    calendar: true,
    tasks: true,
    finance: true,
    hr: true,
    settings: false,
  },
  product_office: {
    overview: false,
    projects: true,
    calendar: true,
    tasks: true,
    finance: false,
    hr: false,
    settings: false,
  },
};

export function getDefaultPermissions(role: UserRole): UserPermissions {
  return {
    modules: DEFAULT_PERMISSIONS[role],
    projectIds: role === 'director' ? null : [],
  };
}

export function canAccessPath(
  role: UserRole,
  path: string,
  permissions?: UserPermissions,
): boolean {
  if (path === '/pass' || path.startsWith('/pass/')) {
    return role === 'director';
  }

  const modules = permissions?.modules ?? DEFAULT_PERMISSIONS[role];
  return MODULE_ROUTES.some(({ key, prefix }) => {
    if (!modules[key]) return false;
    if (prefix === '/') return path === '/';
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

export function getDefaultPath(
  role: UserRole,
  permissions?: UserPermissions,
): string {
  const modules = permissions?.modules ?? DEFAULT_PERMISSIONS[role];
  if (modules.projects) return '/projects';
  if (modules.overview) return '/';
  if (modules.tasks) return '/tasks';
  if (modules.calendar) return '/calendar';
  if (modules.finance) return '/finance';
  if (modules.hr) return '/hr';
  if (modules.settings) return '/settings';
  return '/projects';
}

export function getNavItemsForUser(
  role: UserRole,
  permissions?: UserPermissions,
) {
  const all: Array<{
    to: string;
    label: string;
    icon: string;
    end?: boolean;
    key: keyof ModulePermissions;
  }> = [
    { to: '/', label: 'Обзор', icon: '◈', end: true, key: 'overview' },
    { to: '/projects', label: 'Проекты', icon: '▣', key: 'projects' },
    { to: '/products', label: 'Продукты', icon: '◇', end: false, key: 'projects' },
    { to: '/calendar', label: 'Календарь', icon: '◷', key: 'calendar' },
    { to: '/tasks', label: 'Задачи', icon: '☑', key: 'tasks' },
    { to: '/finance', label: 'Финансы', icon: '₽', end: false, key: 'finance' },
    { to: '/hr', label: 'Кадры', icon: '◎', end: false, key: 'hr' },
    { to: '/settings', label: 'Настройки', icon: '⚙', end: false, key: 'settings' },
  ];

  const modules = permissions?.modules ?? DEFAULT_PERMISSIONS[role];
  const items = all
    .filter((item) => modules[item.key])
    .map(({ to, label, icon, end }) => ({ to, label, icon, end }));
  if (role === 'director') {
    items.push({ to: '/pass', label: 'PASS', icon: '🔒', end: true });
  }
  return items;
}

export function canUseAssistant(_role: UserRole): boolean {
  return true;
}

export const MODULE_LABELS: Record<keyof ModulePermissions, string> = {
  overview: 'Обзор',
  projects: 'Проекты',
  calendar: 'Календарь',
  tasks: 'Задачи',
  finance: 'Финансы',
  hr: 'Кадры',
  settings: 'Настройки',
};
