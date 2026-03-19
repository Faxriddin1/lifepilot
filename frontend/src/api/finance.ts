import apiClient from './client';
import type {
  Transaction,
  Account,
  Category,
  Budget,
  Goal,
  PaginatedResponse,
  TransactionFilters,
  CreateTransactionData,
  CreateAccountData,
  CreateBudgetData,
  CreateGoalData,
} from '@/types';

/**
 * API-модуль для работы с финансами.
 * Эндпоинты: /finance/transactions/, /finance/accounts/, /finance/categories/, /finance/budgets/, /finance/goals/
 */
export const financeApi = {
  /**
   * Получение списка транзакций с фильтрацией.
   * @param filters - Фильтры (тип, категория, счёт, период)
   * @returns Пагинированный список транзакций
   */
  getTransactions: async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<Transaction>>('/finance/transactions/', {
      params: filters,
    });
    return data;
  },

  /**
   * Создание новой транзакции.
   * @param txData - Данные транзакции (сумма, описание, категория, счёт)
   * @returns Созданная транзакция
   */
  createTransaction: async (txData: CreateTransactionData): Promise<Transaction> => {
    const { data } = await apiClient.post<Transaction>('/finance/transactions/', txData);
    return data;
  },

  /**
   * Частичное обновление транзакции (PATCH).
   * @param id - UUID транзакции
   * @param txData - Поля для обновления
   * @returns Обновлённая транзакция
   */
  updateTransaction: async (
    id: string,
    txData: Partial<CreateTransactionData>
  ): Promise<Transaction> => {
    const { data } = await apiClient.patch<Transaction>(`/finance/transactions/${id}/`, txData);
    return data;
  },

  /**
   * Удаление транзакции.
   * @param id - UUID транзакции
   */
  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/transactions/${id}/`);
  },

  /**
   * Получение списка финансовых счетов.
   * @returns Массив счетов
   */
  getAccounts: async (): Promise<Account[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Account>>('/finance/accounts/');
    return data.results;
  },

  /**
   * Создание нового финансового счёта.
   * @param accountData - Данные счёта (название, тип, валюта, баланс)
   * @returns Созданный счёт
   */
  createAccount: async (accountData: CreateAccountData): Promise<Account> => {
    const { data } = await apiClient.post<Account>('/finance/accounts/', accountData);
    return data;
  },

  /**
   * Получение списка категорий транзакций.
   * @returns Массив категорий
   */
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Category>>('/finance/categories/');
    return data.results;
  },

  /**
   * Получение списка бюджетов.
   * @returns Массив бюджетов
   */
  getBudgets: async (): Promise<Budget[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Budget>>('/finance/budgets/');
    return data.results;
  },

  /**
   * Создание нового бюджета.
   * @param budgetData - Данные бюджета (категория, лимит, период)
   * @returns Созданный бюджет
   */
  createBudget: async (budgetData: CreateBudgetData): Promise<Budget> => {
    const { data } = await apiClient.post<Budget>('/finance/budgets/', budgetData);
    return data;
  },

  /** Удаление бюджета. */
  deleteBudget: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/budgets/${id}/`);
  },

  /**
   * Получение списка финансовых целей.
   * @returns Массив целей
   */
  getGoals: async (): Promise<Goal[]> => {
    const { data } = await apiClient.get<PaginatedResponse<Goal>>('/finance/goals/');
    return data.results;
  },

  /**
   * Создание новой финансовой цели.
   * @param goalData - Данные цели (название, целевая сумма, дата)
   * @returns Созданная цель
   */
  createGoal: async (goalData: CreateGoalData): Promise<Goal> => {
    const { data } = await apiClient.post<Goal>('/finance/goals/', goalData);
    return data;
  },

  /** Пополнение финансовой цели на указанную сумму. */
  contributeGoal: async (goalId: string, amount: number): Promise<Goal> => {
    const { data } = await apiClient.post<Goal>(`/finance/goals/${goalId}/contribute/`, { amount });
    return data;
  },

  /** Удаление финансовой цели. */
  deleteGoal: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance/goals/${id}/`);
  },
};
