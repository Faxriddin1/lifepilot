import { useState, useEffect } from 'react';
import { Plus, Target, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGoals, useCreateGoal, useContributeGoal } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { CreateGoalData } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useUiStore } from '@/store/uiStore';

const GOAL_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

/** Страница финансовых целей с кольцевым прогрессом накоплений и дедлайнами. */
export function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const contributeGoal = useContributeGoal();

  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const { t } = useTranslation();
  const isRu = t('common.save') === 'Сохранить';

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const handleCreate = () => {
    if (!name.trim() || !targetAmount) return;
    const data: CreateGoalData = {
      name: name.trim(),
      description,
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
      color,
    };
    createGoal.mutate(data, {
      onSuccess: () => {
        setShowModal(false);
        setName('');
        setDescription('');
        setTargetAmount('');
        setDeadline('');
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
        <p className="text-sm text-gray-500">{goals?.length ?? 0} {t('goalsPage.savingsGoals')}</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('goalsPage.addGoal')}
        </Button>
      </div>

      {!goals || goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title={t('goalsPage.noGoals')}
          description={t('goalsPage.noGoalsDesc')}
          actionLabel={t('goalsPage.createGoal')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct =
              goal.target_amount > 0
                ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                : 0;

            // SVG ring
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (pct / 100) * circumference;

            return (
              <Card key={goal.id}>
                <div className="flex items-start gap-4">
                  {/* Progress ring */}
                  <div className="relative flex-shrink-0">
                    <svg width="96" height="96" className="-rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className="text-gray-200 dark:text-gray-800"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke={goal.color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {goal.name}
                      </h3>
                      {goal.is_completed && (
                        <Badge variant="success" size="sm">
                            {t('goalsPage.completed')}
                        </Badge>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-500 truncate mb-2">{goal.description}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('goalsPage.saved')}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(goal.current_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('goalsPage.target')}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(goal.deadline, 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3 w-full"
                      disabled={goal.is_completed}
                      onClick={() => {
                        setContributeGoalId(goal.id);
                        setContributeAmount('');
                      }}
                    >
                      {t('goalsPage.contribute')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('goalsPage.newGoal')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} loading={createGoal.isPending}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('goalsPage.goalName')}
            placeholder={t('goalsPage.goalPlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('goalsPage.description')}
            placeholder={t('goalsPage.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label={t('goalsPage.targetAmount')}
            type="number"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            step="0.01"
            min="0"
          />
          <Input
            label={t('goalsPage.deadline')}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('goalsPage.color')}
            </label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    color === c
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        title={isRu ? 'Пополнить цель' : 'Contribute to Goal'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setContributeGoalId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const amt = parseFloat(contributeAmount);
                if (!amt || amt <= 0 || !contributeGoalId) return;
                contributeGoal.mutate(
                  { goalId: contributeGoalId, amount: amt },
                  { onSuccess: () => setContributeGoalId(null) },
                );
              }}
              loading={contributeGoal.isPending}
              disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}
            >
              {isRu ? 'Пополнить' : 'Contribute'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {isRu
              ? `Текущий прогресс: ${formatCurrency(goals?.find((g) => g.id === contributeGoalId)?.current_amount ?? 0)} / ${formatCurrency(goals?.find((g) => g.id === contributeGoalId)?.target_amount ?? 0)}`
              : `Current progress: ${formatCurrency(goals?.find((g) => g.id === contributeGoalId)?.current_amount ?? 0)} / ${formatCurrency(goals?.find((g) => g.id === contributeGoalId)?.target_amount ?? 0)}`}
          </p>
          <Input
            label={isRu ? 'Сумма пополнения' : 'Contribution amount'}
            type="number"
            placeholder="0.00"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            step="0.01"
            min="0"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
