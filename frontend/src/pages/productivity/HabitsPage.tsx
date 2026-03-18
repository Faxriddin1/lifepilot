import { useState, useEffect } from 'react';
import { Plus, Flame, Check, Circle, Repeat } from 'lucide-react';
import clsx from 'clsx';
import { format, subDays } from 'date-fns';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHabitsQuery, useCreateHabit, useLogHabit } from '@/hooks/useFocus';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';

const HABIT_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706', '#0891b2', '#be185d'];

/** Страница трекера привычек с недельной сеткой отметок и серией выполнений. */
export function HabitsPage() {
  const { data: habits, isLoading } = useHabitsQuery();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const { t } = useTranslation();

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE'),
      short: format(date, 'd'),
    };
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createHabit.mutate(
      { name: name.trim(), description, color },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setDescription('');
        },
      }
    );
  };

  const handleToggle = (habitId: string, date: string) => {
    logHabit.mutate({ habitId, data: { date, count: 1 } });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{habits?.length ?? 0} {t('habitsPage.habitsTracked')}</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('habitsPage.addHabit')}
        </Button>
      </div>

      {!habits || habits.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" />}
          title={t('habitsPage.noHabits')}
          description={t('habitsPage.noHabitsDesc')}
          actionLabel={t('habitsPage.addHabit')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {/* Header with day labels */}
          <div className="flex items-center gap-3 px-5 py-2">
            <div className="w-8" />
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {last7Days.map((day) => (
                <div key={day.date} className="w-9 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">{day.label}</p>
                  <p className="text-xs text-gray-500">{day.short}</p>
                </div>
              ))}
            </div>
            <div className="w-16" />
          </div>

          {habits.map((habit) => (
            <Card key={habit.id} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                <Repeat className="w-4 h-4" style={{ color: habit.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {habit.name}
                </p>
                {habit.description && (
                  <p className="text-xs text-gray-500 truncate">{habit.description}</p>
                )}
              </div>

              <div className="flex gap-1.5">
                {last7Days.map((day) => {
                  const isToday = day.date === format(today, 'yyyy-MM-dd');
                  return (
                    <button
                      key={day.date}
                      onClick={() => handleToggle(habit.id, day.date)}
                      className={clsx(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                        isToday && 'ring-2 ring-primary-200 dark:ring-primary-800',
                        'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-300 dark:text-gray-600'
                      )}
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              <div className="w-16 flex items-center justify-end gap-1">
                <Flame className="w-4 h-4 text-warning-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {habit.current_streak}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('habitsPage.newHabit')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} loading={createHabit.isPending}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('habitsPage.habitName')}
            placeholder={t('habitsPage.habitPlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('habitsPage.description')}
            placeholder={t('habitsPage.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('habitsPage.color')}
            </label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
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
    </div>
  );
}
