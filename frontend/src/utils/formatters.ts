import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Форматирование суммы в валютном формате.
 * @param amount - Сумма
 * @param currency - Код валюты (по умолчанию USD)
 * @returns Отформатированная строка (например, "$1,234.56")
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Форматирование даты по шаблону date-fns.
 * @param date - Дата (строка ISO или объект Date)
 * @param fmt - Шаблон формата (по умолчанию 'MMM d, yyyy')
 * @returns Отформатированная строка даты
 */
export function formatDate(date: string | Date, fmt: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

/**
 * Форматирование длительности из минут в строку "Xh Ym".
 * @param minutes - Длительность в минутах
 * @returns Отформатированная строка (например, "1h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Форматирование даты в относительное время ("Today", "Yesterday", "3 days ago").
 * @param date - Дата (строка ISO или объект Date)
 * @returns Относительная строка времени
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';

  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Форматирование секунд в строку "MM:SS".
 * @param totalSeconds - Количество секунд
 * @returns Отформатированная строка (например, "05:30")
 */
export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Форматирование числа в компактный вид (1K, 1.5M).
 * @param num - Число для форматирования
 * @returns Компактная строка (например, "1.5K", "2.3M")
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
