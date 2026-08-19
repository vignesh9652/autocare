import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: 'autocare-theme' }
  )
);

export function applyTheme(dark: boolean): void {
  const root = document.documentElement;
  if (dark) root.classList.add('dark');
  else root.classList.remove('dark');
}
