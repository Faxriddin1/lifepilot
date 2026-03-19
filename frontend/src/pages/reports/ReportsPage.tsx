import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, TrendingUp, TrendingDown, Target, Clock,
  CheckCircle2, Flame, BarChart3, PieChart as PieChartIcon,
  Download, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import clsx from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useFinanceStats } from '@/hooks/useDashboard';
import { useProductivityStats } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

type Tab = 'finance' | 'productivity' | 'habits';

/** Страница отчётов — единая аналитическая панель с финансами, продуктивностью и привычками. */
export function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('finance');

  const { data: financeData, isLoading: finLoading } = useFinanceStats();
  const { data: prodData, isLoading: prodLoading } = useProductivityStats();

  const isLoading = finLoading || prodLoading;

  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: 'finance', label: t('reports.tabFinance'), icon: DollarSign },
    { key: 'productivity', label: t('reports.tabProductivity'), icon: Clock },
    { key: 'habits', label: t('reports.tabHabits'), icon: Flame },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Finance calculations
  const monthlyTotals = financeData?.monthly_totals ?? [];
  const currentMonth = monthlyTotals[monthlyTotals.length - 1];
  const prevMonth = monthlyTotals[monthlyTotals.length - 2];
  const totalIncome = currentMonth?.income ?? 0;
  const totalExpense = currentMonth?.expense ?? 0;
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
  const expenseChange = prevMonth?.expense > 0
    ? Math.round(((totalExpense - prevMonth.expense) / prevMonth.expense) * 100)
    : 0;

  // Productivity calculations
  const taskCompletionRate = prodData?.task_completion_rate ?? 0;
  const totalFocus = prodData?.total_focus_minutes ?? 0;
  const avgFocus = prodData?.avg_focus_per_day ?? 0;
  const completedTasks = prodData?.completed_tasks ?? 0;
  const totalTasks = prodData?.total_tasks ?? 0;
  const streakDays = prodData?.streak_days ?? 0;

  // Habit calculations
  const habitStats = prodData?.habit_stats ?? [];
  const habitRate = prodData?.habit_completion_rate ?? 0;
  const habitWeekCompleted = prodData?.habit_week_completed ?? 0;
  const habitWeekPossible = prodData?.habit_week_possible ?? 0;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              label={t('reports.income')}
              value={formatCurrency(totalIncome)}
              color="green"
            />
            <SummaryCard
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              label={t('reports.expense')}
              value={formatCurrency(totalExpense)}
              change={expenseChange}
              color="red"
            />
            <SummaryCard
              icon={<DollarSign className="w-5 h-5 text-blue-500" />}
              label={t('reports.savings')}
              value={formatCurrency(savings)}
              color="blue"
            />
            <SummaryCard
              icon={<Target className="w-5 h-5 text-purple-500" />}
              label={t('reports.savingsRate')}
              value={`${savingsRate}%`}
              color="purple"
            />
          </div>

          {/* Cashflow chart */}
          <Card>
            <CardHeader
              title={t('reports.cashFlow')}
              subtitle={t('reports.cashFlowSubtitle')}
            />
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeData?.cashflow ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    fontSize={11}
                    stroke="#9CA3AF"
                  />
                  <YAxis fontSize={11} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'income' ? t('reports.income') : t('reports.expense'),
                    ]}
                    labelFormatter={(label: string) => label}
                  />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B98130" name="income" />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#EF4444" fill="#EF444430" name="expense" />
                  <Legend formatter={(v: string) => v === 'income' ? t('reports.income') : t('reports.expense')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense by category */}
            <Card>
              <CardHeader
                title={t('reports.expenseByCategory')}
                subtitle={t('reports.currentMonth')}
              />
              <div className="h-[260px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financeData?.expense_by_category ?? []}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {(financeData?.expense_by_category ?? []).map((_: unknown, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Monthly comparison */}
            <Card>
              <CardHeader
                title={t('reports.monthlyComparison')}
                subtitle={t('reports.last6Months')}
              />
              <div className="h-[260px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTotals.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(5)} fontSize={11} stroke="#9CA3AF" />
                    <YAxis fontSize={11} stroke="#9CA3AF" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name={t('reports.income')} />
                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name={t('reports.expense')} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Productivity Tab */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
              label={t('reports.tasksCompleted')}
              value={`${completedTasks}/${totalTasks}`}
              color="green"
            />
            <SummaryCard
              icon={<Target className="w-5 h-5 text-blue-500" />}
              label={t('reports.completionRate')}
              value={`${taskCompletionRate}%`}
              color="blue"
            />
            <SummaryCard
              icon={<Clock className="w-5 h-5 text-purple-500" />}
              label={t('reports.totalFocus')}
              value={`${totalFocus} ${t('reports.min')}`}
              color="purple"
            />
            <SummaryCard
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label={t('reports.focusStreak')}
              value={`${streakDays} ${t('reports.days')}`}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily focus chart */}
            <Card>
              <CardHeader
                title={t('reports.dailyFocus')}
                subtitle={t('reports.focusMinutesPerDay')}
              />
              <div className="h-[260px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodData?.daily_focus ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={11} stroke="#9CA3AF" />
                    <YAxis fontSize={11} stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value: number) => [`${value} ${t('reports.min')}`, t('reports.focus')]}
                    />
                    <Bar dataKey="minutes" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Task completion donut */}
            <Card>
              <CardHeader
                title={t('reports.taskCompletion')}
                subtitle={`${completedTasks} ${t('reports.of')} ${totalTasks}`}
              />
              <div className="h-[260px] mt-4 flex items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('reports.done'), value: completedTasks },
                          { name: t('reports.remaining'), value: Math.max(0, totalTasks - completedTasks) },
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{taskCompletionRate}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Peak hours */}
          <Card>
            <CardHeader
              title={t('reports.peakHours')}
              subtitle={t('reports.peakHoursSubtitle')}
            />
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prodData?.peak_hours ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(v: number) => `${v}:00`}
                    fontSize={11}
                    stroke="#9CA3AF"
                  />
                  <YAxis fontSize={11} stroke="#9CA3AF" />
                  <Tooltip
                    formatter={(value: number) => [`${value} ${t('reports.min')}`, t('reports.focus')]}
                    labelFormatter={(label: number) => `${label}:00`}
                  />
                  <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label={t('reports.habitsCount')}
              value={String(prodData?.total_habits ?? 0)}
              color="orange"
            />
            <SummaryCard
              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
              label={t('reports.thisWeek')}
              value={`${habitWeekCompleted}/${habitWeekPossible}`}
              color="green"
            />
            <SummaryCard
              icon={<Target className="w-5 h-5 text-blue-500" />}
              label={t('reports.completionRateLabel')}
              value={`${habitRate}%`}
              color="blue"
            />
            <SummaryCard
              icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
              label={t('reports.avgStreak')}
              value={`${habitStats.length > 0 ? Math.round(habitStats.reduce((s: number, h: any) => s + (h.current_streak || 0), 0) / habitStats.length) : 0} ${t('reports.days')}`}
              color="purple"
            />
          </div>

          {/* Habit stats table */}
          <Card>
            <CardHeader
              title={t('reports.habitStats')}
              subtitle={t('reports.habitStatsSubtitle')}
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">{t('reports.habit')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">{t('reports.streak')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">{t('reports.daysCol')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">{t('reports.target')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400 w-[200px]">{t('reports.progress')}</th>
                  </tr>
                </thead>
                <tbody>
                  {habitStats.map((habit: any, idx: number) => {
                    const pct = habit.target_days > 0
                      ? Math.min(Math.round((habit.completed_days / habit.target_days) * 100), 100)
                      : 0;
                    return (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color || COLORS[idx % COLORS.length] }} />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{habit.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                            <Flame className="w-3.5 h-3.5" /> {habit.current_streak || 0}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-600 dark:text-gray-400">{habit.completed_days || 0}</td>
                        <td className="text-center py-3 px-2 text-gray-600 dark:text-gray-400">{habit.target_days || 30}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: habit.color || COLORS[idx % COLORS.length] }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {habitStats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        {t('reports.noHabits')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Habit heatmap */}
          {(prodData?.habit_heatmap ?? []).length > 0 && (
            <Card>
              <CardHeader
                title={t('reports.habitHeatmap')}
                subtitle={t('reports.habitHeatmapSubtitle')}
              />
              <div className="mt-4 overflow-x-auto">
                <HabitHeatmap data={prodData?.habit_heatmap ?? []} />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/** Карточка показателя. */
function SummaryCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  color: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={clsx(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
        color === 'green' && 'bg-green-50 dark:bg-green-900/20',
        color === 'red' && 'bg-red-50 dark:bg-red-900/20',
        color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20',
        color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
        color === 'orange' && 'bg-orange-50 dark:bg-orange-900/20',
      )}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {change !== undefined && change !== 0 && (
          <p className={clsx('text-xs flex items-center gap-0.5', change > 0 ? 'text-red-500' : 'text-green-500')}>
            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}% {change > 0 ? 'vs prev' : 'vs prev'}
          </p>
        )}
      </div>
    </Card>
  );
}

/** GitHub-style heatmap для привычек. */
function HabitHeatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return '#E5E7EB';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return '#C6E7D4';
    if (intensity <= 0.5) return '#6DD49E';
    if (intensity <= 0.75) return '#2DA563';
    return '#1A7F41';
  };

  // Group by weeks (7 rows)
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  let currentWeek: Array<{ date: string; count: number }> = [];

  data.forEach((d, i) => {
    const dayOfWeek = new Date(d.date).getDay();
    if (i > 0 && dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(d);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="flex gap-[3px] pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => (
            <div
              key={day.date}
              className="w-3 h-3 rounded-sm transition-colors"
              style={{ backgroundColor: getColor(day.count) }}
              title={`${day.date}: ${day.count}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
