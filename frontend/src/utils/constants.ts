import { Priority, TaskStatus } from '@/types';
import i18n from '@/i18n';

const t = (key: string) => i18n.t(key);

/**
 * Возвращает локализованную метку приоритета задачи.
 * @param priority - Приоритет (P1-P4)
 * @returns Локализованная строка (например, "Срочный", "Высокий")
 */
export const getPriorityLabel = (priority: Priority): string => {
  const map: Record<Priority, string> = {
    [Priority.P1]: t('priorities.urgent'),
    [Priority.P2]: t('priorities.high'),
    [Priority.P3]: t('priorities.medium'),
    [Priority.P4]: t('priorities.low'),
  };
  return map[priority] || priority;
};

/**
 * Возвращает локализованную метку статуса задачи.
 * @param status - Статус задачи
 * @returns Локализованная строка (например, "В работе", "Готово")
 */
export const getStatusLabel = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    [TaskStatus.INBOX]: t('statuses.inbox'),
    [TaskStatus.IN_PROGRESS]: t('statuses.inProgress'),
    [TaskStatus.REVIEW]: t('statuses.review'),
    [TaskStatus.DONE]: t('statuses.done'),
    [TaskStatus.ARCHIVED]: t('statuses.archived'),
  };
  return map[status] || status;
};

/** Статические метки приоритетов (для обратной совместимости, используются как ключи в селектах). */
export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.P1]: 'Urgent',
  [Priority.P2]: 'High',
  [Priority.P3]: 'Medium',
  [Priority.P4]: 'Low',
};

/** CSS-классы цветов для приоритетов задач (TailwindCSS). */
export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.P1]: 'text-danger-600 bg-danger-50 border-danger-200',
  [Priority.P2]: 'text-warning-600 bg-warning-50 border-warning-200',
  [Priority.P3]: 'text-primary-600 bg-primary-50 border-primary-200',
  [Priority.P4]: 'text-gray-500 bg-gray-50 border-gray-200',
};

/** CSS-классы цветов точек-индикаторов приоритета. */
export const PRIORITY_DOT_COLORS: Record<Priority, string> = {
  [Priority.P1]: 'bg-danger-500',
  [Priority.P2]: 'bg-warning-500',
  [Priority.P3]: 'bg-primary-500',
  [Priority.P4]: 'bg-gray-400',
};

/** Статические метки статусов задач (английские). */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.INBOX]: 'Inbox',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.REVIEW]: 'Review',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
};

/** CSS-классы цветов для статусов задач (TailwindCSS). */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.INBOX]: 'text-gray-600 bg-gray-100',
  [TaskStatus.IN_PROGRESS]: 'text-warning-600 bg-warning-50',
  [TaskStatus.REVIEW]: 'text-accent-600 bg-accent-50',
  [TaskStatus.DONE]: 'text-success-600 bg-success-50',
  [TaskStatus.ARCHIVED]: 'text-gray-400 bg-gray-50',
};

/** Маппинг категорий транзакций к именам иконок Lucide. */
export const CATEGORY_ICONS: Record<string, string> = {
  food: 'UtensilsCrossed',
  transport: 'Car',
  housing: 'Home',
  entertainment: 'Film',
  shopping: 'ShoppingBag',
  health: 'Heart',
  education: 'GraduationCap',
  salary: 'Briefcase',
  freelance: 'Laptop',
  investments: 'TrendingUp',
  utilities: 'Zap',
  subscriptions: 'Repeat',
  other: 'MoreHorizontal',
};

/** Валюта по умолчанию. */
export const DEFAULT_CURRENCY = 'USD';

/** Список поддерживаемых валют с кодами, символами и названиями. */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { code: 'RUB', symbol: '\u20BD', name: 'Russian Ruble' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '\u20A9', name: 'South Korean Won' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee' },
];

/**
 * Возвращает локализованные колонки для Kanban-доски.
 * @returns Массив колонок с id (TaskStatus) и локализованным label
 */
export const getKanbanColumns = () => [
  { id: TaskStatus.INBOX, label: t('statuses.inbox') },
  { id: TaskStatus.IN_PROGRESS, label: t('statuses.inProgress') },
  { id: TaskStatus.REVIEW, label: t('statuses.review') },
  { id: TaskStatus.DONE, label: t('statuses.done') },
];

/** Статические колонки Kanban-доски (английские метки). */
export const KANBAN_COLUMNS = [
  { id: TaskStatus.INBOX, label: 'Inbox' },
  { id: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { id: TaskStatus.REVIEW, label: 'Review' },
  { id: TaskStatus.DONE, label: 'Done' },
] as const;

/**
 * Возвращает локализованные пресеты фокус-сессий (Pomodoro, Deep Work и т.д.).
 * @returns Массив пресетов с label, minutes и type
 */
export const getSessionPresets = () => [
  { label: t('sessionPresets.pomodoro'), minutes: 25, type: 'pomodoro' as const },
  { label: t('sessionPresets.deepWork'), minutes: 45, type: 'deep_work' as const },
  { label: t('sessionPresets.shortBreak'), minutes: 5, type: 'short_break' as const },
  { label: t('sessionPresets.longBreak'), minutes: 15, type: 'long_break' as const },
];

/** Статические пресеты фокус-сессий (английские метки). */
export const SESSION_PRESETS = [
  { label: 'Pomodoro', minutes: 25, type: 'pomodoro' as const },
  { label: 'Deep Work', minutes: 45, type: 'deep_work' as const },
  { label: 'Short Break', minutes: 5, type: 'short_break' as const },
  { label: 'Long Break', minutes: 15, type: 'long_break' as const },
];
