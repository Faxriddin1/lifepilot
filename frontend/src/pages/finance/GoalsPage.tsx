import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Target, Calendar, Trash2, TrendingUp,
  Plane, Car, Home, GraduationCap, Laptop, Heart,
  Gift, Shield, Briefcase, Sparkles, PiggyBank,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGoals, useCreateGoal, useContributeGoal, useDeleteGoal } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { CreateGoalData } from '@/types';
import { useUiStore } from '@/store/uiStore';

/** Шаблоны целей с иконками и цветами. */
const GOAL_TEMPLATES = [
  { name_en: 'Vacation', name_ru: 'Отпуск', icon: Plane, color: 'var(--color-income)', emoji: '✈️' },
  { name_en: 'Car', name_ru: 'Автомобиль', icon: Car, color: 'var(--color-danger)', emoji: '🚗' },
  { name_en: 'House', name_ru: 'Жильё', icon: Home, color: 'var(--accent-brand)', emoji: '🏠' },
  { name_en: 'Education', name_ru: 'Обучение', icon: GraduationCap, color: 'var(--accent-brand)', emoji: '🎓' },
  { name_en: 'Gadget', name_ru: 'Техника', icon: Laptop, color: 'var(--accent-primary)', emoji: '💻' },
  { name_en: 'Health', name_ru: 'Здоровье', icon: Heart, color: 'var(--color-danger)', emoji: '❤️' },
  { name_en: 'Gift', name_ru: 'Подарок', icon: Gift, color: 'var(--color-warning)', emoji: '🎁' },
  { name_en: 'Emergency', name_ru: 'На экстренный случай', icon: Shield, color: 'var(--color-success)', emoji: '🛡️' },
  { name_en: 'Business', name_ru: 'Бизнес', icon: Briefcase, color: 'var(--color-success)', emoji: '💼' },
  { name_en: 'Other', name_ru: 'Другое', icon: Sparkles, color: 'var(--text-secondary)', emoji: '✨' },
];

const QUICK_AMOUNTS = [50, 100, 500, 1000, 5000];

/** Страница финансовых целей с шаблонами, кольцевым прогрессом и пополнением. */
export function GoalsPage() {
  const { t } = useTranslation();
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const contributeGoal = useContributeGoal();
  const deleteGoal = useDeleteGoal();

  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof GOAL_TEMPLATES[0] | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('var(--color-income)');

  // Contribute modal state
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const handleSelectTemplate = (tmpl: typeof GOAL_TEMPLATES[0]) => {
    setSelectedTemplate(tmpl);
    setName(t(`goalTemplates.${tmpl.name_en.toLowerCase()}`));
    setColor(tmpl.color);
    setStep('details');
  };

  const handleCreate = () => {
    if (!name.trim() || !targetAmount) return;
    const data: CreateGoalData = {
      name: name.trim(),
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
      color,
    };
    createGoal.mutate(data, { onSuccess: closeModal });
  };

  const closeModal = () => {
    setShowModal(false);
    setStep('template');
    setSelectedTemplate(null);
    setName('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleContribute = () => {
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0 || !contributeGoalId) return;
    contributeGoal.mutate(
      { goalId: contributeGoalId, amount: amt },
      { onSuccess: () => setContributeGoalId(null) },
    );
  };

  // Summary calculations
  const totalTarget = (goals ?? []).reduce((s, g) => s + parseFloat(String(g.target_amount || 0)), 0);
  const totalSaved = (goals ?? []).reduce((s, g) => s + parseFloat(String(g.current_amount || 0)), 0);
  const totalPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedCount = (goals ?? []).filter((g) => g.is_completed).length;

  const contributeGoalObj = (goals ?? []).find((g) => g.id === contributeGoalId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Summary */}
      {(goals ?? []).length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">{t('goalsNew.totalProgress')}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalSaved)} <span className="text-sm font-normal text-foreground-secondary">/ {formatCurrency(totalTarget)}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-foreground-secondary">{t('goalsNew.progress')}</p>
                <p className="text-lg font-bold text-income">{Math.round(totalPct)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-foreground-secondary">{t('goalsNew.completed')}</p>
                <p className="text-lg font-bold text-success">{completedCount}/{(goals ?? []).length}</p>
              </div>
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              {t('goalsPage.addGoal')}
            </Button>
          </div>
          {/* Overall progress bar */}
          <div className="mt-3 h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-income transition-all duration-500"
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {!goals || goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title={t('goalsPage.noGoals')}
          description={t('goalsPage.noGoalsDesc')}
          actionLabel={t('goalsPage.createGoal')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((goal) => {
            const target = parseFloat(String(goal.target_amount || 0));
            const current = parseFloat(String(goal.current_amount || 0));
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const remaining = target - current;

            // Monthly savings estimate
            let monthlyNeeded = 0;
            if (goal.deadline && remaining > 0) {
              const deadlineDate = new Date(goal.deadline);
              const now = new Date();
              const monthsLeft = Math.max(
                (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth()),
                1,
              );
              monthlyNeeded = remaining / monthsLeft;
            }

            // SVG ring
            const radius = 42;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (pct / 100) * circumference;

            return (
              <Card key={goal.id} className="group relative overflow-hidden">
                {/* Color accent */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: goal.color }} />

                <div className="pt-2">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-bold text-foreground">
                      {goal.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {goal.is_completed && (
                        <Badge variant="success" size="sm">✓ {t('goalsNew.done')}</Badge>
                      )}
                      <button
                        onClick={() => deleteGoal.mutate(goal.id)}
                        className="p-1 rounded text-foreground-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Ring + Stats */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <svg width="100" height="100" className="-rotate-90">
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-elevated" />
                        <circle cx="50" cy="50" r={radius} fill="none" stroke={goal.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-700" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground">{Math.round(pct)}%</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div>
                        <p className="text-xs text-foreground-secondary">{t('goalsNew.saved')}</p>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-secondary">{t('goalsNew.target')}</p>
                        <p className="text-sm text-foreground-secondary">{formatCurrency(target)}</p>
                      </div>
                      {remaining > 0 && (
                        <p className="text-xs text-foreground-secondary">
                          {t('goalsNew.left')}: <span className="font-medium text-foreground">{formatCurrency(remaining)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-foreground-secondary">
                      {goal.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(goal.deadline, 'dd MMM yyyy')}
                        </span>
                      )}
                      {monthlyNeeded > 0 && (
                        <span className="block mt-0.5">
                          ~{formatCurrency(monthlyNeeded)}/{t('goalsNew.perMonth')}
                        </span>
                      )}
                    </div>
                    {!goal.is_completed && (
                      <Button
                        size="sm"
                        onClick={() => { setContributeGoalId(goal.id); setContributeAmount(''); }}
                      >
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        {t('goalsNew.addFunds')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal — 2-step */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {step === 'template' ? t('goalsNew.newGoal') : t('goalsNew.configureGoal')}
              </h2>
              <p className="text-sm text-foreground-secondary mt-0.5">
                {step === 'template'
                  ? t('goalsNew.pickTemplate')
                  : `${name}`}
              </p>
            </div>

            <div className="px-6 py-5">
              {step === 'template' ? (
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.name_en}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tmpl.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: tmpl.color }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {t(`goalTemplates.${tmpl.name_en.toLowerCase()}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected template */}
                  {selectedTemplate && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedTemplate.color}20` }}>
                        {(() => { const I = selectedTemplate.icon; return <I className="w-5 h-5" style={{ color: selectedTemplate.color }} />; })()}
                      </div>
                      <span className="font-medium text-foreground flex-1">{name}</span>
                      <button onClick={() => setStep('template')} className="text-xs text-accent">{t('goalsNew.change')}</button>
                    </div>
                  )}

                  <Input
                    label={t('goalsNew.goalName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={!selectedTemplate}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                      {t('goalsNew.targetAmount')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-foreground-secondary">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        autoFocus
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 text-xl font-bold rounded-xl border-2 border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-border-focus"
                      />
                    </div>
                  </div>

                  <Input
                    label={t('goalsNew.deadline')}
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button variant="secondary" onClick={step === 'details' ? () => setStep('template') : closeModal} className="flex-1">
                {step === 'details' ? t('goalsNew.back') : t('common.cancel')}
              </Button>
              {step === 'details' && (
                <Button onClick={handleCreate} loading={createGoal.isPending} disabled={!name.trim() || !targetAmount} className="flex-1">
                  {t('goalsNew.createGoal')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        title={t('goalsNew.contributeToGoal')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setContributeGoalId(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleContribute} loading={contributeGoal.isPending} disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}>
              {t('goalsNew.addFundsBig')}
            </Button>
          </>
        }
      >
        {contributeGoalObj && (
          <div className="space-y-4">
            {/* Current progress */}
            <div className="text-center p-4 rounded-xl bg-surface">
              <p className="text-sm text-foreground-secondary">{t('goalsNew.currentProgress')}</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(parseFloat(String(contributeGoalObj.current_amount)))} / {formatCurrency(parseFloat(String(contributeGoalObj.target_amount)))}
              </p>
              <div className="mt-2 h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((parseFloat(String(contributeGoalObj.current_amount)) / parseFloat(String(contributeGoalObj.target_amount))) * 100, 100)}%`,
                    backgroundColor: contributeGoalObj.color,
                  }}
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setContributeAmount(String(amt))}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg border transition-all font-medium',
                    contributeAmount === String(amt)
                      ? 'bg-accent text-white border-accent'
                      : 'border-border text-foreground-secondary hover:border-accent/50',
                  )}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-foreground-secondary">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                autoFocus
                step="0.01"
                min="0"
                className="w-full pl-10 pr-4 py-3 text-lg font-bold rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
