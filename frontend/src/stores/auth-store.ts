import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/types';
import { authApi } from '@/lib/api';

export interface AuthUser {
  userId: number;
  name: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone: string, role?: Role) => Promise<AuthUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      login: async (email, password) => {
        const auth = await authApi.login(email, password);
        const user = { userId: auth.userId, name: auth.name, role: auth.role };
        set({ token: auth.token, user });
        return user;
      },
      register: async (name, email, password, phone, role) => {
        const auth = await authApi.register({ name, email, password, phone, role });
        const user = { userId: auth.userId, name: auth.name, role: auth.role };
        set({ token: auth.token, user });
        return user;
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'autocare-session' }
  )
);
