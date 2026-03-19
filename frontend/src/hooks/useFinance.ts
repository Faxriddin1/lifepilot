import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import type {
  TransactionFilters,
  CreateTransactionData,
  CreateAccountData,
  CreateBudgetData,
  CreateGoalData,
} from '@/types';
import { showApiError, showSuccess } from '@/utils/errorHandler';

/**
 * Хук для получения списка транзакций с фильтрацией.
 * @param filters - Фильтры для запроса (тип, категория, период и т.д.)
 * @returns Результат запроса TanStack Query с пагинированным списком транзакций
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => financeApi.getTransactions(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Хук для создания новой транзакции.
 * Инвалидирует кеш транзакций, счетов, дашборда и финансовой статистики.
 * @returns Мутация TanStack Query для создания транзакции
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionData) => financeApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      showSuccess('errors.transactionCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для обновления существующей транзакции.
 * Инвалидирует кеш транзакций, счетов и дашборда.
 * @returns Мутация TanStack Query для обновления транзакции
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      financeApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.transactionUpdated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для удаления транзакции.
 * Инвалидирует кеш транзакций, счетов и дашборда.
 * @returns Мутация TanStack Query для удаления транзакции
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.transactionDeleted');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для получения списка финансовых счетов пользователя.
 * @returns Результат запроса TanStack Query со списком счетов
 */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: financeApi.getAccounts,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для создания нового финансового счёта.
 * @returns Мутация TanStack Query для создания счёта
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountData) => financeApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('errors.accountCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для получения списка категорий транзакций.
 * @returns Результат запроса TanStack Query со списком категорий
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: financeApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Хук для получения списка бюджетов пользователя.
 * @returns Результат запроса TanStack Query со списком бюджетов
 */
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: financeApi.getBudgets,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для создания нового бюджета.
 * @returns Мутация TanStack Query для создания бюджета
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudgetData) => financeApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('errors.budgetCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для удаления бюджета. */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => showApiError(error),
  });
}

/**
 * Хук для получения списка финансовых целей.
 * @returns Результат запроса TanStack Query со списком целей
 */
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: financeApi.getGoals,
    staleTime: 60 * 1000,
  });
}

/**
 * Хук для создания новой финансовой цели.
 * @returns Мутация TanStack Query для создания цели
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => financeApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('errors.goalCreated');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/**
 * Хук для пополнения финансовой цели.
 * @returns Мутация TanStack Query для пополнения цели
 */
export function useContributeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      financeApi.contributeGoal(goalId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('errors.goalContributed');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}

/** Хук для удаления финансовой цели. */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => showApiError(error),
  });
}
