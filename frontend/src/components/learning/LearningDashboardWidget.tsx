import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, GraduationCap } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakBadge } from './StreakBadge';
import { ProgressBar } from './ProgressBar';
import { useGoals } from '@/hooks/useLearning';

/**
 * Dashboard widget for the learning module.
 * Self-contained — fetches its own data.
 * Shows active goal progress or empty state CTA.
 */
export function LearningDashboardWidget() {
  const { t } = useTranslation();
  const { data: goalsData, isLoading } = useGoals();

  // Extract goals array from response
  const goals = goalsData?.results ?? goalsData ?? [];
  const goalsList = Array.isArray(goals) ? goals : [];
  const activeGoal = goalsList.find((g: any) => g.status === 'active');

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-foreground/10 rounded" />
          <div className="h-5 w-3/4 bg-foreground/10 rounded" />
          <div className="h-2 w-full bg-foreground/10 rounded-full" />
          <div className="h-8 w-full bg-foreground/10 rounded" />
        </div>
      </Card>
    );
  }

  if (!activeGoal) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <BookOpen className="w-8 h-8 text-foreground-secondary opacity-50" />
        <div>
          <p className="text-sm font-medium text-foreground">{t('learning.widget.emptyTitle')}</p>
          <p className="text-xs text-foreground-secondary mt-0.5">{t('learning.widget.emptySubtitle')}</p>
        </div>
        <Link to="/learning">
          <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
            {t('learning.widget.startLearning')}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <CardHeader
        title={t('learning.widget.label')}
        action={
          <Link to="/learning" className="text-xs text-accent hover:underline flex items-center gap-0.5">
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />

      {/* Active goal */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GraduationCap className="w-4 h-4 text-accent flex-shrink-0" />
            <h3 className="text-sm font-semibold text-foreground truncate">{activeGoal.title}</h3>
          </div>
          {activeGoal.current_streak > 0 && <StreakBadge streak={activeGoal.current_streak} />}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-foreground-secondary mb-1">
            <span>{activeGoal.completed_modules_count ?? 0}/{activeGoal.modules_count ?? 0} {t('learning.plan.modules')}</span>
            <span>{activeGoal.progress_percent ?? 0}%</span>
          </div>
          <ProgressBar
            value={activeGoal.completed_tasks ?? 0}
            max={Math.max(activeGoal.total_tasks ?? 1, 1)}
            size="sm"
          />
        </div>

        {/* Today info */}
        {activeGoal.today_tasks_count > 0 && (
          <p className="text-xs text-foreground-secondary">
            📋 {activeGoal.today_tasks_count} {t('learning.widget.todayTasks')}
          </p>
        )}

        {/* CTA */}
        <Link to={`/learning/${activeGoal.id}`}>
          <Button size="sm" className="w-full" variant="secondary">
            {t('learning.widget.continue')}
          </Button>
        </Link>
      </div>

      {/* Other active goals count */}
      {goalsList.filter((g: any) => g.status === 'active').length > 1 && (
        <Link to="/learning" className="block text-center mt-3">
          <span className="text-xs text-foreground-tertiary hover:text-accent">
            +{goalsList.filter((g: any) => g.status === 'active').length - 1} {t('learning.goals')}
          </span>
        </Link>
      )}
    </Card>
  );
}
