import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearAuthStorage, getToken, setToken, USER_KEY } from '@/api/client';
import { login as loginApi, register as registerApi } from '@/api/authApi';
import type { AuthResponse, RegisterRequest, Role } from '@/types';

/** Decoded from the JWT payload — mirrors the backend JwtUtil claims. */
interface DecodedUser {
  userId: number;
  email: string;
  role: Role;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

interface AuthContextValue {
  /** JWT for the current session, or null when logged out. */
  token: string | null;
  /** Current user (decoded from the JWT), or null when logged out. */
  user: DecodedUser | null;
  isAuthenticated: boolean;
  /** True while a login()/register() request is in flight. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* JWT payload decoding (no external JWT library needed)               */
/* ------------------------------------------------------------------ */

/** base64url-decode and JSON.parse the payload (middle) segment of a JWT. */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    // JWT uses base64url: swap url-safe chars and restore padding.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function decodeUser(token: string): DecodedUser | null {
  const claims = decodeJwtPayload(token);
  if (!claims?.sub || !claims?.role) return null;
  return {
    userId: Number(claims.sub),
    email: claims.email ?? '',
    role: claims.role as Role,
  };
}

/** Fall back to the AuthResponse fields if the JWT payload can't be decoded. */
function userFrom(auth: AuthResponse, emailFallback: string): DecodedUser {
  const decoded = decodeUser(auth.token);
  if (decoded) return decoded;
  return { userId: auth.userId, email: emailFallback, role: auth.role };
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

function readStoredUser(): DecodedUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as DecodedUser) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<DecodedUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const persistSession = useCallback((auth: AuthResponse, emailFallback: string) => {
    const decoded = userFrom(auth, emailFallback);
    setToken(auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(decoded));
    setTokenState(auth.token);
    setUser(decoded);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const auth = await loginApi({ email, password });
        persistSession(auth, email);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      try {
        const auth = await registerApi(data);
        persistSession(auth, data.email);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthenticated: Boolean(token), isLoading, login, register, logout }),
    [token, user, isLoading, login, register, logout],
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
