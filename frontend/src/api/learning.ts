import apiClient from './client';
import type { CreateGoalData } from '@/types/learning';

/**
 * API-модуль для Learning Goals и AI Tutor.
 * Эндпоинты: /learning/goals/, /learning/tasks/, /learning/goals/{id}/ask/, /learning/goals/{id}/tutor-history/
 */

// Goals
export const getGoals = () =>
  apiClient.get('/learning/goals/').then(r => r.data?.results ?? r.data);

export const getGoal = (id: string) =>
  apiClient.get(`/learning/goals/${id}/`).then(r => r.data);

export const createGoal = (data: CreateGoalData) =>
  apiClient.post('/learning/goals/', data).then(r => r.data);

export const updateGoal = (id: string, data: Partial<CreateGoalData>) =>
  apiClient.patch(`/learning/goals/${id}/`, data).then(r => r.data);

export const deleteGoal = (id: string) =>
  apiClient.delete(`/learning/goals/${id}/`);

// Plan lifecycle
export const generatePlan = (id: string) =>
  apiClient.post(`/learning/goals/${id}/generate-plan/`).then(r => r.data);

export const getGoalStatus = (id: string) =>
  apiClient.get(`/learning/goals/${id}/status/`).then(r => r.data);

export const confirmPlan = (id: string, planJson?: any) =>
  apiClient.post(`/learning/goals/${id}/confirm-plan/`, planJson ? { plan_json: planJson } : {}).then(r => r.data);

// Tasks
export const completeTask = (id: string) =>
  apiClient.post(`/learning/tasks/${id}/complete/`).then(r => r.data);

export const skipTask = (id: string) =>
  apiClient.post(`/learning/tasks/${id}/skip/`).then(r => r.data);

export const rateTask = (id: string, rating: number, notes?: string) =>
  apiClient.post(`/learning/tasks/${id}/rate/`, { rating, notes }).then(r => r.data);

// Today
export const getTodayTasks = (goalId: string) =>
  apiClient.get(`/learning/goals/${goalId}/today/`).then(r => r.data);

// Progress
export const getProgress = (goalId: string) =>
  apiClient.get(`/learning/goals/${goalId}/progress/`).then(r => r.data);

// Adaptation
export const requestAdapt = (goalId: string, reason: string) =>
  apiClient.post(`/learning/goals/${goalId}/adapt/`, { reason }).then(r => r.data);

// Streak
export const buyFreeze = (goalId: string) =>
  apiClient.post(`/learning/goals/${goalId}/buy-freeze/`).then(r => r.data);

// Tutor
export const askTutor = (goalId: string, data: { question: string; task_id?: string }) =>
  apiClient.post(`/learning/goals/${goalId}/ask/`, data).then(r => r.data);

export const getTutorHistory = (goalId: string, params?: { limit?: number; task_id?: string }) =>
  apiClient.get(`/learning/goals/${goalId}/tutor-history/`, { params }).then(r => r.data);

export const clearTutorHistory = (goalId: string) =>
  apiClient.delete(`/learning/goals/${goalId}/tutor-history/`);

// Pause/Resume
export const pauseGoal = (id: string) =>
  apiClient.post(`/learning/goals/${id}/pause/`).then(r => r.data);

export const resumeGoal = (id: string) =>
  apiClient.post(`/learning/goals/${id}/resume/`).then(r => r.data);
