import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm focus-visible:ring-primary-500',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 shadow-sm focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
  ghost:
    'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-sm focus-visible:ring-danger-500',
};

const sizeStyles: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-md',
  lg: 'text-base px-5 py-2.5 gap-2.5 rounded-md',
};

/** Кнопка с поддержкой вариантов оформления, размеров и состояния загрузки. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
