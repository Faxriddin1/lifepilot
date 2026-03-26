import clsx from 'clsx';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const barColors: Record<ProgressVariant, string> = {
  primary: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-brand',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-foreground-secondary mb-1">
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-elevated rounded-full overflow-hidden',
          sizeMap[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-[500ms] ease-out',
            barColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
