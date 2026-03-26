import { useTranslation } from 'react-i18next';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { LearningTaskType } from '@/types/learning';

interface PlanPreviewProps {
  plan: any;
  onConfirm: () => void;
  onRegenerate: () => void;
  loading: boolean;
}

const taskTypeIcon: Record<LearningTaskType, string> = {
  video: '📹',
  article: '📖',
  practice: '💻',
  quiz: '❓',
  project: '🏗',
};

/**
 * Displays the AI-generated plan tree (modules → tasks) before confirmation.
 */
export function PlanPreview({ plan, onConfirm, onRegenerate, loading }: PlanPreviewProps) {
  const { t } = useTranslation();

  const modules: any[] = Array.isArray(plan?.modules) ? plan.modules : [];

  const totalMinutes = modules.reduce((acc: number, mod: any) => {
    const tasks: any[] = Array.isArray(mod.tasks) ? mod.tasks : [];
    return acc + tasks.reduce((s: number, task: any) => s + (task.estimated_minutes ?? task.duration_minutes ?? 0), 0);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-foreground-secondary">
        <Clock className="w-4 h-4" />
        <span>{t('learning.planPreview.totalHours', { hours: totalHours })}</span>
        <span className="mx-1">·</span>
        <span>{t('learning.planPreview.modulesCount', { count: modules.length })}</span>
      </div>

      {/* Module tree */}
      <div className="space-y-3">
        {modules.map((mod: any, modIdx: number) => {
          const tasks: any[] = Array.isArray(mod.tasks) ? mod.tasks : [];
          return (
            <div key={mod.id ?? modIdx} className="border border-border rounded-lg overflow-hidden">
              {/* Module header */}
              <div className="bg-surface px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {modIdx + 1}. {mod.title}
                </span>
                <span className="text-xs text-foreground-secondary">
                  {tasks.length} {t('learning.planPreview.tasks')}
                </span>
              </div>

              {/* Tasks */}
              {tasks.length > 0 && (
                <ul className="divide-y divide-border">
                  {tasks.map((task: any, taskIdx: number) => (
                    <li key={task.id ?? taskIdx} className="px-4 py-2 flex items-center gap-2">
                      <span className="text-base leading-none flex-shrink-0">
                        {taskTypeIcon[(task.task_type ?? task.type) as LearningTaskType] ?? '📄'}
                      </span>
                      <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                      {(task.estimated_minutes ?? task.duration_minutes) != null && (
                        <span className="text-xs text-foreground-secondary whitespace-nowrap">
                          {task.estimated_minutes ?? task.duration_minutes} {t('learning.planPreview.min')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={onRegenerate}
          loading={loading}
        >
          {t('learning.planPreview.regenerate')}
        </Button>
        <Button
          variant="primary"
          icon={<CheckCircle className="w-4 h-4" />}
          onClick={onConfirm}
          loading={loading}
        >
          {t('learning.planPreview.confirm')}
        </Button>
      </div>
    </div>
  );
}
