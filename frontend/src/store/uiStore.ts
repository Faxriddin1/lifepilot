import { create } from 'zustand';
import i18n from '@/i18n';

type Theme = 'light' | 'dark';
type Locale = 'en' | 'ru';

interface UiState {
  sidebarCollapsed: boolean;
  theme: Theme;
  locale: Locale;
  quickAddOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setQuickAddOpen: (open: boolean) => void;
  initFromStorage: () => void;
}

/**
 * Zustand-стор для управления UI-состоянием приложения.
 * Управляет темой (light/dark), локалью (en/ru) и состоянием сайдбара.
 * Настройки сохраняются в localStorage.
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  locale: 'en',
  quickAddOpen: false,

  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),

  toggleSidebar: () =>
    set((state) => {
      const newVal = !state.sidebarCollapsed;
      localStorage.setItem('sidebar_collapsed', JSON.stringify(newVal));
      return { sidebarCollapsed: newVal };
    }),

  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
    set({ sidebarCollapsed: collapsed });
  },

  setTheme: (theme: Theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setLocale: (locale: Locale) => {
    localStorage.setItem('locale', locale);
    i18n.changeLanguage(locale);
    set({ locale });
  },

  initFromStorage: () => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
    const savedLocale = (localStorage.getItem('locale') as Locale) || 'en';
    const savedSidebar = localStorage.getItem('sidebar_collapsed');

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({
      theme: savedTheme,
      locale: savedLocale,
      sidebarCollapsed: savedSidebar ? JSON.parse(savedSidebar) : false,
    });
  },
}));
