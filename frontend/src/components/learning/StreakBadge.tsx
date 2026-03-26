import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

/**
 * Inline streak badge showing 🔥 N with color based on streak length.
 */
export function StreakBadge({ streak, className }: StreakBadgeProps) {
  const { t } = useTranslation();

  if (streak <= 0) return null;

  return (
    <span
      aria-label={t('learning.streak.label', { count: streak })}
      className={clsx(
        'inline-flex items-center gap-0.5 text-sm',
        streak >= 30
          ? 'text-warning font-bold'
          : streak >= 7
          ? 'text-expense'
          : 'text-foreground-secondary',
        className
      )}
    >
      🔥 {streak}
    </span>
  );
}
