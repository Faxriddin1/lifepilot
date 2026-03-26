import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useTodayTasks, useCompleteTask } from '@/hooks/useLearning';
import { Spinner } from '@/components/ui/Spinner';
import type { LearningTaskType } from '@/types/learning';

interface TodayChecklistProps {
  goalId: string;
  goalTitle: string;
}

const taskTypeIcon: Record<LearningTaskType, string> = {
  video: '📹',
  article: '📖',
  practice: '💻',
  quiz: '❓',
  project: '🏗',
};

/**
 * Checklist of today's learning tasks for a goal with completion summary.
 */
export function TodayChecklist({ goalId, goalTitle }: TodayChecklistProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useTodayTasks(goalId);
  const completeTask = useCompleteTask();

  const tasks: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const totalMinutes = tasks.reduce((s: number, t: any) => s + (t.estimated_minutes ?? 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="text-sm text-foreground-secondary text-center py-4">
        {t('learning.today.noTasks')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Goal title */}
      <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
        {goalTitle}
      </p>

      {/* Task list */}
      {tasks.map((task: any) => {
        const isCompleted = task.status === 'completed';
        const isPending = completeTask.isPending && completeTask.variables === task.id;

        return (
          <label
            key={task.id}
            className={clsx(
              'flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-fast',
              isCompleted ? 'opacity-60' : 'hover:bg-surface'
            )}
          >
            <input
              type="checkbox"
              checked={isCompleted}
              disabled={isCompleted || isPending}
              onChange={() => {
                if (!isCompleted) completeTask.mutate(task.id);
              }}
              className="accent-[var(--color-accent)] w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm flex-shrink-0">
              {taskTypeIcon[task.task_type as LearningTaskType] ?? '📄'}
            </span>
            <span
              className={clsx(
                'text-sm flex-1 truncate',
                isCompleted ? 'line-through text-foreground-secondary' : 'text-foreground'
              )}
            >
              {task.title}
            </span>
            {task.estimated_minutes != null && (
              <span className="text-xs text-foreground-secondary whitespace-nowrap tabular-nums">
                {task.estimated_minutes}m
              </span>
            )}
          </label>
        );
      })}

      {/* Summary */}
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-1 text-xs text-foreground-secondary">
        <span>
          {t('learning.today.summary', { completed: completedCount, total: totalTasks })}
        </span>
        <span className="mx-1">|</span>
        <span>{t('learning.today.minutes', { count: totalMinutes })}</span>
      </div>
    </div>
  );
}
