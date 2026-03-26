import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as learningApi from '@/api/learning';
import type { CreateGoalData } from '@/types/learning';
import { showApiError, showSuccess } from '@/utils/errorHandler';

/**
 * Хуки TanStack Query для Learning Goals, Tasks и AI Tutor.
 */

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Хук для получения списка учебных целей пользователя.
 * @returns Результат запроса TanStack Query со списком целей
 */
export function useGoals() {
  return useQuery({
    queryKey: ['learning-goals'],
    queryFn: learningApi.getGoals,
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для получения детальной информации об учебной цели (с модулями и задачами).
 * @param id - UUID учебной цели
 * @returns Результат запроса TanStack Query с данными цели
 */
export function useGoal(id: string) {
  return useQuery({
    queryKey: ['learning-goal', id],
    queryFn: () => learningApi.getGoal(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для опроса статуса генерации плана цели.
 * Автоматически обновляется каждые 3 секунды когда включён.
 * @param id - UUID учебной цели
 * @param enabled - Флаг активации опроса (включать только во время генерации)
 * @returns Результат запроса TanStack Query со статусом цели
 */
export function useGoalStatus(id: string, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['learning-goal-status', id],
    queryFn: async () => {
      const data = await learningApi.getGoalStatus(id);
      // When status changes from generating → preview/draft, refresh the main goal query
      if (data && data.status !== 'generating') {
        queryClient.invalidateQueries({ queryKey: ['learning-goal', id] });
        queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      }
      return data;
    },
    enabled: !!id && enabled,
    refetchInterval: enabled ? 3000 : false,
    staleTime: 0,
  });
}

/**
 * Хук для получения задач на сегодня по учебной цели.
 * @param goalId - UUID учебной цели
 * @returns Результат запроса TanStack Query со списком задач на сегодня
 */
export function useTodayTasks(goalId: string) {
  return useQuery({
    queryKey: ['learning-today', goalId],
    queryFn: () => learningApi.getTodayTasks(goalId),
    enabled: !!goalId,
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для получения прогресса по учебной цели.
 * @param goalId - UUID учебной цели
 * @returns Результат запроса TanStack Query с данными прогресса
 */
export function useProgress(goalId: string) {
  return useQuery({
    queryKey: ['learning-progress', goalId],
    queryFn: () => learningApi.getProgress(goalId),
    enabled: !!goalId,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для загрузки истории переписки с AI Tutor.
 * @param goalId - UUID учебной цели
 * @param taskId - UUID задачи (опционально, для фильтрации по задаче)
 * @returns Результат запроса TanStack Query с историей сообщений
 */
export function useTutorHistory(goalId: string, taskId?: string) {
  return useQuery({
    queryKey: ['tutor-history', goalId, taskId],
    queryFn: () => learningApi.getTutorHistory(goalId, { limit: 50, task_id: taskId }),
    enabled: !!goalId,
    staleTime: 0,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/**
 * Хук для удаления учебной цели.
 * Инвалидирует кеш списка целей при успехе.
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для создания новой учебной цели.
 * Инвалидирует кеш списка целей при успехе.
 * @returns Мутация TanStack Query для создания цели
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => learningApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      showSuccess('errors.goalCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для запуска AI-генерации учебного плана.
 * Инвалидирует статус и детали цели при успехе.
 * @returns Мутация TanStack Query для генерации плана
 */
export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningApi.generatePlan(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goal-status', id] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', id] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для подтверждения сгенерированного плана и активации цели.
 * Инвалидирует кеш списка целей и детали конкретной цели.
 * @returns Мутация TanStack Query для подтверждения плана
 */
export function useConfirmPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, planJson }: { id: string; planJson?: any }) =>
      learningApi.confirmPlan(id, planJson),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', id] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal-status', id] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для отметки задачи как выполненной.
 * Инвалидирует детали цели, задачи на сегодня и прогресс.
 * @returns Мутация TanStack Query для завершения задачи
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningApi.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goal'] });
      queryClient.invalidateQueries({ queryKey: ['learning-today'] });
      queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для пропуска задачи.
 * Инвалидирует детали цели и задачи на сегодня.
 * @returns Мутация TanStack Query для пропуска задачи
 */
export function useSkipTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningApi.skipTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goal'] });
      queryClient.invalidateQueries({ queryKey: ['learning-today'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для оценки выполненной задачи.
 * Инвалидирует детали цели после сохранения оценки.
 * @returns Мутация TanStack Query для оценки задачи
 */
export function useRateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rating, notes }: { id: string; rating: number; notes?: string }) =>
      learningApi.rateTask(id, rating, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-goal'] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для отправки вопроса AI Tutor.
 * Инвалидирует историю переписки после получения ответа.
 * @param goalId - UUID учебной цели
 * @returns Мутация TanStack Query для отправки вопроса
 */
export function useAskTutor(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { question: string; task_id?: string }) =>
      learningApi.askTutor(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-history', goalId] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для очистки истории переписки с AI Tutor.
 * Инвалидирует историю переписки после успешной очистки.
 * @param goalId - UUID учебной цели
 * @returns Мутация TanStack Query для очистки истории
 */
export function useClearTutorHistory(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => learningApi.clearTutorHistory(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-history', goalId] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для запроса адаптации учебного плана.
 * Инвалидирует детали цели и список целей после адаптации.
 * @returns Мутация TanStack Query для адаптации плана
 */
export function useRequestAdapt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, reason }: { goalId: string; reason: string }) =>
      learningApi.requestAdapt(goalId, reason),
    onSuccess: (_data, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', goalId] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для покупки заморозки стрика.
 * Инвалидирует список целей и детали конкретной цели.
 * @returns Мутация TanStack Query для покупки заморозки
 */
export function useBuyFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => learningApi.buyFreeze(goalId),
    onSuccess: (_data, goalId) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', goalId] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для постановки учебной цели на паузу.
 * Инвалидирует список целей и детали конкретной цели.
 * @returns Мутация TanStack Query для паузы цели
 */
export function usePauseGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningApi.pauseGoal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', id] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для возобновления учебной цели после паузы.
 * Инвалидирует список целей и детали конкретной цели.
 * @returns Мутация TanStack Query для возобновления цели
 */
export function useResumeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningApi.resumeGoal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['learning-goal', id] });
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
