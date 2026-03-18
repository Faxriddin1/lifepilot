import { useTranslation } from 'react-i18next';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useFinanceStats } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TransactionType } from '@/types';
import clsx from 'clsx';

const PIE_COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#4f46e5', '#059669', '#ca8a04',
];

/** Страница финансового обзора с графиками денежного потока, распределением расходов и последними транзакциями. */
export function FinanceOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useFinanceStats();
  const { data: txData, isLoading: txLoading } = useTransactions({ page_size: 5 });

  const isLoading = statsLoading || txLoading;
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const latestMonth = stats?.monthly_totals?.[stats.monthly_totals.length - 1];
  const totalBalance = stats?.net_worth_trend?.[stats.net_worth_trend.length - 1]?.amount ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label={t('financeOverview.totalBalance')}
          value={formatCurrency(totalBalance)}
          trendLabel={t('financeOverview.thisMonth')}
          iconBg="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('financeOverview.incomeMonth')}
          value={formatCurrency(latestMonth?.income ?? 0)}
          iconBg="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400"
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label={t('financeOverview.expensesMonth')}
          value={formatCurrency(latestMonth?.expense ?? 0)}
          iconBg="bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cashflow chart */}
        <Card className="lg:col-span-2">
          <CardHeader title={t('financeOverview.cashflow')} subtitle={t('financeOverview.last30Days')} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.cashflow ?? []}>
                <defs>
                  <linearGradient id="fIncGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    try { return formatDate(v, 'MMM d'); } catch { return v; }
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'income' ? t('financeOverview.income') : t('financeOverview.expenses'),
                  ]}
                />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#fIncGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#fExpGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader title={t('financeOverview.expenseDistribution')} />
          <div className="flex justify-center">
            <PieChart width={200} height={200}>
              <Pie
                data={stats?.expense_by_category ?? []}
                cx={95}
                cy={95}
                innerRadius={55}
                outerRadius={85}
                dataKey="amount"
                nameKey="category"
              >
                {(stats?.expense_by_category ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-2">
            {(stats?.expense_by_category ?? []).slice(0, 5).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{cat.category}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category bars */}
        <Card>
          <CardHeader title={t('financeOverview.expenseByCategory')} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.expense_by_category ?? []} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader
            title={t('financeOverview.recentTransactions')}
            action={
              <Link
                to="/transactions"
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('financeOverview.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
          <div className="space-y-1">
            {(txData?.results ?? []).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      tx.type === TransactionType.INCOME
                        ? 'bg-success-50 text-success-600'
                        : 'bg-danger-50 text-danger-600'
                    )}
                  >
                    {tx.type === TransactionType.INCOME ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.category?.name ?? t('financeOverview.uncategorized')} &middot;{' '}
                      {formatDate(tx.date, 'MMM d')}
                    </p>
                  </div>
                </div>
                <span
                  className={clsx(
                    'text-sm font-semibold whitespace-nowrap',
                    tx.type === TransactionType.INCOME
                      ? 'text-success-600'
                      : 'text-danger-600'
                  )}
                >
                  {tx.type === TransactionType.INCOME ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {(!txData?.results || txData.results.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">{t('financeOverview.noTransactions')}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
