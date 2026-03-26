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
function Sparkline({ data, color = 'var(--accent-primary)', width = 80, height = 28 }: {
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

const ALERT_BORDER: Record<string, string> = {
  success: 'border-l-[3px] border-l-success',
  warning: 'border-l-[3px] border-l-warning',
  danger: 'border-l-[3px] border-l-danger',
};

const ALERT_DOT: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
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
  iconBg = 'bg-info-bg text-accent',
  className,
}: StatCardProps) {
  const dir = trendDirection ?? (trend !== undefined ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat') : undefined);
  const trendPositive = dir === 'up';

  return (
    <Card className={clsx('flex items-start gap-3 relative overflow-hidden', alert && ALERT_BORDER[alert], className)}>
      {/* Alert dot */}
      {alert && (
        <div className={clsx('absolute top-2 right-2 w-2 h-2 rounded-full', ALERT_DOT[alert])} />
      )}

      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground-secondary truncate">{label}</p>

        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xl font-bold text-foreground">{value}</p>
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              color={alert === 'danger' ? 'var(--color-danger)' : alert === 'warning' ? 'var(--color-warning)' : 'var(--accent-primary)'}
            />
          )}
        </div>

        {/* Trend + Target row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {trend !== undefined && (
            <div className="flex items-center gap-0.5">
              {dir === 'up' && <TrendingUp className="w-3 h-3 text-income" />}
              {dir === 'down' && <TrendingDown className="w-3 h-3 text-expense" />}
              {dir === 'flat' && <Minus className="w-3 h-3 text-foreground-tertiary" />}
              <span className={clsx(
                'text-[11px] font-medium',
                trendPositive ? 'text-income' : dir === 'down' ? 'text-expense' : 'text-foreground-tertiary',
              )}>
                {trendPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-[10px] text-foreground-tertiary">{trendLabel}</span>}
            </div>
          )}

          {target && (
            <span className="text-[10px] text-foreground-tertiary flex items-center gap-0.5">
              🎯 {target.label}: {target.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[10px] text-foreground-tertiary mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
