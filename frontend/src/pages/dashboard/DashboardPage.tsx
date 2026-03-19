import {
  CheckSquare,
  Timer,
  Wallet,
  Circle,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BulletGraph } from '@/components/ui/BulletGraph';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboardData } from '@/hooks/useDashboard';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import { PRIORITY_DOT_COLORS } from '@/utils/constants';
import { getTasksAlert, getFocusAlert } from '@/utils/alerts';
import type { Priority } from '@/types';
import clsx from 'clsx';

/** Главная — компактный хаб с обзором задач, привычек и бюджетов. */
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

  // Compute alerts using utility
  const tasksToday = d?.tasks_today ?? 0;
  const tasksDone = d?.tasks_completed_today ?? 0;
  const tasksAlertLevel = getTasksAlert(tasksDone, tasksToday);
  const tasksAlert = tasksAlertLevel !== 'neutral' ? tasksAlertLevel : undefined;

  const focusToday = d?.focus_minutes_today ?? 0;
  const focusTarget = 120; // 2h — TODO: make user-configurable
  const focusAlertLevel = getFocusAlert(focusToday, focusTarget);
  const focusAlert = focusAlertLevel !== 'neutral' ? focusAlertLevel : undefined;

  // Sparkline data (last 7 days from dashboard)
  const focusSparkline = (d?.productivity_heatmap ?? []).slice(-7).map((h: any) => h.minutes || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Row 1: Stat cards with context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/tasks" className="block">
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            label={t('dashboard.todaysTasks')}
            value={`${tasksDone} / ${tasksToday}`}
            alert={tasksAlert}
            iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
          />
        </Link>
        <Link to="/analytics" className="block">
          <StatCard
            icon={<Timer className="w-5 h-5" />}
            label={t('dashboard.focusTimeToday')}
            value={formatDuration(focusToday)}
            sparklineData={focusSparkline.length > 1 ? focusSparkline : undefined}
            target={{ value: formatDuration(focusTarget), label: t('dashboard.goal', { defaultValue: 'Цель' }) }}
            alert={focusAlert}
            iconBg="bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400"
          />
        </Link>
        <Link to="/finance" className="block">
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label={t('dashboard.netBalance')}
            value={formatCurrency(d?.total_balance ?? 0)}
            subtitle={(d as any)?.accounts_count ? `${(d as any).accounts_count} ${t('dashboard.accounts', { defaultValue: 'счёт(а)' })}` : undefined}
            iconBg="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400"
          />
        </Link>
      </div>

      {/* Row 2: Tasks + Habits (productivity together) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's tasks */}
        <Card>
          <CardHeader
            title={t('dashboard.todaysTasks')}
            subtitle={`${d?.tasks_completed_today ?? 0} ${t('dashboard.of')} ${d?.tasks_today ?? 0} ${t('dashboard.todaysTasksSub')}`}
            action={
              <Link to="/tasks" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
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

        {/* Habit grid */}
        <Card>
          <CardHeader
            title={t('dashboard.habitsThisWeek')}
            action={
              <Link to="/habits" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
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
                      {day.completed ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
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
      </div>

      {/* Row 3: Budget progress (finance) */}
      <Card>
        <CardHeader
          title={t('dashboard.topBudgets')}
          action={
            <Link to="/budgets" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
              {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(d?.top_budgets ?? []).slice(0, 3).map((budget) => {
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const pacing = (now.getDate() / daysInMonth) * budget.amount;
            return (
              <BulletGraph
                key={budget.id}
                label={budget.name}
                value={budget.spent}
                max={budget.amount}
                pacing={pacing}
                valueText={`${formatCurrency(budget.spent)} / ${formatCurrency(budget.amount)}`}
                size="sm"
              />
            );
          })}
          {(!d?.top_budgets || d.top_budgets.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4 col-span-3">{t('dashboard.noBudgetsSet')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
