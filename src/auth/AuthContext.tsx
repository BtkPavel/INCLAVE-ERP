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
import { apiClient } from '../api/client';
import { setTasksAssignee } from '../backend/tasks/tasksService';
import {
  authenticate,
  clearSession,
  loadSession,
  saveSession,
  type User,
  type UserRole,
} from './users';

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  login: (role: UserRole, password: string) => Promise<boolean>;
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

    const session = loadSession();
    if (session) {
      setUser(session);
      setTasksAssignee(session.role);
    }

    if (!hasStoredToken()) {
      setAuthLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        const next: User = { role: data.role, name: data.name, title: data.title };
        saveSession(next);
        setUser(next);
        setTasksAssignee(next.role);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback(async (role: UserRole, password: string) => {
    if (apiClient.isMockMode()) {
      const authenticated = authenticate(role, password);
      if (!authenticated) return false;
      saveSession(authenticated);
      setUser(authenticated);
      setTasksAssignee(authenticated.role);
      return true;
    }

    try {
      const session = await authApi.login({ role, password });
      const next: User = {
        role: session.user.role,
        name: session.user.name,
        title: session.user.title,
      };
      saveSession(next);
      setUser(next);
      setTasksAssignee(next.role);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!apiClient.isMockMode()) {
      try {
        await authApi.logout();
      } catch {
        clearSession();
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
