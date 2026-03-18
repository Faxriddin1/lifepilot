import {
  CheckSquare,
  Timer,
  Wallet,
  Circle,
  Check,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboardData } from '@/hooks/useDashboard';
import { formatCurrency, formatDuration, formatDate } from '@/utils/formatters';
import { PRIORITY_DOT_COLORS } from '@/utils/constants';
import type { Priority } from '@/types';
import clsx from 'clsx';

/** Главная панель с обзором задач, фокус-времени, финансов, привычек и продуктивности. */
export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  const d = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label={t('dashboard.todaysTasks')}
          value={`${d?.tasks_completed_today ?? 0} / ${d?.tasks_today ?? 0}`}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        />
        <StatCard
          icon={<Timer className="w-5 h-5" />}
          label={t('dashboard.focusTimeToday')}
          value={formatDuration(d?.focus_minutes_today ?? 0)}
          iconBg="bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label={t('dashboard.netBalance')}
          value={formatCurrency(d?.total_balance ?? 0)}
          iconBg="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400"
        />
      </div>

      {/* Row 2: Tasks mini list + Cashflow chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's tasks */}
        <Card>
          <CardHeader title={t('dashboard.todaysTasks')} subtitle={`${d?.tasks_completed_today ?? 0} ${t('dashboard.of')} ${d?.tasks_today ?? 0} ${t('dashboard.todaysTasksSub')}`} />
          <div className="space-y-1">
            {(d?.recent_tasks ?? []).slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <button
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    task.status === 'done'
                      ? 'border-success-500 bg-success-500'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-primary-400'
                  )}
                >
                  {task.status === 'done' && <Check className="w-3 h-3 text-white" />}
                </button>
                <span
                  className={clsx(
                    'flex-1 text-sm truncate',
                    task.status === 'done'
                      ? 'text-gray-400 line-through'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {task.title}
                </span>
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    PRIORITY_DOT_COLORS[task.priority as Priority] || 'bg-gray-300'
                  )}
                />
              </div>
            ))}
            {(!d?.recent_tasks || d.recent_tasks.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">{t('dashboard.noTasksToday')}</p>
            )}
          </div>
        </Card>

        {/* Cashflow chart */}
        <Card>
          <CardHeader title={t('dashboard.cashflow7d')} />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d?.cashflow_7d ?? []}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: string) => {
                    try { return formatDate(val, 'EEE'); } catch { return val; }
                  }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  fill="url(#incomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  fill="url(#expenseGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Habits + Budget progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Habit grid */}
        <Card>
          <CardHeader title={t('dashboard.habitsThisWeek')} />
          <div className="space-y-3">
            {(d?.habit_completions ?? []).slice(0, 5).map((habit) => (
              <div key={habit.habit_id} className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-warning-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate">
                  {habit.habit_name}
                </span>
                <div className="flex gap-1 flex-1">
                  {habit.days.map((day, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-7 h-7 rounded flex items-center justify-center text-xs',
                        day.completed
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                      )}
                    >
                      {day.completed ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!d?.habit_completions || d.habit_completions.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">{t('dashboard.noHabitsTracked')}</p>
            )}
          </div>
        </Card>

        {/* Budget progress */}
        <Card>
          <CardHeader title={t('dashboard.topBudgets')} />
          <div className="space-y-4">
            {(d?.top_budgets ?? []).slice(0, 4).map((budget) => {
              const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              const variant = pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'primary';
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {budget.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                      {pct > 100 && <Badge variant="danger" size="sm">{t('dashboard.over')}</Badge>}
                    </div>
                  </div>
                  <ProgressBar value={budget.spent} max={budget.amount} variant={variant} size="sm" />
                </div>
              );
            })}
            {(!d?.top_budgets || d.top_budgets.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">{t('dashboard.noBudgetsSet')}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 4: Productivity Heatmap mini */}
      <Card>
        <CardHeader title={t('dashboard.productivityHeatmap')} subtitle={t('dashboard.heatmapSubtitle')} />
        <div className="flex flex-wrap gap-1">
          {(d?.productivity_heatmap ?? []).map((day, i) => {
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
                className={clsx('w-3 h-3 rounded-sm', intensity)}
                title={`${day.date}: ${day.minutes}min`}
              />
            );
          })}
          {(!d?.productivity_heatmap || d.productivity_heatmap.length === 0) && (
            <p className="text-sm text-gray-400 py-4 w-full text-center">{t('dashboard.noDataYet')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>{t('dashboard.less')}</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-primary-100" />
          <div className="w-3 h-3 rounded-sm bg-primary-300" />
          <div className="w-3 h-3 rounded-sm bg-primary-500" />
          <div className="w-3 h-3 rounded-sm bg-primary-700" />
          <span>{t('dashboard.more')}</span>
        </div>
      </Card>
    </div>
  );
}
