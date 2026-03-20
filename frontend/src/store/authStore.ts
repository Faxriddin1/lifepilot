import { create } from 'zustand';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { authApi } from '@/api/auth';
import i18n from '@/i18n';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand-стор для управления аутентификацией.
 * Хранит JWT-токены, данные пользователя и предоставляет методы login/register/logout.
 * Токены сохраняются в localStorage для персистенции между сессиями.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials);
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);

    const user = await authApi.getProfile();

    if (user.locale && i18n.language !== user.locale) {
      await i18n.changeLanguage(user.locale);
      localStorage.setItem('locale', user.locale);
    }

    set({
      user,
      token: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (data: RegisterData) => {
    const tokens = await authApi.register(data);
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);

    const user = await authApi.getProfile();

    if (user.locale && i18n.language !== user.locale) {
      await i18n.changeLanguage(user.locale);
      localStorage.setItem('locale', user.locale);
    }

    set({
      user,
      token: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => set({ user }),

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (token && refreshToken) {
      set({
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      authApi
        .getProfile()
        .then((user) => {
          if (user.locale && i18n.language !== user.locale) {
            i18n.changeLanguage(user.locale);
            localStorage.setItem('locale', user.locale);
          }
          set({ user });
        })
        .catch(() => {
          get().logout();
        });
    } else {
      set({ isLoading: false });
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
