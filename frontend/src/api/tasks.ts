import apiClient from './client';
import type {
  Task,
  Project,
  PaginatedResponse,
  TaskFilters,
  CreateTaskData,
  CreateProjectData,
  BulkUpdateTasksData,
} from '@/types';

/**
 * API-модуль для работы с задачами и проектами.
 * Эндпоинты: /tasks/items/, /tasks/projects/
 */
export const tasksApi = {
  /**
   * Получение списка задач с фильтрацией и пагинацией.
   * @param filters - Фильтры (статус, приоритет, проект, поиск и т.д.)
   * @returns Пагинированный список задач
   */
  getTasks: async (filters?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const { data } = await apiClient.get<PaginatedResponse<Task>>('/tasks/items/', { params: filters });
    return data;
  },

  /**
   * Получение задачи по ID.
   * @param id - UUID задачи
   * @returns Данные задачи
   */
  getTask: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/items/${id}/`);
    return data;
  },

  /**
   * Создание новой задачи.
   * @param taskData - Данные задачи (название, описание, приоритет и т.д.)
   * @returns Созданная задача
   */
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    const { data } = await apiClient.post<Task>('/tasks/items/', taskData);
    return data;
  },

  /**
   * Частичное обновление задачи (PATCH).
   * @param id - UUID задачи
   * @param taskData - Поля для обновления
   * @returns Обновлённая задача
   */
  updateTask: async (id: string, taskData: Partial<CreateTaskData>): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/items/${id}/`, taskData);
    return data;
  },

  /**
   * Удаление задачи.
   * @param id - UUID задачи
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/items/${id}/`);
  },

  /**
   * Массовое обновление задач.
   * @param bulkData - Данные для bulk-обновления (ID задач и общие поля)
   * @returns Массив обновлённых задач
   */
  bulkUpdateTasks: async (bulkData: BulkUpdateTasksData): Promise<Task[]> => {
    const { data } = await apiClient.patch<Task[]>('/tasks/items/bulk-update/', bulkData);
    return data;
  },

  /**
   * Получение списка проектов.
   * @returns Массив проектов
   */
  getProjects: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Project>>('/tasks/projects/');
    return data.results;
  },

  /**
   * Создание нового проекта.
   * @param projectData - Данные проекта (название, описание, цвет)
   * @returns Созданный проект
   */
  createProject: async (projectData: CreateProjectData): Promise<Project> => {
    const { data } = await apiClient.post<Project>('/tasks/projects/', projectData);
    return data;
  },

  /**
   * Частичное обновление проекта (PATCH).
   * @param id - UUID проекта
   * @param projectData - Поля для обновления
   * @returns Обновлённый проект
   */
  updateProject: async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
    const { data } = await apiClient.patch<Project>(`/tasks/projects/${id}/`, projectData);
    return data;
  },
};
