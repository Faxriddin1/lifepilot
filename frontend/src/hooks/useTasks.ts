import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import type { TaskFilters, CreateTaskData, Task, BulkUpdateTasksData } from '@/types';
import { showApiError, showSuccess } from '@/utils/errorHandler';

/**
 * Хук для получения списка задач с фильтрацией и пагинацией.
 * @param filters - Фильтры для запроса задач (статус, приоритет, проект и т.д.)
 * @returns Результат запроса TanStack Query с пагинированным списком задач
 */
export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getTasks(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для получения одной задачи по ID.
 * @param id - UUID задачи
 * @returns Результат запроса TanStack Query с данными задачи
 */
export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  });
}

/**
 * Хук для создания новой задачи.
 * Инвалидирует кеш задач и дашборда при успехе.
 * @returns Мутация TanStack Query для создания задачи
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.taskCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для обновления задачи с оптимистичным обновлением UI.
 * При ошибке откатывает изменения к предыдущему состоянию.
 * @returns Мутация TanStack Query для обновления задачи
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskData> }) =>
      tasksApi.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks'] });

      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const paginated = old as { results?: Task[] };
        if (!paginated.results) return old;
        return {
          ...paginated,
          results: paginated.results.map((task: Task) =>
            task.id === id ? { ...task, ...data } : task
          ),
        };
      });

      return { previousTasks };
    },
    onError: (error, _vars, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      showApiError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Хук для удаления задачи.
 * Инвалидирует кеш задач и дашборда при успехе.
 * @returns Мутация TanStack Query для удаления задачи
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.taskDeleted');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для массового обновления задач.
 * @returns Мутация TanStack Query для bulk-обновления задач
 */
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateTasksData) => tasksApi.bulkUpdateTasks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('errors.taskUpdated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для получения списка проектов.
 * @returns Результат запроса TanStack Query со списком проектов
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: tasksApi.getProjects,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для создания нового проекта.
 * Инвалидирует кеш проектов при успехе.
 * @returns Мутация TanStack Query для создания проекта
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('errors.projectCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для обновления проекта. */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').CreateProjectData> }) =>
      tasksApi.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('errors.projectUpdated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для удаления проекта. */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('errors.projectDeleted');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
