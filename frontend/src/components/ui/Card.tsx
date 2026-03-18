import type { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
  hover?: boolean;
}

/** Карточка-контейнер с тенью, рамкой и опциональным эффектом наведения. */
export function Card({ children, padding = true, hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card shadow-card',
        padding && 'p-5',
        hover && 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer',
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
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
