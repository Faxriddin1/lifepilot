import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productivityApi } from '@/api/productivity';
import type { FocusFilters, StartFocusData, FocusSession } from '@/types';
import { showApiError, showSuccess } from '@/utils/errorHandler';

/**
 * Хук для управления фокус-сессией (таймер Pomodoro / Deep Work).
 * Управляет запуском, паузой, возобновлением и остановкой сессии.
 * Ведёт отсчёт прошедшего времени и вычисляет прогресс.
 * @returns Объект с состоянием сессии, таймером и методами управления (start, stop, pause, resume)
 */
export function useFocusSession() {
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const startMutation = useMutation({
    mutationFn: (data: StartFocusData) => productivityApi.startFocusSession(data),
    onSuccess: (session) => {
      setActiveSession(session);
      setElapsedSeconds(0);
      setIsPaused(false);
      startTimer();
      showSuccess('errors.sessionStarted');
    },
    onError: (error) => {
      showApiError(error);
    },
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => productivityApi.stopFocusSession(id),
    onSuccess: () => {
      clearTimer();
      setActiveSession(null);
      setElapsedSeconds(0);
      setIsPaused(false);
      queryClient.invalidateQueries({ queryKey: ['focus-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.sessionStopped');
    },
    onError: (error) => {
      showApiError(error);
    },
  });

  const pause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    if (activeSession) {
      stopMutation.mutate(activeSession.id);
    }
  }, [activeSession, stopMutation]);

  const totalSeconds = activeSession ? activeSession.duration * 60 : 0;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;

  return {
    activeSession,
    elapsedSeconds,
    remainingSeconds,
    progress: Math.min(progress, 100),
    isPaused,
    isActive: !!activeSession,
    start: startMutation.mutate,
    stop,
    pause,
    resume,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
}

/**
 * Хук для получения истории фокус-сессий с фильтрацией.
 * @param filters - Фильтры для запроса (период, тип сессии)
 * @returns Результат запроса TanStack Query с пагинированной историей сессий
 */
export function useFocusHistory(filters?: FocusFilters) {
  return useQuery({
    queryKey: ['focus-history', filters],
    queryFn: () => productivityApi.getFocusHistory(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для получения списка привычек пользователя.
 * @returns Результат запроса TanStack Query со списком привычек
 */
export function useHabitsQuery() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: productivityApi.getHabits,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для создания новой привычки.
 * @returns Мутация TanStack Query для создания привычки
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productivityApi.createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showSuccess('errors.habitCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для обновления привычки. */
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string; color: string; icon: string }> }) =>
      productivityApi.updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для удаления привычки. */
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productivityApi.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для логирования выполнения привычки за определённую дату.
 * Инвалидирует кеш привычек и дашборда.
 * @returns Мутация TanStack Query для записи лога привычки
 */
export function useLogHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: { date: string; count?: number } }) =>
      productivityApi.logHabit(habitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для toggle привычки (создать/удалить лог). Обновляет streak после успешного toggle. */
export function useToggleHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      productivityApi.toggleHabitLog(habitId, date),
    onSuccess: () => {
      // Refresh habits to update streak counts
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
