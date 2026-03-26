import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-sm hover:bg-accent-hover active:scale-[0.97]',
  secondary:
    'bg-surface text-foreground border border-border shadow-sm hover:bg-elevated active:scale-[0.97]',
  ghost:
    'text-foreground-secondary hover:bg-surface hover:text-foreground active:scale-[0.97]',
  danger:
    'bg-danger text-white shadow-sm hover:opacity-90 active:scale-[0.97]',
  outline:
    'border border-border bg-background text-foreground hover:bg-surface active:scale-[0.97]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 h-8 gap-1.5 rounded-md',
  md: 'text-sm px-4 py-2 h-9 gap-2 rounded-md',
  lg: 'text-sm px-6 py-2.5 h-10 gap-2.5 rounded-md',
  icon: 'h-9 w-9 rounded-md',
};

/** Кнопка с поддержкой вариантов оформления, размеров и состояния загрузки. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-normal',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus',
          'disabled:opacity-50 disabled:pointer-events-none',
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
