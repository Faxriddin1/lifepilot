import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useGoals, useDeleteGoal } from '@/hooks/useLearning';
import { GoalCard } from '@/components/learning/GoalCard';
import { CreateGoalModal } from '@/components/learning/CreateGoalModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { LearningGoal } from '@/types/learning';

/** Main learning page — lists all learning goals or shows an empty state. Route: /learning */
export function LearningPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  function handleGoalCreated(id: string) {
    setIsCreateOpen(false);
    navigate(`/learning/${id}`);
  }

  function handleDeleteGoal(id: string) {
    deleteGoal.mutate(id, {
      onSuccess: () => toast.success(t('common.deleted')),
      onError: () => toast.error(t('errors.generic')),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {t('learning.title')}
        </h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-foreground-inverse transition-opacity hover:opacity-90 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          {t('learning.newGoal')}
        </button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {/* Goal grid */}
      {!isLoading && goals && goals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((goal: LearningGoal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate(`/learning/${goal.id}`)}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!goals || goals.length === 0) && (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-foreground-tertiary" />}
          title={t('learning.emptyTitle')}
          description={t('learning.emptyDescription')}
          actionLabel={t('learning.startLearning')}
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Create goal modal */}
      <CreateGoalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleGoalCreated}
      />
    </div>
  );
}
