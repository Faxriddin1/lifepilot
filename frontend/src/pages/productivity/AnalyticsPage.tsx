import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Timer, CheckSquare, TrendingUp, Clock, Flame } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { useProductivityStats } from '@/hooks/useDashboard';
import { formatDuration, formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';
import { getFocusAlert, getCompletionAlert } from '@/utils/alerts';

/** Страница аналитики продуктивности — фокус, задачи, привычки. */
export function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useProductivityStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const completionRate = data?.task_completion_rate ?? 0;
  const habitRate = data?.habit_completion_rate ?? 0;
  const habitWeekDone = data?.habit_week_completed ?? 0;
  const habitWeekTotal = data?.habit_week_possible ?? 0;

  // Sparkline & alert data
  const focusSparkline = (data?.daily_focus ?? []).slice(-7).map((d: any) => d.minutes || 0);
  const focusTarget = 120; // 2h — TODO: user-configurable
  const avgFocus = data?.avg_focus_per_day ?? 0;
  const focusAlertLevel = getFocusAlert(avgFocus, focusTarget);
  const focusAlert = focusAlertLevel !== 'neutral' ? focusAlertLevel : undefined;

  const completionTarget = 90;
  const completionAlertLevel = getCompletionAlert(completionRate, completionTarget);
  const completionAlert = completionAlertLevel !== 'neutral' ? completionAlertLevel : undefined;

  // Filter daily_focus to only show days with data + 3 padding
  const dailyFocus = data?.daily_focus ?? [];
  const daysWithData = dailyFocus.filter((d: any) => d.minutes > 0);
  const focusData = daysWithData.length < 7 && daysWithData.length > 0
    ? dailyFocus.slice(Math.max(0, dailyFocus.findIndex((d: any) => d.minutes > 0) - 3))
    : dailyFocus;

  // Peak hours — top 4
  const peakHours = [...(data?.peak_hours ?? [])]
    .filter((h: any) => h.minutes > 0)
    .sort((a: any, b: any) => b.minutes - a.minutes)
    .slice(0, 4);
  const peakMax = peakHours[0]?.minutes || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Timer className="w-5 h-5" />}
          label={t('analyticsPage.avgDailyFocus')}
          value={formatDuration(avgFocus)}
          sparklineData={focusSparkline.length > 1 ? focusSparkline : undefined}
          target={{ value: formatDuration(focusTarget), label: t('analyticsNew.target') }}
          alert={focusAlert}
          iconBg="bg-info-bg text-accent"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label={t('analyticsPage.tasksCompleted')}
          value={`${data?.completed_tasks ?? 0}`}
          subtitle={`${t('analyticsNew.total')}: ${data?.total_tasks ?? 0}`}
          iconBg="bg-success-bg text-success"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('analyticsPage.completionRate')}
          value={`${completionRate}%`}
          target={{ value: `${completionTarget}%`, label: t('analyticsNew.target') }}
          alert={completionAlert}
          iconBg="bg-info-bg text-accent"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label={t('analyticsPage.focusStreak')}
          value={`${data?.streak_days ?? 0} ${t('analyticsPage.days')}`}
          subtitle={`${t('analyticsNew.record')}: ${data?.streak_days ?? 0} ${t('analyticsPage.days')}`}
          iconBg="bg-warning-bg text-warning"
        />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader title={t('analyticsPage.productivityHeatmap')} subtitle={t('analyticsPage.focusMinutesPerDay')} />
        {(() => {
          const heatmap = data?.heatmap ?? [];
          if (heatmap.length === 0) {
            return (
              <p className="text-sm text-foreground-tertiary text-center py-6">
                {t('analyticsNew.noHeatmapData')}
              </p>
            );
          }

          const firstDate = new Date(heatmap[0].date + 'T00:00:00');
          const startDow = (firstDate.getDay() + 6) % 7;

          const cells: (typeof heatmap[0] | null)[] = [];
          for (let i = 0; i < startDow; i++) cells.push(null);
          cells.push(...heatmap);
          while (cells.length % 7 !== 0) cells.push(null);

          const weeks = Math.ceil(cells.length / 7);
          const dayLabels = t('analyticsNew.weekDays', { returnObjects: true }) as string[];

          const monthLabels: { col: number; label: string }[] = [];
          let lastMonth = -1;
          for (let w = 0; w < weeks; w++) {
            const cell = cells[w * 7];
            if (cell) {
              const d = new Date(cell.date + 'T00:00:00');
              if (d.getMonth() !== lastMonth) {
                lastMonth = d.getMonth();
                monthLabels.push({
                  col: w,
                  label: d.toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' }),
                });
              }
            }
          }

          const getColor = (minutes: number) => {
            if (minutes === 0) return 'bg-elevated';
            if (minutes < 15) return 'bg-success-bg';
            if (minutes < 45) return 'bg-success/40';
            if (minutes < 90) return 'bg-success/70';
            return 'bg-success';
          };

          return (
            <div className="overflow-x-auto">
              <div className="flex ml-8 mb-1">
                {monthLabels.map((m, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-foreground-tertiary font-medium"
                    style={{ position: 'relative', left: `${m.col * 15}px` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                <div className="flex flex-col gap-[3px] mr-1">
                  {dayLabels.map((label, i) => (
                    <div key={i} className="h-[12px] text-[9px] text-foreground-tertiary leading-[12px] w-6 text-right pr-1">
                      {i % 2 === 0 ? label : ''}
                    </div>
                  ))}
                </div>
                {Array.from({ length: weeks }).map((_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, d) => {
                      const cell = cells[w * 7 + d];
                      if (!cell) return <div key={d} className="w-[12px] h-[12px]" />;
                      return (
                        <div
                          key={d}
                          className={clsx('w-[12px] h-[12px] rounded-[2px] transition-colors', getColor(cell.minutes))}
                          title={`${cell.date}: ${cell.minutes} min`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-foreground-tertiary">
          <span>{t('analyticsPage.less')}</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-elevated" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-success-bg" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-success/40" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-success/70" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-success" />
          <span>{t('analyticsPage.more')}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily focus bar chart — adaptive */}
        <Card>
          <CardHeader title={t('analyticsPage.dailyFocusTime')} subtitle={t('analyticsPage.last30Days')} />
          {focusData.length === 0 ? (
            <p className="text-sm text-foreground-tertiary text-center py-12">
              {t('analyticsNew.noFocusData')}
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => {
                      try { return formatDate(v, 'd'); } catch { return v; }
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}m`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(value: number) => [`${value} min`, t('analyticsNew.focus')]}
                  />
                  <Bar dataKey="minutes" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Peak hours — compact top-4 */}
        <Card>
          <CardHeader title={t('analyticsPage.peakHours')} />
          {peakHours.length === 0 ? (
            <p className="text-sm text-foreground-tertiary text-center py-12">
              {t('analyticsNew.insufficientData')}
            </p>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-xs text-foreground-tertiary mb-4">
                {t('analyticsNew.planComplexTasks')}
              </p>
              {peakHours.map((h: any, i: number) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-foreground-secondary w-12">
                    {String(h.hour).padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 h-6 bg-elevated rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${(h.minutes / peakMax) * 100}%`,
                        backgroundColor: i === 0 ? 'var(--accent-brand)' : i === 1 ? 'var(--accent-primary)' : 'var(--border-hover)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground-secondary w-12 text-right">{h.minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Habits section — compact */}
      {(data?.total_habits ?? 0) > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-bold text-foreground">
                {t('analyticsNew.habits')}
              </h2>
            </div>
            {/* Inline summary instead of 3 separate stat cards */}
            <p className="text-sm text-foreground-secondary">
              {t('analyticsNew.thisWeek')}:
              <span className="font-semibold text-warning ml-1">{habitRate}%</span>
              <span className="text-foreground-tertiary ml-1">({habitWeekDone}/{habitWeekTotal})</span>
            </p>
          </div>

          {/* Per-habit progress — single card */}
          <Card>
            <div className="space-y-4">
              {(data?.habit_stats ?? []).map((habit: any) => (
                <div key={habit.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span className="text-sm font-medium text-foreground">
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                      <span>{habit.completed_days}/{habit.target_days} {t('analyticsNew.daysShort')}</span>
                      <span className="font-semibold" style={{ color: habit.color }}>{habit.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${habit.progress}%`, backgroundColor: habit.color }}
                    />
                  </div>
                  <p className="text-[10px] text-foreground-tertiary mt-1">
                    {t('analyticsNew.thisWeek')}: {habit.week_completed}/7
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
