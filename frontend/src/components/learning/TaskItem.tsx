import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ExternalLink, HelpCircle, SkipForward, Check, Lock } from 'lucide-react';
import type { LearningTask } from '@/types/learning';

interface TaskItemProps {
  task: LearningTask;
  onComplete: () => void;
  onSkip: () => void;
  onHelp: () => void;
  isCurrentModule: boolean;
}

const taskTypeIcon: Record<string, string> = {
  video: '📹',
  article: '📖',
  read: '📖',
  practice: '💻',
  quiz: '❓',
  project: '🏗',
  watch: '🎬',
};

/**
 * Single task row with visible action buttons.
 * Checkbox-style complete button, resource link, help, skip.
 */
export function TaskItem({ task, onComplete, onSkip, onHelp, isCurrentModule }: TaskItemProps) {
  const { t } = useTranslation();
  const isLocked = !isCurrentModule && task.status === 'todo';
  const isCompleted = task.status === 'completed';
  const isSkipped = task.status === 'skipped';
  const canAct = isCurrentModule && !isLocked && !isCompleted && !isSkipped;

  const handleOpenResource = () => {
    if (task.resource_url) {
      window.open(task.resource_url, '_blank', 'noopener,noreferrer');
    } else if (task.resource_query) {
      const q = encodeURIComponent(task.resource_query);
      window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isLocked && 'opacity-40',
        !isLocked && 'hover:bg-surface',
      )}
    >
      {/* Checkbox / status */}
      {isLocked ? (
        <div className="w-5 h-5 mt-0.5 flex items-center justify-center text-foreground-tertiary flex-shrink-0">
          <Lock className="w-3.5 h-3.5" />
        </div>
      ) : canAct ? (
        <button
          onClick={onComplete}
          className="w-5 h-5 mt-0.5 rounded border-2 border-border hover:border-success hover:bg-success/10 flex items-center justify-center transition-colors flex-shrink-0"
          title={t('learning.task.complete')}
        >
          {/* Empty checkbox — click to complete */}
        </button>
      ) : isCompleted ? (
        <div className="w-5 h-5 mt-0.5 rounded bg-success flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 mt-0.5 rounded border-2 border-foreground-tertiary flex items-center justify-center flex-shrink-0 opacity-50">
          <SkipForward className="w-3 h-3" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Type icon */}
          <span className="text-sm leading-none flex-shrink-0">
            {taskTypeIcon[task.task_type] ?? '📄'}
          </span>

          {/* Title */}
          <span
            className={clsx(
              'text-sm',
              isCompleted || isSkipped
                ? 'line-through text-foreground-tertiary'
                : isLocked
                  ? 'text-foreground-tertiary'
                  : 'text-foreground'
            )}
          >
            {task.title}
          </span>

          {/* Duration */}
          {task.estimated_minutes != null && (
            <span className="text-xs text-foreground-tertiary flex-shrink-0 tabular-nums ml-auto">
              {task.estimated_minutes} {t('learning.today.minutes')}
            </span>
          )}
        </div>

        {/* Action buttons — always visible for actionable tasks */}
        {canAct && (
          <div className="flex items-center gap-2 mt-2">
            {(task.resource_url || task.resource_query) && (
              <button
                onClick={handleOpenResource}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-foreground-secondary hover:text-accent hover:border-accent/30 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {t('learning.task.openResource')}
              </button>
            )}
            <button
              onClick={onHelp}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-foreground-secondary hover:text-accent hover:border-accent/30 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              {t('learning.task.help')}
            </button>
            <button
              onClick={onSkip}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-foreground-secondary hover:text-warning hover:border-warning/30 transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              {t('learning.task.skip')}
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-colors ml-auto"
            >
              <Check className="w-3 h-3" />
              {t('learning.task.complete')}
            </button>
          </div>
        )}

        {/* Rating stars for completed tasks */}
        {isCompleted && task.user_rating && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={clsx('text-xs', star <= task.user_rating! ? 'text-warning' : 'text-foreground-tertiary')}>
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
