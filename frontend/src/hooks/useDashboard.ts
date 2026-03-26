import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import type { AnalyticsParams } from '@/types';

/**
 * Хук для получения сводных данных дашборда.
 * Автоматически обновляется каждые 5 минут.
 * @returns Результат запроса TanStack Query с агрегированными данными дашборда
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsApi.getDashboard,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Хук для получения статистики продуктивности.
 * @param params - Параметры запроса (период, группировка)
 * @returns Результат запроса TanStack Query со статистикой продуктивности
 */
export function useProductivityStats(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['productivity-stats', params],
    queryFn: () => analyticsApi.getProductivityStats(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Хук для получения финансовой статистики.
 * @param params - Параметры запроса (период, группировка)
 * @returns Результат запроса TanStack Query с финансовой статистикой
 */
export function useFinanceStats(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['finance-stats', params],
    queryFn: () => analyticsApi.getFinanceStats(params),
    staleTime: 2 * 60 * 1000,
  });
}
