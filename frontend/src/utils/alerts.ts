/**
 * Alert by Exception — утилита для определения цветовых алертов.
 * Красный/жёлтый/зелёный — ТОЛЬКО для алертов (exception highlighting).
 * Синий/оранжевый — для обычных данных (income/expense).
 */

export type AlertLevel = 'success' | 'warning' | 'danger' | 'neutral';

/** Определяет уровень алерта для бюджета. */
export function getBudgetAlert(spent: number, limit: number, pacing?: number): AlertLevel {
  if (limit <= 0) return 'neutral';
  const pct = (spent / limit) * 100;
  if (pct > 100) return 'danger';
  if (pct > 85) return 'warning';
  if (pacing !== undefined && spent > pacing) return 'warning';
  return 'neutral';
}

/** Определяет уровень алерта для фокус-времени относительно цели. */
export function getFocusAlert(minutes: number, targetMinutes: number): AlertLevel {
  if (targetMinutes <= 0) return 'neutral';
  if (minutes === 0) return 'danger';
  const pct = (minutes / targetMinutes) * 100;
  if (pct >= 100) return 'success';
  if (pct < 50) return 'warning';
  return 'neutral';
}

/** Определяет уровень алерта для задач на сегодня. */
export function getTasksAlert(completed: number, total: number): AlertLevel {
  if (total === 0) return 'neutral';
  if (completed >= total) return 'success';
  if (completed === 0) return 'warning';
  return 'neutral';
}

/** Определяет уровень алерта для привычки (streak). */
export function getHabitStreakAlert(currentStreak: number, wasActiveYesterday: boolean): AlertLevel {
  if (currentStreak >= 7) return 'success';
  if (!wasActiveYesterday && currentStreak > 0) return 'warning'; // streak broken
  return 'neutral';
}

/** Определяет уровень алерта для цели. */
export function getGoalAlert(current: number, target: number): AlertLevel {
  if (target <= 0) return 'neutral';
  const pct = (current / target) * 100;
  if (pct >= 100) return 'success';
  return 'neutral';
}

/** Определяет уровень алерта для процента выполнения задач. */
export function getCompletionAlert(rate: number, target: number = 90): AlertLevel {
  if (rate >= target) return 'success';
  if (rate < 50) return 'warning';
  return 'neutral';
}
