export type UserRole = 'director' | 'accountant';

export interface User {
  role: UserRole;
  name: string;
  title: string;
}

const USERS: Record<UserRole, { password: string; name: string; title: string }> = {
  director: {
    password: import.meta.env.VITE_DIRECTOR_PASSWORD ?? 'inclave-dir',
    name: 'Директор',
    title: 'Руководитель предприятия',
  },
  accountant: {
    password: import.meta.env.VITE_ACCOUNTANT_PASSWORD ?? 'inclave-buh',
    name: 'Бухгалтер',
    title: 'Финансовый отдел',
  },
};

export function authenticate(role: UserRole, password: string): User | null {
  const user = USERS[role];
  if (!user || user.password !== password) return null;
  return { role, name: user.name, title: user.title };
}

export const SESSION_KEY = 'inclave-erp-session';

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed.role !== 'director' && parsed.role !== 'accountant') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
