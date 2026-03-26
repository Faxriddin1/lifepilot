import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Calendar, BookOpen, Trash2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StreakBadge } from './StreakBadge';
import { ProgressBar } from './ProgressBar';
import type { LearningGoal } from '@/types/learning';

interface GoalCardProps {
  goal: LearningGoal;
  onClick: () => void;
  onDelete?: (id: string) => void;
}

const statusBadgeClass: Record<string, string> = {
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  generating: 'bg-accent/10 text-accent',
  preview: 'bg-info/10 text-accent',
  completed: 'bg-success/10 text-success',
  draft: 'bg-surface text-foreground-secondary',
  abandoned: 'bg-danger/10 text-danger',
};

/**
 * Card component for displaying a learning goal in a list.
 * Includes delete button and status-based CTA.
 */
export function GoalCard({ goal, onClick, onDelete }: GoalCardProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusLabel: Record<string, string> = {
    active: t('learning.status.active'),
    paused: t('learning.status.paused'),
    generating: t('learning.status.generating'),
    preview: t('learning.status.preview'),
    completed: t('learning.status.completed'),
    draft: t('learning.status.draft'),
    abandoned: t('learning.status.abandoned'),
  };

  const modulesCount = goal.modules_count ?? 0;
  const completedModules = goal.completed_modules_count ?? 0;
  const progressPercent = goal.progress_percent ?? 0;

  const renderCTA = () => {
    switch (goal.status) {
      case 'active':
        return (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {t('learning.continue')}
          </Button>
        );
      case 'paused':
        return (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {t('learning.resume')}
          </Button>
        );
      case 'generating':
        return (
          <Button size="sm" variant="secondary" disabled icon={<Spinner size="sm" />}>
            {t('learning.status.generating')}
          </Button>
        );
      case 'preview':
        return (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {t('learning.planPreview.confirm')}
          </Button>
        );
      case 'completed':
        return (
          <span className="text-sm text-success font-medium">✅ {t('learning.status.completed')}</span>
        );
      default:
        return (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {t('learning.goalCard.open')}
          </Button>
        );
    }
  };

  return (
    <Card
      hover
      className="cursor-pointer relative"
      onClick={goal.status !== 'generating' ? onClick : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground truncate">{goal.title}</h3>
            {goal.current_streak > 0 && <StreakBadge streak={goal.current_streak} />}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
              statusBadgeClass[goal.status] ?? 'bg-surface text-foreground-secondary'
            )}
          >
            {statusLabel[goal.status] ?? goal.status}
          </span>
          {/* Menu button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-foreground-tertiary hover:text-foreground hover:bg-surface transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                <div className="absolute right-0 top-7 z-20 bg-background border border-border rounded-lg shadow-lg py-1 w-56 animate-fade-in">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-bg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('learning.delete')}
                    </button>
                  ) : (
                    <div className="px-3 py-3">
                      <p className="text-xs text-foreground-secondary mb-3">{t('learning.deleteConfirm')}</p>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            onDelete?.(goal.id);
                            setMenuOpen(false);
                            setConfirmDelete(false);
                          }}
                        >
                          {t('learning.delete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setConfirmDelete(false); setMenuOpen(false); }}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={goal.completed_tasks ?? 0}
        max={Math.max(goal.total_tasks ?? 1, 1)}
        size="sm"
        className="mb-3"
      />

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-foreground-secondary mb-4">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {completedModules}/{modulesCount} {t('learning.plan.modules')}
        </span>
        {goal.target_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(goal.target_date).toLocaleDateString()}
          </span>
        )}
        <span className="ml-auto tabular-nums">{progressPercent}%</span>
      </div>

      {/* CTA */}
      <div className="flex justify-end">{renderCTA()}</div>
    </Card>
  );
}
