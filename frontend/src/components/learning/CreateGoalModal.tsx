import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateGoal, useGeneratePlan } from '@/hooks/useLearning';
import type { DifficultyLevel } from '@/types/learning';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

/**
 * Modal for creating a new learning goal and triggering AI plan generation.
 */
export function CreateGoalModal({ isOpen, onClose, onCreated }: CreateGoalModalProps) {
  const { t } = useTranslation();
  const createGoal = useCreateGoal();
  const generatePlan = useGeneratePlan();

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [targetDate, setTargetDate] = useState('');
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [titleError, setTitleError] = useState('');

  const isLoading = createGoal.isPending || generatePlan.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(t('learning.createGoal.titleRequired'));
      return;
    }
    setTitleError('');

    try {
      const goal = await createGoal.mutateAsync({
        title: title.trim(),
        difficulty_level: difficulty,
        target_date: targetDate || '',
        minutes_per_day: minutesPerDay,
        days_per_week: daysPerWeek,
      });
      await generatePlan.mutateAsync(goal.id);
      toast.success(t('learning.createGoal.successToast'));
      onCreated(goal.id);
      handleClose();
    } catch {
      toast.error(t('learning.createGoal.errorToast'));
    }
  };

  const handleClose = () => {
    setTitle('');
    setDifficulty('intermediate');
    setTargetDate('');
    setMinutesPerDay(60);
    setDaysPerWeek(5);
    setTitleError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('learning.createGoal.title')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="create-goal-form"
            loading={isLoading}
          >
            {t('learning.createGoal.submit')}
          </Button>
        </>
      }
    >
      <form id="create-goal-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label={t('learning.createGoal.titleLabel')}
          placeholder={t('learning.createGoal.titlePlaceholder')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={titleError}
          required
          autoFocus
        />

        {/* Difficulty */}
        <div>
          <p className="block text-sm font-medium text-foreground mb-2">
            {t('learning.createGoal.difficultyLabel')}
          </p>
          <div className="flex gap-3">
            {difficulties.map(level => (
              <label
                key={level}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-sm text-foreground capitalize">
                  {t(`learning.difficulty.${level}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Target date */}
        <Input
          type="date"
          label={t('learning.createGoal.targetDateLabel')}
          value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Minutes per day */}
        <Input
          type="number"
          label={t('learning.createGoal.minutesPerDayLabel')}
          value={minutesPerDay}
          onChange={e => setMinutesPerDay(Number(e.target.value))}
          min={10}
          max={480}
        />

        {/* Days per week */}
        <Input
          type="number"
          label={t('learning.createGoal.daysPerWeekLabel')}
          value={daysPerWeek}
          onChange={e => setDaysPerWeek(Number(e.target.value))}
          min={1}
          max={7}
        />
      </form>
    </Modal>
  );
}
