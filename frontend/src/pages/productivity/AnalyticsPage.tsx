import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Timer, CheckSquare, TrendingUp, Clock } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { useProductivityStats } from '@/hooks/useDashboard';
import { formatDuration, formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b'];

/** Страница аналитики продуктивности с тепловой картой, графиками фокуса и статистикой задач. */
export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useProductivityStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const completionRate = data?.task_completion_rate ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Timer className="w-5 h-5" />}
          label={t('analyticsPage.avgDailyFocus')}
          value={formatDuration(data?.avg_focus_per_day ?? 0)}
          trend={5}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label={t('analyticsPage.tasksCompleted')}
          value={`${data?.completed_tasks ?? 0}`}
          trend={12}
          iconBg="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('analyticsPage.completionRate')}
          value={`${completionRate}%`}
          iconBg="bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label={t('analyticsPage.focusStreak')}
          value={`${data?.streak_days ?? 0} ${t('analyticsPage.days')}`}
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400"
        />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader title={t('analyticsPage.productivityHeatmap')} subtitle={t('analyticsPage.focusMinutesPerDay')} />
        <div className="flex flex-wrap gap-1">
          {(data?.heatmap ?? []).map((day, i) => {
            const intensity =
              day.minutes === 0
                ? 'bg-gray-100 dark:bg-gray-800'
                : day.minutes < 30
                  ? 'bg-primary-100 dark:bg-primary-900/30'
                  : day.minutes < 60
                    ? 'bg-primary-300 dark:bg-primary-700/50'
                    : day.minutes < 120
                      ? 'bg-primary-500 dark:bg-primary-600/70'
                      : 'bg-primary-700 dark:bg-primary-500';
            return (
              <div
                key={i}
                className={clsx('w-3.5 h-3.5 rounded-sm', intensity)}
                title={`${day.date}: ${day.minutes}min`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>{t('analyticsPage.less')}</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-primary-100" />
          <div className="w-3 h-3 rounded-sm bg-primary-300" />
          <div className="w-3 h-3 rounded-sm bg-primary-500" />
          <div className="w-3 h-3 rounded-sm bg-primary-700" />
          <span>{t('analyticsPage.more')}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily focus bar chart */}
        <Card>
          <CardHeader title={t('analyticsPage.dailyFocusTime')} subtitle={t('analyticsPage.last30Days')} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily_focus ?? []}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    try { return formatDate(v, 'd'); } catch { return v; }
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}m`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} min`, 'Focus']}
                />
                <Bar dataKey="minutes" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Completion rate donut + Peak hours */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('analyticsPage.taskCompletionRate')} />
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <PieChart width={144} height={144}>
                  <Pie
                    data={[
                      { name: 'Completed', value: data?.completed_tasks ?? 0 },
                      {
                        name: 'Remaining',
                        value: (data?.total_tasks ?? 0) - (data?.completed_tasks ?? 0),
                      },
                    ]}
                    cx={67}
                    cy={67}
                    innerRadius={48}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {completionRate}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {`${data?.completed_tasks ?? 0} ${t('analyticsPage.ofTasksCompleted')} ${data?.total_tasks ?? 0} ${t('analyticsPage.tasksCompletedLabel')}`}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('analyticsPage.peakHours')} />
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.peak_hours ?? []}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}:00`}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value} min`, 'Focus']}
                  />
                  <Bar dataKey="minutes" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
