import apiClient from './client';
import type { DashboardData, ProductivityStats, FinanceStats, AnalyticsParams } from '@/types';

/**
 * API-модуль для аналитики и статистики.
 * Эндпоинты: /analytics/dashboard/, /analytics/productivity/, /analytics/finance/
 */
export const analyticsApi = {
  /**
   * Получение сводных данных для главного дашборда.
   * @returns Агрегированные данные дашборда
   */
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<DashboardData>('/analytics/dashboard/');
    return data;
  },

  /**
   * Получение статистики продуктивности за период.
   * @param params - Параметры запроса (период, группировка)
   * @returns Статистика продуктивности
   */
  getProductivityStats: async (params?: AnalyticsParams): Promise<ProductivityStats> => {
    const { data } = await apiClient.get<ProductivityStats>('/analytics/productivity/', {
      params,
    });
    return data;
  },

  /**
   * Получение финансовой статистики за период.
   * @param params - Параметры запроса (период, группировка)
   * @returns Финансовая статистика
   */
  getFinanceStats: async (params?: AnalyticsParams): Promise<FinanceStats> => {
    const { data } = await apiClient.get<FinanceStats>('/analytics/finance/', { params });
    return data;
  },
};
