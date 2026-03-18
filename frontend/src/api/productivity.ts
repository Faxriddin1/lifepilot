import apiClient from './client';
import type {
  FocusSession,
  Habit,
  HabitLog,
  DailyLog,
  CreateDailyLogData,
  PaginatedResponse,
  FocusFilters,
  StartFocusData,
  CreateHabitData,
} from '@/types';

/**
 * API-модуль для работы с продуктивностью (фокус-сессии и привычки).
 * Эндпоинты: /productivity/focus-sessions/, /productivity/habits/, /productivity/habit-logs/
 */
export const productivityApi = {
  /**
   * Запуск новой фокус-сессии.
   * @param sessionData - Параметры сессии (длительность, тип)
   * @returns Созданная фокус-сессия
   */
  startFocusSession: async (sessionData: StartFocusData): Promise<FocusSession> => {
    const { data } = await apiClient.post<FocusSession>('/productivity/focus-sessions/start/', sessionData);
    return data;
  },

  /**
   * Остановка активной фокус-сессии.
   * @param id - UUID сессии
   * @returns Завершённая фокус-сессия
   */
  stopFocusSession: async (id: string): Promise<FocusSession> => {
    const { data } = await apiClient.post<FocusSession>(`/productivity/focus-sessions/${id}/stop/`);
    return data;
  },

  /**
   * Получение истории фокус-сессий с фильтрацией.
   * @param filters - Фильтры (период, тип сессии)
   * @returns Пагинированный список фокус-сессий
   */
  getFocusHistory: async (filters?: FocusFilters): Promise<PaginatedResponse<FocusSession>> => {
    const { data } = await apiClient.get<PaginatedResponse<FocusSession>>('/productivity/focus-sessions/history/', {
      params: filters,
    });
    return data;
  },

  /**
   * Получение списка привычек пользователя.
   * @returns Массив привычек
   */
  getHabits: async (): Promise<Habit[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Habit>>('/productivity/habits/');
    return data.results;
  },

  /**
   * Создание новой привычки.
   * @param habitData - Данные привычки (название, частота, цель)
   * @returns Созданная привычка
   */
  createHabit: async (habitData: CreateHabitData): Promise<Habit> => {
    const { data } = await apiClient.post<Habit>('/productivity/habits/', habitData);
    return data;
  },

  /**
   * Запись выполнения привычки за дату.
   * @param habitId - UUID привычки
   * @param logData - Данные лога (дата, количество, заметки)
   * @returns Созданный лог привычки
   */
  logHabit: async (habitId: string, logData: { date: string; count?: number; notes?: string }): Promise<HabitLog> => {
    const { data } = await apiClient.post<HabitLog>('/productivity/habit-logs/', { habit: habitId, ...logData });
    return data;
  },

  /**
   * Получение логов привычки за период.
   * @param habitId - UUID привычки
   * @param filters - Фильтры по датам (date_from, date_to)
   * @returns Массив логов привычки
   */
  getHabitLogs: async (
    habitId: string,
    filters?: { date_from?: string; date_to?: string }
  ): Promise<HabitLog[]> => {
    const { data } = await apiClient.get<PaginatedResponse<HabitLog>>('/productivity/habit-logs/', {
      params: { habit: habitId, ...filters },
    });
    return data.results;
  },

  /** Получение списка дневниковых записей. */
  getDailyLogs: async (): Promise<PaginatedResponse<DailyLog>> => {
    const { data } = await apiClient.get<PaginatedResponse<DailyLog>>('/productivity/daily-logs/');
    return data;
  },

  /** Получение записи за сегодня. */
  getDailyLogToday: async (): Promise<DailyLog> => {
    const { data } = await apiClient.get<DailyLog>('/productivity/daily-logs/today/');
    return data;
  },

  /** Создание дневниковой записи. */
  createDailyLog: async (logData: CreateDailyLogData): Promise<DailyLog> => {
    const { data } = await apiClient.post<DailyLog>('/productivity/daily-logs/', logData);
    return data;
  },

  /** Обновление дневниковой записи. */
  updateDailyLog: async (id: string, logData: Partial<CreateDailyLogData>): Promise<DailyLog> => {
    const { data } = await apiClient.patch<DailyLog>(`/productivity/daily-logs/${id}/`, logData);
    return data;
  },
};
