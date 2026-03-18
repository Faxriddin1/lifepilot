import type { ReactNode } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  iconBg = 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  className,
}: StatCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={clsx('flex items-start gap-4', className)}>
      <div className={clsx('w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trendPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-success-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-danger-500" />
            )}
            <span
              className={clsx(
                'text-xs font-medium',
                trendPositive ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {trendPositive ? '+' : ''}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
