import apiClient from './client';
import type { User, AuthTokens, LoginCredentials, RegisterData, ProfileUpdateData } from '@/types';

/**
 * API-модуль для аутентификации и управления профилем.
 * Эндпоинты: /auth/login/, /auth/register/, /auth/logout/, /auth/me/, /auth/profile/
 */
export const authApi = {
  /**
   * Аутентификация пользователя по email и паролю.
   * @param credentials - Email и пароль
   * @returns JWT-токены (access и refresh)
   */
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const { data } = await apiClient.post<{ user: User; tokens: AuthTokens }>('/auth/login/', credentials);
    return data.tokens;
  },

  /**
   * Регистрация нового пользователя.
   * @param registerData - Данные регистрации (email, пароль, имя)
   * @returns JWT-токены (access и refresh)
   */
  register: async (registerData: RegisterData): Promise<AuthTokens> => {
    const { data } = await apiClient.post<{ user: User; tokens: AuthTokens }>('/auth/register/', registerData);
    return data.tokens;
  },

  /** Выход из системы. Отправляет refresh-токен для инвалидации на сервере. */
  logout: async (): Promise<void> => {
    const refresh = localStorage.getItem('refresh_token');
    await apiClient.post('/auth/logout/', { refresh });
  },

  /**
   * Обновление JWT-токенов по refresh-токену.
   * @returns Новая пара JWT-токенов
   */
  refreshToken: async (): Promise<AuthTokens> => {
    const refresh = localStorage.getItem('refresh_token');
    const { data } = await apiClient.post<AuthTokens>('/auth/token/refresh/', { refresh });
    return data;
  },

  /**
   * Получение профиля текущего пользователя.
   * @returns Данные пользователя
   */
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me/');
    return data;
  },

  /**
   * Обновление профиля текущего пользователя.
   * @param profileData - Данные для обновления (имя, валюта и т.д.)
   * @returns Обновлённые данные пользователя
   */
  updateProfile: async (profileData: ProfileUpdateData): Promise<User> => {
    const { data } = await apiClient.patch<User>('/auth/me/', profileData);
    return data;
  },

  /**
   * Аутентификация через Google OAuth.
   * @param credential - Google ID token от Google Sign-In
   * @returns JWT-токены
   */
  googleAuth: async (credential: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<{ user: User; tokens: AuthTokens; created: boolean }>(
      '/auth/google/',
      { credential },
    );
    return data.tokens;
  },
};
