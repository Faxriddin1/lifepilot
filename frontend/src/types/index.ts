// ============================================================
// Enums
// ============================================================

export enum Priority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum TaskStatus {
  INBOX = 'inbox',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum SessionType {
  POMODORO = 'pomodoro',
  DEEP_WORK = 'deep_work',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
  CUSTOM = 'custom',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
}

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// ============================================================
// Models
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  timezone: string;
  base_currency: string;
  locale: string;
  date_format?: string;
  week_start?: string;
  number_format?: string;
  last_seen_at?: string;
  date_joined: string;
  first_name?: string;
  last_name?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  is_archived: boolean;
  task_count: number;
  completed_task_count: number;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  project?: string | null;
  project_name?: string | null;
  parent_task?: string | null;
  deadline?: string | null;
  time_estimate?: number | null;
  time_logged?: number;
  tags: string[];
  subtasks: Subtask[];
  position: number;
  recurrence_rule?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

export interface FocusSession {
  id: string;
  task?: string | null;
  task_title?: string | null;
  session_type: SessionType;
  duration: number;
  duration_minutes: number;
  start_time: string;
  end_time?: string | null;
  status: string;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  frequency: string;
  target_count: number;
  target_days: number;
  current_streak: number;
  completed_days: number;
  progress: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit: string;
  date: string;
  count: number;
  notes?: string;
}

export type DailyLogMood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface DailyLog {
  id?: string;
  date: string;
  done: string;
  planned: string;
  notes: string;
  mood: DailyLogMood | '';
  energy_level: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDailyLogData {
  date: string;
  done?: string;
  planned?: string;
  notes?: string;
  mood?: DailyLogMood | '';
  energy_level?: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  category_type: CategoryType;
  color: string;
  icon?: string;
  parent?: string | null;
  budget_amount?: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon?: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  transaction_type: TransactionType;
  amount: number;
  description: string;
  note: string;
  category?: string | null;
  category_name?: string | null;
  account: string;
  account_name?: string;
  date: string;
  is_recurring: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  name?: string;
  category?: string | null;
  category_name?: string | null;
  amount: number;
  spent: number;
  spent_amount?: string;
  remaining?: string;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  color: string;
  icon?: string;
  is_completed: boolean;
  created_at: string;
}

// ============================================================
// API response types
// ============================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  status: number;
}

// ============================================================
// Dashboard / Analytics types
// ============================================================

export interface DashboardData {
  tasks_today: number;
  tasks_completed_today: number;
  focus_minutes_today: number;
  total_balance: number;
  income_this_month: number;
  expenses_this_month: number;
  recent_tasks: Task[];
  recent_transactions: Transaction[];
  cashflow_7d: { date: string; income: number; expense: number }[];
  habit_completions: { habit_id: string; habit_name: string; days: { date: string; completed: boolean }[] }[];
  top_budgets: Budget[];
  productivity_heatmap: { date: string; minutes: number }[];
}

export interface ProductivityStats {
  daily_focus: { date: string; minutes: number }[];
  task_completion_rate: number;
  total_tasks: number;
  completed_tasks: number;
  total_focus_minutes: number;
  peak_hours: { hour: number; minutes: number }[];
  heatmap: { date: string; minutes: number }[];
  avg_focus_per_day: number;
  streak_days: number;
  total_habits: number;
  habit_stats: {
    id: string;
    name: string;
    color: string;
    icon: string;
    completed_days: number;
    target_days: number;
    progress: number;
    week_completed: number;
    current_streak: number;
  }[];
  habit_heatmap: { date: string; count: number }[];
  habit_completion_rate: number;
  habit_week_completed: number;
  habit_week_possible: number;
}

export interface FinanceStats {
  cashflow: { date: string; income: number; expense: number }[];
  expense_by_category: { category: string; amount: number; color: string }[];
  income_by_category: { category: string; amount: number; color: string }[];
  monthly_totals: { month: string; income: number; expense: number; savings: number }[];
  net_worth_trend: { date: string; amount: number }[];
}

// ============================================================
// Request/filter types
// ============================================================

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  project?: string;
  search?: string;
  deadline_from?: string;
  deadline_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface TransactionFilters {
  type?: TransactionType;
  category_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface FocusFilters {
  date_from?: string;
  date_to?: string;
  session_type?: SessionType;
  page?: number;
}

export interface AnalyticsParams {
  period?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  project?: string | null;
  parent_task?: string | null;
  deadline?: string | null;
  time_estimate?: number | null;
  tags?: string[];
}

export interface CreateTransactionData {
  transaction_type: TransactionType;
  amount: number;
  note?: string;
  category?: string | null;
  account: string;
  date: string;
  is_recurring?: boolean;
  [key: string]: any;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateHabitData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  frequency?: string;
  target_days?: number;
}

export interface CreateBudgetData {
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string | null;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  target_amount: number;
  deadline?: string | null;
  color?: string;
}

export interface CreateAccountData {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  color?: string;
}

export interface StartFocusData {
  task?: string | null;
  session_type: SessionType;
  duration: number;
}

export interface BulkUpdateTasksData {
  ids: string[];
  status?: TaskStatus;
  priority?: Priority;
  project?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  // Backward compat aliases (optional)
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ProfileUpdateData {
  name?: string;
  avatar_url?: string;
  timezone?: string;
  base_currency?: string;
  locale?: string;
  date_format?: string;
  week_start?: string;
  number_format?: string;
  first_name?: string;
  last_name?: string;
}
