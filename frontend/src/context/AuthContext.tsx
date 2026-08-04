import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearToken, getToken, setToken } from '@/api/client';
import type { AuthResponse, Role } from '@/types';

const USER_KEY = 'autocare_user';

interface StoredUser {
  userId: number;
  name: string;
  role: Role;
}

interface AuthContextValue {
  /** JWT for the current session, or null when logged out. */
  token: string | null;
  /** Current user profile (id/name/role), or null when logged out. */
  user: StoredUser | null;
  isAuthenticated: boolean;
  login: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<StoredUser | null>(() => readStoredUser());

  const login = useCallback((auth: AuthResponse) => {
    setToken(auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId: auth.userId, name: auth.name, role: auth.role }));
    setTokenState(auth.token);
    setUser({ userId: auth.userId, name: auth.name, role: auth.role });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
