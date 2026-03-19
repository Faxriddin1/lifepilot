import clsx from 'clsx';

interface BulletGraphProps {
  /** Current spent amount */
  value: number;
  /** Budget limit */
  max: number;
  /** Pacing line value (where you should be based on day of month) */
  pacing?: number;
  /** Category name */
  label?: string;
  /** Formatted value text */
  valueText?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Bullet Graph (Stephen Few) — shows spent vs budget with qualitative ranges.
 * Green (0-60%): safe zone
 * Yellow (60-85%): caution zone
 * Red (85-100%+): danger zone
 * Pacing line: where spending should be based on current day of month
 */
export function BulletGraph({
  value,
  max,
  pacing,
  label,
  valueText,
  size = 'md',
  className,
}: BulletGraphProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 120) : 0;
  const pacingPct = pacing !== undefined && max > 0 ? Math.min((pacing / max) * 100, 100) : undefined;
  const isOver = value > max;
  const isOverPacing = pacing !== undefined && value > pacing;
  const h = size === 'sm' ? 'h-5' : 'h-7';

  return (
    <div className={clsx('w-full', className)}>
      {/* Label + value row */}
      {(label || valueText) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2">
            {valueText && (
              <span className={clsx(
                'text-xs font-semibold',
                isOver ? 'text-red-500' : isOverPacing ? 'text-amber-500' : 'text-gray-500',
              )}>
                {valueText}
              </span>
            )}
            {isOver && (
              <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                !
              </span>
            )}
            {!isOver && isOverPacing && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                ⚡
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bullet bar */}
      <div className={clsx('relative w-full rounded-md overflow-visible', h)}>
        {/* Qualitative ranges (background) */}
        <div className="absolute inset-0 flex rounded-md overflow-hidden">
          <div className="bg-green-100 dark:bg-green-900/20" style={{ width: '60%' }} />
          <div className="bg-amber-100 dark:bg-amber-900/20" style={{ width: '25%' }} />
          <div className="bg-red-100 dark:bg-red-900/20" style={{ width: '15%' }} />
        </div>

        {/* Value bar */}
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 rounded-sm transition-all duration-500',
            size === 'sm' ? 'h-2.5' : 'h-3.5',
            isOver ? 'bg-red-500' : pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-gray-700 dark:bg-gray-300',
          )}
          style={{ width: `${Math.min(pct, 100)}%`, left: 0 }}
        />

        {/* Pacing line */}
        {pacingPct !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white z-10"
            style={{ left: `${pacingPct}%` }}
            title={`Pacing: ${Math.round(pacingPct)}%`}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent border-t-gray-900 dark:border-t-white" />
          </div>
        )}
      </div>
    </div>
  );
}
