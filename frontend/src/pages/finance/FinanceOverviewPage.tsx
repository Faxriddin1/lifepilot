import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet, TrendingUp, TrendingDown, ArrowRight, Plus,
  CreditCard, PiggyBank, Target, ArrowUpRight, ArrowDownRight,
  ArrowLeftRight, MoreHorizontal,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WaterfallChart } from '@/components/ui/WaterfallChart';
import { BulletGraph } from '@/components/ui/BulletGraph';
import { useFinanceStats } from '@/hooks/useDashboard';
import { useTransactions, useAccounts, useBudgets, useGoals } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TransactionType } from '@/types';
import { AddTransactionModal } from './AddTransactionModal';
import clsx from 'clsx';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#14B8A6', '#F97316'];

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵', checking: '🏦', savings: '🏦', credit_card: '💳',
  investment: '📈', crypto: '₿', other: '💰',
};

/** Финансовый дашборд — единая панель с балансами, графиками, бюджетами и целями. */
export function FinanceOverviewPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useFinanceStats();
  const { data: txData, isLoading: txLoading } = useTransactions({ page_size: 5 });
  const { data: accounts, isLoading: accLoading } = useAccounts();
  const { data: budgets } = useBudgets();
  const { data: goals } = useGoals();

  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');

  const isLoading = statsLoading || txLoading || accLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const latestMonth = stats?.monthly_totals?.[stats.monthly_totals.length - 1];
  const prevMonth = stats?.monthly_totals?.[stats.monthly_totals.length - 2];
  const totalBalance = stats?.net_worth_trend?.[stats.net_worth_trend.length - 1]?.amount ?? 0;
  const monthIncome = latestMonth?.income ?? 0;
  const monthExpense = latestMonth?.expense ?? 0;
  const monthSavings = monthIncome - monthExpense;

  // % change from previous month
  const prevIncome = prevMonth?.income ?? 0;
  const prevExpense = prevMonth?.expense ?? 0;
  const incomeChange = prevIncome > 0
    ? Math.round(((monthIncome - prevIncome) / prevIncome) * 100) : 0;
  const expenseChange = prevExpense > 0
    ? Math.round(((monthExpense - prevExpense) / prevExpense) * 100) : 0;

  const openAddTx = (type: 'expense' | 'income' | 'transfer') => {
    setTxType(type);
    setShowAddTx(true);
  };

  const accountList = Array.isArray(accounts) ? accounts : (accounts as any)?.results ?? [];
  const budgetList = Array.isArray(budgets) ? budgets : (budgets as any)?.results ?? [];
  const goalList = Array.isArray(goals) ? goals : (goals as any)?.results ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="danger"
          icon={<ArrowDownRight className="w-4 h-4" />}
          onClick={() => openAddTx('expense')}
        >
          {t('financeOverview.expense')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<ArrowUpRight className="w-4 h-4" />}
          onClick={() => openAddTx('income')}
          className="!text-green-600 !border-green-200 hover:!bg-green-50"
        >
          {t('financeOverview.income')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<ArrowLeftRight className="w-4 h-4" />}
          onClick={() => openAddTx('transfer')}
        >
          {t('financeOverview.transfer')}
        </Button>
      </div>

      {/* Stat cards — 4 columns with context */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceCard
          icon={<Wallet className="w-5 h-5 text-blue-500" />}
          label={t('financeOverview.totalBalance')}
          value={formatCurrency(totalBalance)}
          color="blue"
          subtitle={`${accountList.length} ${t('financeOverview.accountsCount')}`}
        />
        <FinanceCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label={t('financeOverview.incomeUp')}
          value={formatCurrency(monthIncome)}
          change={incomeChange}
          changePositive={true}
          color="blue"
          subtitle={t('financeOverview.thisMonth')}
        />
        <FinanceCard
          icon={<TrendingDown className="w-5 h-5 text-orange-500" />}
          label={t('financeOverview.expensesDown')}
          value={formatCurrency(monthExpense)}
          change={expenseChange}
          changePositive={false}
          color="orange"
          subtitle={t('financeOverview.thisMonth')}
        />
        <FinanceCard
          icon={<PiggyBank className="w-5 h-5 text-purple-500" />}
          label={t('financeOverview.savings')}
          value={formatCurrency(monthSavings)}
          color="purple"
          subtitle={monthIncome > 0 ? `${Math.round((monthSavings / monthIncome) * 100)}% ${t('financeOverview.ofIncome')}` : '0%'}
        />
      </div>

      {/* Cashflow chart — full width */}
      <Card>
        <CardHeader
          title={t('financeOverview.cashFlow')}
          subtitle={t('financeOverview.last30DaysSubtitle')}
        />
        <div className="h-[260px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.cashflow ?? []}>
              <defs>
                <linearGradient id="incGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'income' ? t('financeOverviewNew.tooltipIncome') : t('financeOverviewNew.tooltipExpense'),
                ]}
              />
              <Area type="monotone" dataKey="income" stroke="#3B82F6" fill="url(#incGrad2)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="expense" stroke="#F97316" fill="url(#expGrad2)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Accounts — show only if ≥2 accounts */}
      {accountList.length >= 2 && (
        <Card>
          <CardHeader
            title={t('financeOverviewNew.accounts')}
            subtitle={`${accountList.length} ${t('financeOverviewNew.accountsLabel')}`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {accountList.map((acc: any) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ACCOUNT_ICONS[acc.account_type] || '💰'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{acc.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{acc.account_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={clsx(
                  'text-sm font-bold',
                  parseFloat(acc.balance) >= 0 ? 'text-blue-600' : 'text-orange-500',
                )}>
                  {formatCurrency(parseFloat(acc.balance ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Second row: Categories + Budgets + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense waterfall — income → categories → savings */}
        <Card>
          <CardHeader
            title={t('financeOverviewNew.whereMoneyGoes')}
            subtitle={t('financeOverviewNew.incomeExpensesSavings')}
          />
          {(stats?.expense_by_category ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('financeOverviewNew.noData')}
            </div>
          ) : (
            <WaterfallChart
              items={[
                { label: t('financeOverviewNew.income'), amount: monthIncome, type: 'income', color: '#3B82F6' },
                ...(stats?.expense_by_category ?? [])
                  .sort((a: any, b: any) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((cat: any) => ({
                    label: cat.category,
                    amount: cat.amount,
                    type: 'expense' as const,
                    color: '#F97316',
                  })),
                { label: t('financeOverviewNew.savings'), amount: 0, type: 'total', color: '#22C55E' },
              ]}
              height={200}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </Card>

        {/* Top budgets */}
        <Card>
          <CardHeader
            title={t('financeOverviewNew.budgets')}
            action={
              <Link to="/budgets" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                {t('financeOverviewNew.all')} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-4 mt-2">
            {budgetList.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{t('financeOverviewNew.noBudgets')}</p>
                <Link to="/budgets" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                  + {t('financeOverviewNew.create')}
                </Link>
              </div>
            ) : (
              budgetList.slice(0, 4).map((budget: any) => {
                const spent = parseFloat(budget.spent_amount ?? budget.spent ?? 0);
                const limit = parseFloat(budget.amount ?? 0);
                // Pacing: how much should be spent by today based on day of month
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const pacing = (now.getDate() / daysInMonth) * limit;
                return (
                  <BulletGraph
                    key={budget.id}
                    label={budget.category_name || budget.category?.name || 'Budget'}
                    value={spent}
                    max={limit}
                    pacing={pacing}
                    valueText={`${formatCurrency(spent)} / ${formatCurrency(limit)}`}
                    size="sm"
                  />
                );
              })
            )}
          </div>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader
            title={t('financeOverviewNew.goals')}
            action={
              <Link to="/goals" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                {t('financeOverviewNew.all')} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-3 mt-2">
            {goalList.length === 0 ? (
              <div className="text-center py-6">
                <PiggyBank className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{t('financeOverviewNew.noGoals')}</p>
                <Link to="/goals" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                  + {t('financeOverviewNew.create')}
                </Link>
              </div>
            ) : (
              goalList.slice(0, 4).map((goal: any) => {
                const current = parseFloat(goal.current_amount ?? 0);
                const target = parseFloat(goal.target_amount ?? 0);
                const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {goal.name}
                      </span>
                      <span className="text-xs font-semibold text-purple-500">{pct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatCurrency(current)}/{formatCurrency(target)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Monthly comparison — show only with ≥3 months of data */}
      {(() => {
        const monthsWithData = (stats?.monthly_totals ?? []).filter((m: any) => m.income > 0 || m.expense > 0);
        if (monthsWithData.length < 3) return null;
        return (
          <Card>
            <CardHeader
              title={t('financeOverviewNew.monthly')}
              subtitle={t('financeOverviewNew.last6Months')}
            />
            <div className="h-[220px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsWithData.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(5)} fontSize={11} stroke="#9CA3AF" />
                  <YAxis fontSize={11} stroke="#9CA3AF" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} name={t('financeOverviewNew.tooltipIncome')} />
                  <Bar dataKey="expense" fill="#F97316" radius={[4, 4, 0, 0]} name={t('financeOverviewNew.tooltipExpense')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      })()}

      {/* Recent transactions */}
      <Card>
          <CardHeader
            title={t('financeOverviewNew.recentTransactions')}
            action={
              <Link to="/transactions" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                {t('financeOverviewNew.all')} <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="space-y-0.5 mt-1">
            {(txData?.results ?? []).map((tx: any) => {
              const isIncome = tx.transaction_type === TransactionType.INCOME || tx.type === TransactionType.INCOME;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      isIncome ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
                    )}>
                      {isIncome
                        ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {tx.note || tx.description || '—'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {tx.category_name ?? t('financeOverviewNew.uncategorized')} · {formatDate(tx.date, 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-sm font-bold whitespace-nowrap',
                    isIncome ? 'text-green-600' : 'text-red-500',
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(parseFloat(tx.amount ?? 0))}
                  </span>
                </div>
              );
            })}
            {(!txData?.results || txData.results.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">
                {t('financeOverviewNew.noTransactions')}
              </div>
            )}
          </div>
        </Card>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTx}
        onClose={() => setShowAddTx(false)}
        defaultType={txType}
      />
    </div>
  );
}

/** Карточка финансового показателя. */
function FinanceCard({ icon, label, value, change, changePositive, color, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  changePositive?: boolean;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={clsx(
        'absolute top-0 right-0 w-20 h-20 rounded-full -mr-6 -mt-6 opacity-10',
        color === 'blue' && 'bg-blue-500',
        color === 'green' && 'bg-green-500',
        color === 'red' && 'bg-red-500',
        color === 'orange' && 'bg-orange-500',
        color === 'purple' && 'bg-purple-500',
      )} />
      <div className="flex items-start gap-3 relative">
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20',
          color === 'green' && 'bg-green-50 dark:bg-green-900/20',
          color === 'red' && 'bg-red-50 dark:bg-red-900/20',
          color === 'orange' && 'bg-orange-50 dark:bg-orange-900/20',
          color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
        )}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
          {change !== undefined && change !== 0 && (
            <p className={clsx(
              'text-[10px] flex items-center gap-0.5 mt-0.5',
              (changePositive ? change > 0 : change < 0) ? 'text-green-500' : 'text-red-500',
            )}>
              {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}% vs {subtitle || 'prev'}
            </p>
          )}
          {subtitle && !change && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
