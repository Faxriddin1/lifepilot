import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Axios-клиент для взаимодействия с REST API.
 * Базовый URL: /api/v1, таймаут: 15 сек.
 * Включает интерцепторы для автоматической подстановки JWT и обновления токенов при 401.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api/v1' : `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

/**
 * Обрабатывает очередь неудавшихся запросов после обновления токена.
 * @param error - Ошибка обновления токена (null при успехе)
 * @param token - Новый access-токен
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const refreshBaseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
        const { data } = await axios.post(`${refreshBaseUrl}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        processQueue(null, data.access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
