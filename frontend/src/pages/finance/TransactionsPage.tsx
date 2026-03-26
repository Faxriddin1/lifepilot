import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Upload,
  MoreHorizontal,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTransactions, useCategories } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TransactionType, type TransactionFilters } from '@/types';
import { AddTransactionModal } from './AddTransactionModal';
import { useUiStore } from '@/store/uiStore';
import { toast } from 'sonner';

/** Страница списка транзакций с фильтрацией по типу, категории, дате и пагинацией. */
export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [search, setSearch] = useState('');
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (quickAddOpen) {
      setShowAddModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const activeFilters: TransactionFilters = {
    ...filters,
    search: search || undefined,
  };

  const { data, isLoading } = useTransactions(activeFilters);
  const { data: categories } = useCategories();

  const transactions = data?.results ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder={t('transactionsPage.searchTransactions')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          options={[
            { value: '', label: t('transactionsPage.allTypes') },
            { value: TransactionType.INCOME, label: t('transactionsPage.income') },
            { value: TransactionType.EXPENSE, label: t('transactionsPage.expense') },
            { value: TransactionType.TRANSFER, label: t('transactionsPage.transfer') },
          ]}
          value={filters.transaction_type || ''}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              transaction_type: (e.target.value as TransactionType) || undefined,
            }))
          }
        />
        <Select
          options={[
            { value: '', label: t('transactionsPage.allCategories') },
            ...(categories ?? []).map((c) => ({ value: String(c.id), label: c.name })),
          ]}
          value={filters.category_id ? String(filters.category_id) : ''}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              category_id: e.target.value || undefined,
            }))
          }
        />
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value || undefined }))}
          className="w-36"
        />
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value || undefined }))}
          className="w-36"
        />
        <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => toast.error('CSV import coming soon')}>
          {t('transactionsPage.importCSV')}
        </Button>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
          {t('transactionsPage.addTransaction')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-8 h-8" />}
          title={t('transactionsPage.noTransactions')}
          description={t('transactionsPage.noTransactionsDesc')}
          actionLabel={t('transactionsPage.addTransaction')}
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-3 py-2">
                    {t('transactionsPage.date')}
                  </th>
                  <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-3 py-2">
                    {t('transactionsPage.description')}
                  </th>
                  <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-3 py-2">
                    {t('transactionsPage.category')}
                  </th>
                  <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-3 py-2">
                    {t('transactionsPage.account')}
                  </th>
                  <th className="text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-3 py-2">
                    {t('transactionsPage.amount')}
                  </th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border hover:bg-surface transition-colors"
                  >
                    <td className="px-3 py-2 text-sm text-foreground-secondary whitespace-nowrap">
                      {formatDate(tx.date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
                            (tx.transaction_type || tx.type) === TransactionType.INCOME
                              ? 'bg-success-bg text-success'
                              : (tx.transaction_type || tx.type) === TransactionType.EXPENSE
                                ? 'bg-danger-bg text-danger'
                                : 'bg-accent/10 text-accent'
                          )}
                        >
                          {(tx.transaction_type || tx.type) === TransactionType.INCOME ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (tx.transaction_type || tx.type) === TransactionType.EXPENSE ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {tx.note || tx.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="default" size="sm">
                        {tx.category_name ?? t('transactionsPage.uncategorized')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-foreground-secondary">
                      {tx.account_name ?? '--'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={clsx(
                          'text-sm font-semibold',
                          (tx.transaction_type || tx.type) === TransactionType.INCOME
                            ? 'text-success'
                            : (tx.transaction_type || tx.type) === TransactionType.EXPENSE
                              ? 'text-danger'
                              : 'text-accent'
                        )}
                      >
                        {(tx.transaction_type || tx.type) === TransactionType.INCOME
                          ? '+'
                          : (tx.transaction_type || tx.type) === TransactionType.EXPENSE
                            ? '-'
                            : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button className="p-1 rounded text-foreground-secondary hover:text-foreground hover:bg-surface">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.count > (filters.page_size ?? 20) && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <p className="text-sm text-foreground-secondary">{data.count} {t('transactionsPage.totalTransactions')}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!data.previous}
                  onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                >
                  {t('transactionsPage.previous')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!data.next}
                  onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                >
                  {t('transactionsPage.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
