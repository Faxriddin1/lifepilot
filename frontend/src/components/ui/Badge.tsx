import type { ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  accent: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  accent: 'bg-accent-500',
};

/** Бейдж-метка с цветовыми вариантами, размерами и опциональной точкой-индикатором. */
export function Badge({ children, variant = 'default', size = 'sm', dot = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
