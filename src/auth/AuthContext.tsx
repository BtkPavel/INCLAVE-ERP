import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/modules/auth.api';
import { apiClient, clearAuthToken } from '../api/client';
import { ApiError } from '../api/errors';
import { setTasksAssignee } from '../backend/tasks/tasksService';
import { getDefaultPermissions } from './permissions';
import {
  authenticate,
  clearSession,
  loadSession,
  saveSession,
  type User,
  type UserRole,
} from './users';

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  login: (role: UserRole, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasStoredToken(): boolean {
  try {
    return !!localStorage.getItem('inclave-erp-token');
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    apiClient.isMockMode() ? loadSession() : null,
  );
  const [authLoading, setAuthLoading] = useState(
    () => !apiClient.isMockMode() && hasStoredToken(),
  );

  useEffect(() => {
    if (apiClient.isMockMode()) return;

    if (!hasStoredToken()) {
      clearSession();
      clearAuthToken();
      setUser(null);
      setAuthLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        const next: User = {
          role: data.role,
          name: data.name,
          title: data.title,
          permissions: data.permissions ?? getDefaultPermissions(data.role),
        };
        saveSession(next);
        setUser(next);
        setTasksAssignee(next.role);
      })
      .catch(() => {
        clearSession();
        clearAuthToken();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback(async (role: UserRole, password: string): Promise<LoginResult> => {
    if (apiClient.isMockMode()) {
      const authenticated = authenticate(role, password);
      if (!authenticated) return { ok: false, error: 'Неверный пароль' };
      const next: User = {
        ...authenticated,
        permissions: getDefaultPermissions(authenticated.role),
      };
      saveSession(next);
      setUser(next);
      setTasksAssignee(next.role);
      return { ok: true };
    }

    try {
      const session = await authApi.login({ role, password });
      const next: User = {
        role: session.user.role,
        name: session.user.name,
        title: session.user.title,
        permissions: session.user.permissions ?? getDefaultPermissions(session.user.role),
      };
      saveSession(next);
      setUser(next);
      setTasksAssignee(next.role);
      return { ok: true };
    } catch (err) {
      if (ApiError.isApiError(err)) {
        if (err.status === 401) {
          return { ok: false, error: 'Неверный пароль' };
        }
        if (err.status === 403 && err.code === 'ACCESS_BLOCKED') {
          return { ok: false, error: 'Доступ заблокирован. Обратитесь к директору.' };
        }
        if (err.status === 0) {
          return {
            ok: false,
            error: 'Нет связи с сервером. Откройте https://erp-inclave.pro',
          };
        }
        return { ok: false, error: err.message };
      }
      return {
        ok: false,
        error: 'Нет связи с сервером. Откройте https://erp-inclave.pro',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    if (!apiClient.isMockMode()) {
      try {
        await authApi.logout();
      } catch {
        clearAuthToken();
      }
    } else {
      clearSession();
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, authLoading, login, logout }),
    [user, authLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
