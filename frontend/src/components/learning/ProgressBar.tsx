import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Learning-specific progress bar with semantic tokens and smooth transition.
 * Different from ui/ProgressBar — uses bg-elevated track and bg-accent fill.
 */
export function ProgressBar({ value, max, size = 'sm', className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className={clsx(
        'w-full rounded-full bg-elevated overflow-hidden',
        size === 'sm' ? 'h-2' : 'h-3',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
