import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  useGoal,
  useGoalStatus,
  useGeneratePlan,
  useConfirmPlan,
  useCompleteTask,
  useSkipTask,
  useRequestAdapt,
  usePauseGoal,
  useResumeGoal,
} from '@/hooks/useLearning';
import { GeneratingOverlay } from '@/components/learning/GeneratingOverlay';
import { PlanPreview } from '@/components/learning/PlanPreview';
import { ModuleAccordion } from '@/components/learning/ModuleAccordion';
import { StreakBadge } from '@/components/learning/StreakBadge';
import type { LearningModule } from '@/types/learning';
import { TutorChat } from '@/components/learning/TutorChat';
import { Skeleton } from '@/components/ui/Skeleton';

/** Detail page for a single learning goal. Handles generating / preview / active states. Route: /learning/:id */
export function LearningDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tutorChatOpen, setTutorChatOpen] = useState(false);
  const [activeTutorTaskId, setActiveTutorTaskId] = useState<string | null>(null);

  const { data: goal, isLoading } = useGoal(id!);

  // Poll every 3 seconds when generating
  useGoalStatus(id!, goal?.status === 'generating');

  const generatePlan = useGeneratePlan();
  const confirmPlan = useConfirmPlan();
  const completeTask = useCompleteTask();
  const skipTask = useSkipTask();
  const requestAdapt = useRequestAdapt();
  const pauseGoal = usePauseGoal();
  const resumeGoal = useResumeGoal();

  function handleConfirmPlan() {
    if (!id) return;
    confirmPlan.mutate({ id }, {
      onSuccess: () => toast.success(t('learning.planConfirmed')),
      onError: () => toast.error(t('learning.planConfirmError')),
    });
  }

  function handleRegenerate() {
    if (!id) return;
    generatePlan.mutate(id, {
      onSuccess: () => toast.success(t('learning.regenerating')),
      onError: () => toast.error(t('learning.regenerateError')),
    });
  }

  function handleCompleteTask(taskId: string) {
    completeTask.mutate(taskId, {
      onSuccess: () => toast.success(t('learning.taskCompleted')),
      onError: () => toast.error(t('learning.taskCompleteError')),
    });
  }

  function handleSkipTask(taskId: string) {
    skipTask.mutate(taskId, {
      onError: () => toast.error(t('learning.taskSkipError')),
    });
  }

  function handleNeedHelp(taskId: string) {
    setActiveTutorTaskId(taskId);
    setTutorChatOpen(true);
  }

  function handleTooEasy() {
    if (!id) return;
    requestAdapt.mutate({ goalId: id, reason: 'easier' }, {
      onSuccess: () => toast.success(t('learning.adaptRequested')),
      onError: () => toast.error(t('learning.adaptError')),
    });
  }

  function handleTooHard() {
    if (!id) return;
    requestAdapt.mutate({ goalId: id, reason: 'harder' }, {
      onSuccess: () => toast.success(t('learning.adaptRequested')),
      onError: () => toast.error(t('learning.adaptError')),
    });
  }

  function handlePause() {
    if (!id) return;
    pauseGoal.mutate(id, {
      onSuccess: () => toast.success(t('learning.goalPaused')),
      onError: () => toast.error(t('learning.pauseError')),
    });
  }

  function handleResume() {
    if (!id) return;
    resumeGoal.mutate(id, {
      onSuccess: () => toast.success(t('learning.goalResumed')),
      onError: () => toast.error(t('learning.resumeError')),
    });
  }

  // Loading state
  if (isLoading || !goal) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  // A) Generating state
  if (goal.status === 'generating') {
    return <GeneratingOverlay title={goal.title} />;
  }

  // B) Preview state
  if (goal.status === 'preview') {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/learning')}
          className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('learning.backToGoals')}
        </button>

        <PlanPreview
          plan={goal.ai_generated_plan}
          onConfirm={handleConfirmPlan}
          onRegenerate={handleRegenerate}
          loading={confirmPlan.isPending || generatePlan.isPending}
        />
      </div>
    );
  }

  // C) Active / paused / completed state
  const isActive = goal.status === 'active';
  const isPaused = goal.status === 'paused';

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/learning')}
            className="flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('learning.backToGoals')}
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-foreground">{goal.title}</h1>
          {(goal.current_streak ?? goal.streak) > 0 && <StreakBadge streak={goal.current_streak ?? goal.streak ?? 0} />}
        </div>

        {/* Overall progress bar */}
        {(goal.progress_percent ?? goal.progress) !== undefined && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-slow"
                style={{ width: `${goal.progress_percent ?? goal.progress ?? 0}%` }}
              />
            </div>
            <span className="text-sm text-foreground-secondary tabular-nums whitespace-nowrap">
              {goal.progress_percent ?? goal.progress ?? 0}%
            </span>
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="flex flex-col gap-3">
        {goal.modules?.map((module: LearningModule, idx: number) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            defaultOpen={module.status === 'in_progress' || module.status === 'available' || idx === 0}
            onTaskAction={(taskId: string, action: string) => {
              if (action === 'complete') handleCompleteTask(taskId);
              else if (action === 'skip') handleSkipTask(taskId);
              else if (action === 'help') handleNeedHelp(taskId);
            }}
          />
        ))}
      </div>

      {/* Bottom action buttons (active goals only) */}
      {isActive && (
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleTooEasy}
            disabled={requestAdapt.isPending}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
          >
            {t('learning.tooEasy')}
          </button>
          <button
            onClick={handleTooHard}
            disabled={requestAdapt.isPending}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
          >
            {t('learning.tooHard')}
          </button>
          <button
            onClick={handlePause}
            disabled={pauseGoal.isPending}
            className="ml-auto rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
          >
            {t('learning.pause')}
          </button>
        </div>
      )}

      {/* Resume button for paused goals */}
      {isPaused && (
        <div className="flex pt-2">
          <button
            onClick={handleResume}
            disabled={resumeGoal.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-foreground-inverse transition-opacity hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
          >
            {t('learning.resume')}
          </button>
        </div>
      )}

      {/* Tutor chat side panel */}
      <TutorChat
        goalId={id!}
        taskId={activeTutorTaskId ?? undefined}
        isOpen={tutorChatOpen}
        onClose={() => {
          setTutorChatOpen(false);
          setActiveTutorTaskId(null);
        }}
      />
    </div>
  );
}
