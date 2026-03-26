import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, PiggyBank, AlertTriangle, Trash2, TrendingDown,
  Utensils, ShoppingBag, Car, Home, Heart, Gamepad2,
  Plane, Zap, GraduationCap, Gift, Shield, Sparkles,
  CircleDot, Tag,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBudgets, useCreateBudget, useDeleteBudget, useCategories } from '@/hooks/useFinance';
import { formatCurrency } from '@/utils/formatters';
import { BudgetPeriod, type CreateBudgetData, type Category } from '@/types';
import { format } from 'date-fns';
import { useUiStore } from '@/store/uiStore';

/** Маппинг иконок категорий. */
const ICON_MAP: Record<string, typeof Utensils> = {
  'utensils': Utensils, 'shopping-bag': ShoppingBag, 'car': Car, 'home': Home,
  'heart-pulse': Heart, 'gamepad-2': Gamepad2, 'plane': Plane, 'zap': Zap,
  'graduation-cap': GraduationCap, 'gift': Gift, 'shield': Shield,
  'sparkles': Sparkles, 'circle-dot': CircleDot,
};

const getCatIcon = (icon: string) => ICON_MAP[icon] || Tag;

/** Страница бюджетов с визуальным выбором категории и прогресс-барами. */
export function BudgetsPage() {
  const { t } = useTranslation();
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'category' | 'amount'>('category');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const expenseCategories = (categories ?? []).filter(
    (c) => (c.category_type || c.type) === 'expense'
  );

  const handleCreate = () => {
    if (!selectedCat || !amount) return;
    const data: CreateBudgetData = {
      category: String(selectedCat.id),
      amount: parseFloat(amount),
      period,
      start_date: format(new Date(), 'yyyy-MM-dd'),
    };
    createBudget.mutate(data, {
      onSuccess: () => {
        closeModal();
      },
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setStep('category');
    setSelectedCat(null);
    setAmount('');
    setPeriod(BudgetPeriod.MONTHLY);
  };

  // Calculate totals — parse all values as float since API may return strings
  const totalBudget = (budgets ?? []).reduce((s, b) => s + parseFloat(String(b.amount || 0)), 0);
  const totalSpent = (budgets ?? []).reduce((s, b) => s + parseFloat(String(b.spent_amount || b.spent || 0)), 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Summary bar */}
      {(budgets ?? []).length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">{t('budgetsNew.totalBudget')}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-foreground-secondary">{t('budgetsNew.spent')}</p>
                <p className="text-lg font-bold text-danger">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-foreground-secondary">{t('budgetsNew.remaining')}</p>
                <p className={clsx('text-lg font-bold', totalRemaining >= 0 ? 'text-success' : 'text-danger')}>
                  {formatCurrency(Math.abs(totalRemaining))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-foreground-secondary">{t('budgetsNew.used')}</p>
                <p className="text-lg font-bold text-foreground">{Math.round(totalPct)}%</p>
              </div>
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              {t('budgetsPage.addBudget')}
            </Button>
          </div>
          <ProgressBar
            value={totalSpent}
            max={totalBudget}
            variant={totalPct > 100 ? 'danger' : totalPct > 80 ? 'warning' : 'primary'}
            size="sm"
            className="mt-3"
          />
        </Card>
      )}

      {!budgets || budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8" />}
          title={t('budgetsPage.noBudgets')}
          description={t('budgetsPage.noBudgetsDesc')}
          actionLabel={t('budgetsPage.createBudget')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((budget) => {
            const budgetAmount = parseFloat(String(budget.amount || 0));
            const spent = parseFloat(String(budget.spent_amount || budget.spent || 0));
            const pct = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
            const isOver = pct > 100;
            const isWarning = pct > 80 && !isOver;
            const remaining = budgetAmount - spent;

            // Find category info
            const cat = expenseCategories.find((c) => String(c.id) === String(budget.category));
            const CatIcon = cat ? getCatIcon(cat.icon || '') : TrendingDown;
            const catColor = cat?.color || 'var(--text-secondary)';
            const catName = budget.category_name || cat?.name || t('budgetsNew.uncategorized');

            return (
              <Card key={budget.id} className="group relative overflow-hidden">
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: isOver ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : catColor }}
                />

                <div className="pt-2">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${catColor}20` }}
                      >
                        <CatIcon className="w-5 h-5" style={{ color: catColor }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {catName}
                        </h3>
                        <p className="text-xs text-foreground-secondary capitalize">{budget.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOver && (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          {t('budgetsNew.over')}
                        </Badge>
                      )}
                      {isWarning && (
                        <Badge variant="warning" size="sm">
                          {t('budgetsNew.almost')}
                        </Badge>
                      )}
                      <button
                        onClick={() => deleteBudget.mutate(budget.id)}
                        className="p-1 rounded text-foreground-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                        title={t('budgetsNew.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount display */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-sm text-foreground-secondary ml-1">
                        / {formatCurrency(budgetAmount)}
                      </span>
                    </div>
                    <span className={clsx(
                      'text-sm font-bold',
                      isOver ? 'text-danger' : isWarning ? 'text-warning' : 'text-foreground-secondary',
                    )}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar
                    value={spent}
                    max={budgetAmount}
                    variant={isOver ? 'danger' : isWarning ? 'warning' : 'primary'}
                    size="md"
                  />

                  {/* Footer */}
                  <div className="mt-3 text-xs">
                    <span
                      className={clsx(
                        'font-medium',
                        remaining < 0 ? 'text-danger' : 'text-success'
                      )}
                    >
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} ${t('budgetsNew.remaining2')}`
                        : `${formatCurrency(Math.abs(remaining))} ${t('budgetsNew.exceeded')}`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal — 2-step flow */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {step === 'category'
                  ? t('budgetsNew.chooseCategory')
                  : t('budgetsNew.setLimit')}
              </h2>
              <p className="text-sm text-foreground-secondary mt-0.5">
                {step === 'category'
                  ? t('budgetsNew.whichCategoryBudget')
                  : `${selectedCat?.name} — ${t('budgetsNew.howMuchPlan')}`}
              </p>
            </div>

            <div className="px-6 py-5">
              {step === 'category' ? (
                /* Step 1: Category selection grid */
                <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto">
                  {expenseCategories.map((cat) => {
                    const Icon = getCatIcon(cat.icon || '');
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCat(cat);
                          setStep('amount');
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-surface transition-all hover:scale-105"
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Step 2: Amount + period */
                <div className="space-y-5">
                  {/* Selected category */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                    {selectedCat && (() => {
                      const Icon = getCatIcon(selectedCat.icon || '');
                      return (
                        <>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${selectedCat.color}20` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: selectedCat.color }} />
                          </div>
                          <span className="font-medium text-foreground">{selectedCat.name}</span>
                          <button
                            onClick={() => setStep('category')}
                            className="ml-auto text-xs text-accent hover:text-accent/80"
                          >
                            {t('budgetsNew.change')}
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                      {t('budgetsNew.budgetLimit')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-foreground-secondary">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 text-xl font-bold rounded-xl border-2 border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-border-focus"
                      />
                    </div>
                  </div>

                  {/* Period — visual buttons */}
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      {t('budgetsNew.period')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: BudgetPeriod.WEEKLY, label: t('budgetsNew.week') },
                        { value: BudgetPeriod.MONTHLY, label: t('budgetsNew.month') },
                        { value: BudgetPeriod.QUARTERLY, label: t('budgetsNew.quarter') },
                        { value: BudgetPeriod.YEARLY, label: t('budgetsNew.year') },
                      ].map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPeriod(p.value)}
                          className={clsx(
                            'py-2 text-sm font-medium rounded-lg transition-all',
                            period === p.value
                              ? 'bg-accent text-white shadow-sm'
                              : 'bg-elevated text-foreground-secondary hover:bg-surface',
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button variant="secondary" onClick={step === 'amount' ? () => setStep('category') : closeModal} className="flex-1">
                {step === 'amount' ? t('budgetsNew.back') : t('common.cancel')}
              </Button>
              {step === 'amount' && (
                <Button
                  onClick={handleCreate}
                  loading={createBudget.isPending}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1"
                >
                  {t('budgetsNew.createBudget')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
