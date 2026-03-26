import type { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
  hover?: boolean;
}

/** Карточка-контейнер с рамкой и опциональным эффектом наведения. */
export function Card({ children, padding = true, hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-lg shadow-sm',
        padding && 'p-5',
        hover && 'hover:shadow-md transition-shadow duration-normal cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/** Заголовок карточки с названием, подзаголовком и слотом для действия. */
export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-foreground-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
