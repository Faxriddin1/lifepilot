import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ChevronDown, Lock, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { ProgressBar } from './ProgressBar';
import type { LearningModule, LearningModuleStatus } from '@/types/learning';

interface ModuleAccordionProps {
  module: LearningModule;
  defaultOpen?: boolean;
  onTaskAction: (taskId: string, action: string) => void;
}

const statusIcon: Record<LearningModuleStatus, React.ReactNode> = {
  locked: <Lock className="w-4 h-4 text-foreground-tertiary" />,
  available: <Circle className="w-4 h-4 text-foreground-secondary" />,
  in_progress: <PlayCircle className="w-4 h-4 text-accent" />,
  completed: <CheckCircle className="w-4 h-4 text-success" />,
};

/**
 * Collapsible module accordion with status icon, progress, and task list.
 * Locked modules cannot be expanded.
 */
export function ModuleAccordion({ module, defaultOpen = false, onTaskAction }: ModuleAccordionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isLocked = module.status === 'locked';

  const toggle = () => {
    if (!isLocked) setIsOpen(prev => !prev);
  };

  const isCurrentModule = module.status === 'in_progress' || module.status === 'available';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        disabled={isLocked}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 bg-surface text-left transition-colors duration-fast',
          isLocked
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:bg-elevated cursor-pointer'
        )}
        aria-expanded={isOpen}
      >
        <span className="flex-shrink-0">{statusIcon[module.status]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{module.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ProgressBar
              value={module.completed_tasks_count}
              max={module.total_tasks_count}
              size="sm"
              className="w-24"
            />
            <span className="text-xs text-foreground-secondary whitespace-nowrap">
              {module.completed_tasks_count}/{module.total_tasks_count} {t('learning.module.tasks')}
            </span>
          </div>
        </div>

        {!isLocked && (
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-foreground-secondary flex-shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Task list */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {module.tasks.length > 0 ? (
          <div className="px-2 py-1 border-t border-border bg-background">
            {module.tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isCurrentModule={isCurrentModule}
                onComplete={() => onTaskAction(task.id, 'complete')}
                onSkip={() => onTaskAction(task.id, 'skip')}
                onHelp={() => onTaskAction(task.id, 'help')}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 text-sm text-foreground-secondary border-t border-border bg-background">
            {t('learning.module.noTasks')}
          </div>
        )}
      </div>
    </div>
  );
}
