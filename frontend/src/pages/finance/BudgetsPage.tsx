import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, PiggyBank, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBudgets, useCreateBudget, useCategories } from '@/hooks/useFinance';
import { formatCurrency } from '@/utils/formatters';
import { BudgetPeriod, type CreateBudgetData } from '@/types';
import { format } from 'date-fns';
import { useUiStore } from '@/store/uiStore';

/** Страница управления бюджетами с индикаторами расхода и предупреждениями о превышении. */
export function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();

  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);
  const { t } = useTranslation();

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const handleCreate = () => {
    if (!name.trim() || !amount) return;
    const data: CreateBudgetData = {
      name: name.trim(),
      amount: parseFloat(amount),
      category_id: categoryId || null,
      period,
      start_date: format(new Date(), 'yyyy-MM-dd'),
    };
    createBudget.mutate(data, {
      onSuccess: () => {
        setShowModal(false);
        setName('');
        setAmount('');
        setCategoryId('');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{budgets?.length ?? 0} {t('budgetsPage.activeBudgets')}</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('budgetsPage.addBudget')}
        </Button>
      </div>

      {!budgets || budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8" />}
          title={t('budgetsPage.noBudgets')}
          description={t('budgetsPage.noBudgetsDesc')}
          actionLabel={t('budgetsPage.createBudget')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const isOver = pct > 100;
            const isWarning = pct > 80 && !isOver;
            const remaining = budget.amount - budget.spent;

            return (
              <Card key={budget.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {budget.name}
                    </h3>
                    {budget.category && (
                      <p className="text-xs text-gray-500 mt-0.5">{budget.category.name}</p>
                    )}
                  </div>
                  {isOver && (
                    <Badge variant="danger" size="sm">
                      <AlertTriangle className="w-3 h-3" />
                      {t('budgetsPage.overBudget')}
                    </Badge>
                  )}
                  {isWarning && (
                    <Badge variant="warning" size="sm">
                      <AlertTriangle className="w-3 h-3" />
                      {t('budgetsPage.almostReached')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(budget.spent)}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">
                      / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{Math.round(pct)}%</span>
                </div>

                <ProgressBar
                  value={budget.spent}
                  max={budget.amount}
                  variant={isOver ? 'danger' : isWarning ? 'warning' : 'primary'}
                  size="md"
                />

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className="capitalize">{budget.period}</span>
                  <span
                    className={clsx(
                      'font-medium',
                      remaining < 0 ? 'text-danger-600' : 'text-success-600'
                    )}
                  >
                    {remaining >= 0
                      ? `${formatCurrency(remaining)} ${t('budgetsPage.remaining')}`
                      : `${formatCurrency(Math.abs(remaining))} ${t('budgetsPage.over')}`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('budgetsPage.newBudget')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} loading={createBudget.isPending}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('budgetsPage.name')}
            placeholder={t('budgetsPage.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('budgetsPage.budgetAmount')}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
          />
          <Select
            label={t('transactionsPage.category')}
            placeholder={t('budgetsPage.selectCategory')}
            options={[
              { value: '', label: t('budgetsPage.allSpending') },
              ...(categories ?? [])
                .filter((c) => c.type === 'expense')
                .map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <Select
            label={t('budgetsPage.period')}
            options={[
              { value: BudgetPeriod.WEEKLY, label: t('budgetsPage.weekly') },
              { value: BudgetPeriod.MONTHLY, label: t('budgetsPage.monthly') },
              { value: BudgetPeriod.QUARTERLY, label: t('budgetsPage.quarterly') },
              { value: BudgetPeriod.YEARLY, label: t('budgetsPage.yearly') },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
          />
        </div>
      </Modal>
    </div>
  );
}
