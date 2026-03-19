import type { ReactNode } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  target?: { value: string; label: string };
  sparklineData?: number[];
  alert?: 'success' | 'warning' | 'danger';
  subtitle?: string;
  iconBg?: string;
  className?: string;
}

/** Мини-спарклайн — SVG линия из массива значений. */
function Sparkline({ data, color = '#3B82F6', width = 80, height = 28 }: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ALERT_RING: Record<string, string> = {
  success: 'ring-2 ring-green-400/30',
  warning: 'ring-2 ring-amber-400/30',
  danger: 'ring-2 ring-red-400/30',
};

const ALERT_DOT: Record<string, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  trendDirection,
  target,
  sparklineData,
  alert,
  subtitle,
  iconBg = 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  className,
}: StatCardProps) {
  const dir = trendDirection ?? (trend !== undefined ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat') : undefined);
  const trendPositive = dir === 'up';

  return (
    <Card className={clsx('flex items-start gap-3 relative overflow-hidden', alert && ALERT_RING[alert], className)}>
      {/* Alert dot */}
      {alert && (
        <div className={clsx('absolute top-2 right-2 w-2 h-2 rounded-full', ALERT_DOT[alert])} />
      )}

      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>

        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              color={alert === 'danger' ? '#EF4444' : alert === 'warning' ? '#EAB308' : '#3B82F6'}
            />
          )}
        </div>

        {/* Trend + Target row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {trend !== undefined && (
            <div className="flex items-center gap-0.5">
              {dir === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {dir === 'down' && <TrendingDown className="w-3 h-3 text-orange-500" />}
              {dir === 'flat' && <Minus className="w-3 h-3 text-gray-400" />}
              <span className={clsx(
                'text-[11px] font-medium',
                trendPositive ? 'text-green-600' : dir === 'down' ? 'text-orange-600' : 'text-gray-400',
              )}>
                {trendPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-[10px] text-gray-400">{trendLabel}</span>}
            </div>
          )}

          {target && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              🎯 {target.label}: {target.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
