import {
  CheckSquare,
  Timer,
  Wallet,
  TrendingUp,
  TrendingDown,
  Circle,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { BulletGraph } from '@/components/ui/BulletGraph';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDashboardData } from '@/hooks/useDashboard';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import { PRIORITY_DOT_COLORS } from '@/utils/constants';
import { getTasksAlert, getFocusAlert, getBudgetAlert } from '@/utils/alerts';
import type { Priority } from '@/types';
import clsx from 'clsx';

/** Dashboard Skeleton — matches Bento Grid layout */
function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

/** Cashflow mini chart — 7 day area chart */
function CashflowChart({ data }: { data: Array<{ date: string; income: number; expense: number }> }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          hide
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
          labelFormatter={(v) => {
            const d = new Date(v);
            return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="var(--color-income)"
          fill="url(#incomeGrad)"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="var(--color-expense)"
          fill="url(#expenseGrad)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Главная — Bento Grid с обзором задач, привычек, финансов и продуктивности. */
export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;

  const d = data;

  // Alerts
  const tasksToday = d?.tasks_today ?? 0;
  const tasksDone = d?.tasks_completed_today ?? 0;
  const tasksAlertLevel = getTasksAlert(tasksDone, tasksToday);
  const tasksAlert = tasksAlertLevel !== 'neutral' ? tasksAlertLevel : undefined;

  const focusToday = d?.focus_minutes_today ?? 0;
  const focusTarget = 120; // TODO: user-configurable
  const focusAlertLevel = getFocusAlert(focusToday, focusTarget);
  const focusAlert = focusAlertLevel !== 'neutral' ? focusAlertLevel : undefined;

  // Sparkline from heatmap (last 7 days)
  const focusSparkline = (d?.productivity_heatmap ?? []).slice(-7).map((h: any) => h.minutes || 0);

  // Cashflow data
  const cashflow = (d?.cashflow_7d ?? []).map((cf: any) => ({
    date: cf.date,
    income: Number(cf.income || 0),
    expense: Number(cf.expense || 0),
  }));

  const incomeMonth = d?.income_this_month ?? 0;
  const expenseMonth = d?.expenses_this_month ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Row 1: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/tasks" className="block">
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            label={t('dashboard.todaysTasks')}
            value={`${tasksDone}/${tasksToday}`}
            alert={tasksAlert}
            iconBg="bg-info-bg text-accent"
          />
        </Link>
        <Link to="/analytics" className="block">
          <StatCard
            icon={<Timer className="w-5 h-5" />}
            label={t('dashboard.focusTimeToday')}
            value={formatDuration(focusToday)}
            sparklineData={focusSparkline.length > 1 ? focusSparkline : undefined}
            target={{ value: formatDuration(focusTarget), label: t('dashboard.goal', { defaultValue: 'Goal' }) }}
            alert={focusAlert}
            iconBg="bg-info-bg text-accent"
          />
        </Link>
        <Link to="/finance" className="block">
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label={t('dashboard.netBalance')}
            value={formatCurrency(d?.total_balance ?? 0)}
            iconBg="bg-success-bg text-success"
          />
        </Link>
        <Link to="/finance" className="block">
          <StatCard
            icon={incomeMonth >= expenseMonth ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            label={t('dashboard.incomeExpense', { defaultValue: 'This Month' })}
            value={formatCurrency(incomeMonth - expenseMonth)}
            subtitle={`+${formatCurrency(incomeMonth)} / -${formatCurrency(expenseMonth)}`}
            iconBg={incomeMonth >= expenseMonth ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}
          />
        </Link>
      </div>

      {/* Row 2: Tasks (2 cols) + Habits (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's tasks — compact checklist */}
        <Card>
          <CardHeader
            title={t('dashboard.todaysTasks')}
            subtitle={`${tasksDone} ${t('dashboard.of')} ${tasksToday} ${t('dashboard.todaysTasksSub')}`}
            action={
              <Link to="/tasks" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-0.5">
            {(d?.recent_tasks ?? []).slice(0, 7).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 h-8 px-1 rounded-md hover:bg-surface transition-colors duration-fast group"
              >
                {/* Status checkbox */}
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    task.status === 'done'
                      ? 'border-success bg-success'
                      : 'border-border group-hover:border-accent'
                  )}
                >
                  {task.status === 'done' && <Check className="w-2.5 h-2.5 text-foreground-inverse" />}
                </div>
                {/* Priority dot */}
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    PRIORITY_DOT_COLORS[task.priority as Priority] || 'bg-elevated'
                  )}
                />
                {/* Title */}
                <span
                  className={clsx(
                    'flex-1 text-sm truncate',
                    task.status === 'done'
                      ? 'text-foreground-tertiary line-through'
                      : 'text-foreground'
                  )}
                >
                  {task.title}
                </span>
                {/* Deadline */}
                {task.deadline && (
                  <span className="text-[10px] text-foreground-tertiary flex-shrink-0">
                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
            {(!d?.recent_tasks || d.recent_tasks.length === 0) && (
              <p className="text-sm text-foreground-secondary text-center py-6">{t('dashboard.noTasksToday')}</p>
            )}
          </div>
        </Card>

        {/* Habits — 7-day grid */}
        <Card>
          <CardHeader
            title={t('dashboard.habitsThisWeek')}
            action={
              <Link to="/habits" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-2">
            {/* Day headers */}
            {(d?.habit_completions ?? []).length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-4 flex-shrink-0" />
                <div className="w-24" />
                <div className="flex gap-1 flex-1">
                  {d!.habit_completions[0].days.map((day, i) => {
                    const date = new Date(day.date);
                    const dayNames = [
                      t('days.sun', { defaultValue: 'Su' }),
                      t('days.mon', { defaultValue: 'Mo' }),
                      t('days.tue', { defaultValue: 'Tu' }),
                      t('days.wed', { defaultValue: 'We' }),
                      t('days.thu', { defaultValue: 'Th' }),
                      t('days.fri', { defaultValue: 'Fr' }),
                      t('days.sat', { defaultValue: 'Sa' }),
                    ];
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'w-7 flex flex-col items-center leading-tight',
                          isToday ? 'text-accent font-semibold' : 'text-foreground-tertiary'
                        )}
                      >
                        <span className="text-[10px]">{dayNames[date.getDay()]}</span>
                        <span className="text-[10px]">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {(d?.habit_completions ?? []).slice(0, 5).map((habit) => (
              <div key={habit.habit_id} className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="text-sm text-foreground w-24 truncate">
                  {habit.habit_name}
                </span>
                <div className="flex gap-1 flex-1">
                  {habit.days.map((day, i) => {
                    const date = new Date(day.date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'w-7 h-7 rounded flex items-center justify-center text-xs transition-colors',
                          day.completed
                            ? 'bg-success/15 text-success'
                            : 'bg-surface text-foreground-tertiary',
                          isToday && 'ring-2 ring-accent'
                        )}
                      >
                        {day.completed ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {(!d?.habit_completions || d.habit_completions.length === 0) && (
              <p className="text-sm text-foreground-secondary text-center py-4">{t('dashboard.noHabitsTracked')}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Cashflow (2 cols) + Budget Bullets (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cashflow 7-day chart */}
        <Card>
          <CardHeader
            title={t('dashboard.cashflow7d', { defaultValue: 'Cashflow (7 days)' })}
            action={
              <Link to="/transactions" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          {cashflow.length > 0 ? (
            <div className="-mx-2">
              <CashflowChart data={cashflow} />
              <div className="flex items-center justify-center gap-6 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-income" />
                  <span className="text-xs text-foreground-secondary">{t('finance.income', { defaultValue: 'Income' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-expense" />
                  <span className="text-xs text-foreground-secondary">{t('finance.expense', { defaultValue: 'Expense' })}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-secondary text-center py-8">{t('dashboard.noTransactions', { defaultValue: 'No transactions this week' })}</p>
          )}
        </Card>

        {/* Budget bullet graphs */}
        <Card>
          <CardHeader
            title={t('dashboard.topBudgets')}
            action={
              <Link to="/budgets" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                {t('common.more', { defaultValue: '→' })} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-4">
            {(d?.top_budgets ?? []).slice(0, 4).map((budget) => {
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
              <p className="text-sm text-foreground-secondary text-center py-4">{t('dashboard.noBudgetsSet')}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
