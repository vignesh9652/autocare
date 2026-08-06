import axios, { AxiosError, type AxiosInstance } from 'axios';

export const TOKEN_KEY = 'autocare_token';
export const USER_KEY = 'autocare_user';

/* ------------------------------------------------------------------ */
/* Auth storage helpers                                                */
/* ------------------------------------------------------------------ */

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove every auth-related key from localStorage. */
export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ------------------------------------------------------------------ */
/* Single configured Axios instance                                    */
/* ------------------------------------------------------------------ */

export const api: AxiosInstance = axios.create({
  // API modules call the gateway with explicit paths (e.g. '/api/auth/login'),
  // so the baseURL must be empty by default (same-origin: proxied by Vite in
  // dev and by nginx in the Docker image). Set VITE_API_BASE_URL to a full
  // origin (e.g. http://localhost:8080) to call the gateway directly.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT (from localStorage) as a Bearer token on every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401 response, drop the invalid token and bounce to /login.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      // Avoid a redirect loop when we are already on the login page.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------ */
/* Helpers to read errors from Spring's error body                    */
/* ------------------------------------------------------------------ */

interface ErrorBody {
  error?: string;
  message?: string;
  status?: number;
}

/** Extract a human-readable message from an Axios error. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorBody | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.message) return error.message;
  }
  return fallback;
}
