import { useMemo } from 'react';
import clsx from 'clsx';

interface WaterfallItem {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'total';
  color?: string;
}

interface WaterfallChartProps {
  items: WaterfallItem[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
}

/** Waterfall chart — показывает как доход "уходит" по категориям расходов к итогу. */
export function WaterfallChart({ items, height = 220, className, formatValue = (v) => `$${v.toFixed(0)}` }: WaterfallChartProps) {
  const { bars, maxVal } = useMemo(() => {
    let running = 0;
    const computed: Array<{ label: string; base: number; value: number; type: string; color: string }> = [];

    for (const item of items) {
      if (item.type === 'income') {
        computed.push({ label: item.label, base: running, value: item.amount, type: 'income', color: item.color || 'var(--color-income)' });
        running += item.amount;
      } else if (item.type === 'expense') {
        running -= item.amount;
        computed.push({ label: item.label, base: running, value: item.amount, type: 'expense', color: item.color || 'var(--color-expense)' });
      } else {
        computed.push({ label: item.label, base: 0, value: running, type: 'total', color: item.color || 'var(--color-success)' });
      }
    }

    const allTops = computed.map((b) => b.base + b.value);
    const mx = Math.max(...allTops, 1);
    return { bars: computed, maxVal: mx };
  }, [items]);

  if (bars.length === 0) return null;

  const barWidth = Math.min(60, Math.floor((100 - bars.length * 2) / bars.length));

  return (
    <div className={clsx('w-full', className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-1 px-2">
        {bars.map((bar, i) => {
          const barH = (bar.value / maxVal) * (height - 40);
          const baseH = (bar.base / maxVal) * (height - 40);

          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0" style={{ maxWidth: `${barWidth}%` }}>
              {/* Value label */}
              <span className="text-[10px] font-semibold text-foreground-secondary mb-1 truncate w-full text-center">
                {bar.type === 'expense' ? '-' : ''}{formatValue(bar.value)}
              </span>

              {/* Bar container */}
              <div className="w-full relative" style={{ height: height - 40 }}>
                {/* Invisible base (transparent spacer) */}
                <div
                  className="absolute bottom-0 w-full"
                  style={{ height: baseH + barH }}
                >
                  {/* Transparent base */}
                  <div style={{ height: baseH }} />

                  {/* Colored bar */}
                  <div
                    className="w-full rounded-t-md transition-all duration-[500ms] relative group"
                    style={{
                      height: Math.max(barH, 2),
                      backgroundColor: bar.color,
                      opacity: bar.type === 'expense' ? 0.85 : 1,
                    }}
                  >
                    {/* Connector line to next bar */}
                    {i < bars.length - 1 && bar.type !== 'total' && (
                      <div
                        className="absolute right-0 border-t-2 border-dashed border-border"
                        style={{
                          top: bar.type === 'income' ? 0 : barH,
                          width: '120%',
                          transform: 'translateX(50%)',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Label */}
              <span className="text-[9px] text-foreground-tertiary mt-1.5 truncate w-full text-center leading-tight">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
