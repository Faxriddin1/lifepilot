import apiClient from './client';
import type { PaginatedResponse } from '@/types';

/** API модуль админ-панели. Все endpoints защищены is_staff. */
export const adminApi = {
  // Dashboard
  getDashboard: async () => {
    const { data } = await apiClient.get('/admin-panel/dashboard/');
    return data;
  },

  // Users
  getUsers: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/admin-panel/users/', { params });
    return data;
  },
  getUser: async (id: string) => {
    const { data } = await apiClient.get(`/admin-panel/users/${id}/`);
    return data;
  },
  updateUser: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.patch(`/admin-panel/users/${id}/`, payload);
    return data;
  },
  deleteUser: async (id: string) => {
    await apiClient.delete(`/admin-panel/users/${id}/`);
  },
  toggleUserActive: async (id: string) => {
    const { data } = await apiClient.post(`/admin-panel/users/${id}/toggle_active/`);
    return data;
  },
  toggleUserStaff: async (id: string) => {
    const { data } = await apiClient.post(`/admin-panel/users/${id}/toggle_staff/`);
    return data;
  },

  // Generic CRUD for any resource
  getList: async (resource: string, params?: Record<string, string>) => {
    const { data } = await apiClient.get(`/admin-panel/${resource}/`, { params });
    return data;
  },
  getItem: async (resource: string, id: string) => {
    const { data } = await apiClient.get(`/admin-panel/${resource}/${id}/`);
    return data;
  },
  deleteItem: async (resource: string, id: string) => {
    await apiClient.delete(`/admin-panel/${resource}/${id}/`);
  },
  updateItem: async (resource: string, id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.patch(`/admin-panel/${resource}/${id}/`, payload);
    return data;
  },
};
