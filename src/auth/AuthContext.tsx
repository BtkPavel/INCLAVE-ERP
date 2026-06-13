import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  login: (role: UserRole, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession());

  const login = useCallback((role: UserRole, password: string) => {
    const authenticated = authenticate(role, password);
    if (!authenticated) return false;
    saveSession(authenticated);
    setUser(authenticated);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
