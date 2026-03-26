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
  [Priority.P1]: 'text-danger bg-danger-bg border-danger/20',
  [Priority.P2]: 'text-warning bg-warning-bg border-warning/20',
  [Priority.P3]: 'text-accent bg-info-bg border-accent/20',
  [Priority.P4]: 'text-foreground-secondary bg-surface border-border',
};

/** CSS-классы цветов точек-индикаторов приоритета. */
export const PRIORITY_DOT_COLORS: Record<Priority, string> = {
  [Priority.P1]: 'bg-danger',
  [Priority.P2]: 'bg-warning',
  [Priority.P3]: 'bg-accent',
  [Priority.P4]: 'bg-foreground-tertiary',
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
  [TaskStatus.INBOX]: 'text-foreground-secondary bg-surface',
  [TaskStatus.IN_PROGRESS]: 'text-warning bg-warning-bg',
  [TaskStatus.REVIEW]: 'text-brand bg-[var(--accent-brand)]/10',
  [TaskStatus.DONE]: 'text-success bg-success-bg',
  [TaskStatus.ARCHIVED]: 'text-foreground-tertiary bg-surface',
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
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'UZS', symbol: "so'm", name: 'Uzbekistani Som' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
  { code: 'KGS', symbol: 'сом', name: 'Kyrgyzstani Som' },
  { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso' },
  { code: 'COP', symbol: 'CO$', name: 'Colombian Peso' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
];

/** Список часовых поясов сгруппированных по регионам. */
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6)' },
  { value: 'America/Denver', label: 'Denver (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'America/Anchorage', label: 'Anchorage (GMT-9)' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (GMT-10)' },
  { value: 'America/Toronto', label: 'Toronto (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Mexico City (GMT-6)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogota (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/Rome', label: 'Rome (GMT+1)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (GMT+1)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (GMT+1)' },
  { value: 'Europe/Prague', label: 'Prague (GMT+1)' },
  { value: 'Europe/Bucharest', label: 'Bucharest (GMT+2)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (GMT+2)' },
  { value: 'Europe/Athens', label: 'Athens (GMT+2)' },
  { value: 'Europe/Kiev', label: 'Kyiv (GMT+2)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (GMT+3)' },
  { value: 'Europe/Moscow', label: 'Moscow (GMT+3)' },
  { value: 'Europe/Minsk', label: 'Minsk (GMT+3)' },
  { value: 'Asia/Tashkent', label: 'Tashkent (GMT+5)' },
  { value: 'Asia/Almaty', label: 'Almaty (GMT+6)' },
  { value: 'Asia/Bishkek', label: 'Bishkek (GMT+6)' },
  { value: 'Asia/Dushanbe', label: 'Dushanbe (GMT+5)' },
  { value: 'Asia/Ashgabat', label: 'Ashgabat (GMT+5)' },
  { value: 'Asia/Tbilisi', label: 'Tbilisi (GMT+4)' },
  { value: 'Asia/Baku', label: 'Baku (GMT+4)' },
  { value: 'Asia/Yerevan', label: 'Yerevan (GMT+4)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
  { value: 'Asia/Qatar', label: 'Doha (GMT+3)' },
  { value: 'Asia/Tehran', label: 'Tehran (GMT+3:30)' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (GMT+2)' },
  { value: 'Asia/Kolkata', label: 'Mumbai / Delhi (GMT+5:30)' },
  { value: 'Asia/Karachi', label: 'Karachi (GMT+5)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (GMT+6)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'Asia/Taipei', label: 'Taipei (GMT+8)' },
  { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Seoul (GMT+9)' },
  { value: 'Asia/Yekaterinburg', label: 'Yekaterinburg (GMT+5)' },
  { value: 'Asia/Novosibirsk', label: 'Novosibirsk (GMT+7)' },
  { value: 'Asia/Vladivostok', label: 'Vladivostok (GMT+10)' },
  { value: 'Australia/Sydney', label: 'Sydney (GMT+11)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (GMT+11)' },
  { value: 'Australia/Perth', label: 'Perth (GMT+8)' },
  { value: 'Pacific/Auckland', label: 'Auckland (GMT+13)' },
  { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
  { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT+2)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (GMT+1)' },
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
