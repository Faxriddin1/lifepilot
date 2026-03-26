import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Flame, Check, Circle, Repeat, MoreHorizontal, Trash2, PenTool,
  Droplets, BookOpen, Dumbbell, Moon, Apple, Brain, Heart, Music,
  Sun, Pill, Smile, Code, Footprints, Cigarette, Coffee, Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHabitsQuery, useCreateHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/useFocus';
import { useUiStore } from '@/store/uiStore';
import { productivityApi } from '@/api/productivity';

const HABIT_COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#4f46e5', '#059669', '#ea580c',
];

const HABIT_ICONS = [
  { icon: Repeat, name: 'repeat' },
  { icon: Droplets, name: 'water' },
  { icon: BookOpen, name: 'read' },
  { icon: Dumbbell, name: 'exercise' },
  { icon: Moon, name: 'sleep' },
  { icon: Apple, name: 'nutrition' },
  { icon: Brain, name: 'meditate' },
  { icon: Heart, name: 'health' },
  { icon: Music, name: 'music' },
  { icon: Sun, name: 'morning' },
  { icon: Pill, name: 'vitamins' },
  { icon: Smile, name: 'gratitude' },
  { icon: Code, name: 'coding' },
  { icon: Footprints, name: 'walk' },
  { icon: Coffee, name: 'no-coffee' },
  { icon: Clock, name: 'routine' },
];

interface HabitTemplate {
  name_ru: string;
  name_en: string;
  name_uz: string;
  name_uz_cyr: string;
  icon: string;
  color: string;
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  { name_ru: 'Пить воду', name_en: 'Drink water', name_uz: 'Suv ichish', name_uz_cyr: 'Сув ичиш', icon: 'water', color: '#0891b2' },
  { name_ru: 'Читать 30 мин', name_en: 'Read 30 min', name_uz: "30 min o'qish", name_uz_cyr: '30 мин ўқиш', icon: 'read', color: '#7c3aed' },
  { name_ru: 'Тренировка', name_en: 'Workout', name_uz: 'Mashq', name_uz_cyr: 'Машқ', icon: 'exercise', color: '#dc2626' },
  { name_ru: 'Сон 8 часов', name_en: 'Sleep 8 hours', name_uz: '8 soat uxlash', name_uz_cyr: '8 соат ухлаш', icon: 'sleep', color: '#4f46e5' },
  { name_ru: 'Здоровое питание', name_en: 'Eat healthy', name_uz: "Sog'lom ovqatlanish", name_uz_cyr: 'Соғлом овқатланиш', icon: 'nutrition', color: '#16a34a' },
  { name_ru: 'Медитация', name_en: 'Meditate', name_uz: 'Meditatsiya', name_uz_cyr: 'Медитация', icon: 'meditate', color: '#d97706' },
  { name_ru: 'Утренняя зарядка', name_en: 'Morning exercise', name_uz: 'Ertalabki mashq', name_uz_cyr: 'Эрталабки машқ', icon: 'morning', color: '#ea580c' },
  { name_ru: 'Благодарность', name_en: 'Gratitude journal', name_uz: 'Minnatdorlik', name_uz_cyr: 'Миннатдорлик', icon: 'gratitude', color: '#be185d' },
  { name_ru: 'Прогулка', name_en: 'Walk 10K steps', name_uz: "10K qadam yurish", name_uz_cyr: '10К қадам юриш', icon: 'walk', color: '#059669' },
  { name_ru: 'Кодинг 1 час', name_en: 'Code 1 hour', name_uz: '1 soat kod yozish', name_uz_cyr: '1 соат код ёзиш', icon: 'coding', color: '#2563eb' },
  { name_ru: 'Витамины', name_en: 'Take vitamins', name_uz: 'Vitamin ichish', name_uz_cyr: 'Витамин ичиш', icon: 'vitamins', color: '#7c3aed' },
  { name_ru: 'Без кофе', name_en: 'No coffee', name_uz: 'Qahvasiz', name_uz_cyr: 'Қаҳвасиз', icon: 'no-coffee', color: '#d97706' },
];

function getIconComponent(iconName: string) {
  return HABIT_ICONS.find((i) => i.name === iconName)?.icon || Repeat;
}

/** Страница трекера привычек с шаблонами, иконками и недельной сеткой. */
export function HabitsPage() {
  const { data: habits, isLoading } = useHabitsQuery();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const [editingHabit, setEditingHabit] = useState<{ id: string; name: string; description: string; color: string; icon: string } | null>(null);
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'templates' | 'target' | 'custom'>('templates');
  const [pendingTemplate, setPendingTemplate] = useState<HabitTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('repeat');
  const [targetDays, setTargetDays] = useState(30);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Completed dates per habit (loaded from server)
  const [completedMap, setCompletedMap] = useState<Record<string, Set<string>>>({});
  // Local overrides (updated from toggle response)
  const [streakMap, setStreakMap] = useState<Record<string, number>>({});
  const [progressMap, setProgressMap] = useState<Record<string, { completed_days: number; progress: number }>>({});
  // Track which habit IDs we've loaded logs for
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  const today = new Date();
  // Current week Mon-Sun
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const dateFrom = format(weekStart, 'yyyy-MM-dd');
  const dateTo = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  // Load logs for habits we haven't loaded yet
  useEffect(() => {
    if (!habits || habits.length === 0) return;
    const newHabits = habits.filter((h) => !loadedIds.has(h.id));
    if (newHabits.length === 0) return;

    const loadLogs = async () => {
      const newMap: Record<string, Set<string>> = { ...completedMap };
      for (const habit of newHabits) {
        const logs = await productivityApi.getHabitLogs(habit.id, { date_from: dateFrom, date_to: dateTo });
        newMap[habit.id] = new Set(logs.map((l) => l.date));
      }
      setCompletedMap(newMap);
      setLoadedIds((prev) => {
        const updated = new Set(prev);
        newHabits.forEach((h) => updated.add(h.id));
        return updated;
      });
    };
    loadLogs();
  }, [habits, loadedIds, dateFrom, dateTo]);

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const last7Days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i); // Mon(0) to Sun(6)
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE'),
        short: format(date, 'd'),
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      };
    }), []);

  const getTemplateName = (tmpl: HabitTemplate) => {
    if (lang === 'ru') return tmpl.name_ru;
    if (lang === 'uz') return tmpl.name_uz;
    if (lang === 'uz-cyr') return tmpl.name_uz_cyr;
    return tmpl.name_en;
  };

  const handleCreateFromTemplate = (tmpl: HabitTemplate) => {
    setPendingTemplate(tmpl);
    setName(getTemplateName(tmpl));
    setColor(tmpl.color);
    setSelectedIcon(tmpl.icon);
    setTargetDays(30);
    setMode('target');
  };

  const confirmCreateFromTemplate = () => {
    if (!pendingTemplate) return;
    createHabit.mutate(
      { name: getTemplateName(pendingTemplate), description: '', color: pendingTemplate.color, icon: pendingTemplate.icon, target_days: targetDays },
      { onSuccess: () => { closeModal(); } },
    );
  };

  const handleCreateCustom = () => {
    if (!name.trim()) return;
    const habitData = { name: name.trim(), description, color, icon: selectedIcon, target_days: targetDays };

    if (editingHabit) {
      updateHabit.mutate(
        { id: editingHabit.id, data: habitData },
        { onSuccess: () => { closeModal(); } },
      );
    } else {
      createHabit.mutate(habitData, { onSuccess: () => { closeModal(); } });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHabit(null);
    setPendingTemplate(null);
    setName('');
    setDescription('');
    setTargetDays(30);
    setMode('templates');
  };

  const handleToggle = async (habitId: string, date: string) => {
    // Optimistic UI update
    setCompletedMap((prev) => {
      const updated = { ...prev };
      const dates = new Set(prev[habitId] || []);
      if (dates.has(date)) {
        dates.delete(date);
      } else {
        dates.add(date);
      }
      updated[habitId] = dates;
      return updated;
    });

    // Send to server and update streak from response
    try {
      const result = await productivityApi.toggleHabitLog(habitId, date);
      setStreakMap((prev) => ({ ...prev, [habitId]: result.current_streak }));
      setProgressMap((prev) => ({ ...prev, [habitId]: { completed_days: result.completed_days, progress: result.progress } }));
    } catch {
      // Revert on error
      setCompletedMap((prev) => {
        const updated = { ...prev };
        const dates = new Set(prev[habitId] || []);
        if (dates.has(date)) {
          dates.delete(date);
        } else {
          dates.add(date);
        }
        updated[habitId] = dates;
        return updated;
      });
    }
  };

  const openModal = () => {
    setMode('templates');
    setShowModal(true);
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
        <p className="text-sm text-foreground-secondary">{habits?.length ?? 0} {t('habitsPage.habitsTracked')}</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openModal}>
          {t('habitsPage.addHabit')}
        </Button>
      </div>

      {!habits || habits.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" />}
          title={t('habitsPage.noHabits')}
          description={t('habitsPage.noHabitsDesc')}
          actionLabel={t('habitsPage.addHabit')}
          onAction={openModal}
        />
      ) : (
        <div className="space-y-3">
          {/* Day headers */}
          <div className="flex items-center gap-3 px-5 py-2">
            <div className="w-8" />
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {last7Days.map((day) => (
                <div key={day.date} className="w-9 text-center">
                  <p className={clsx('text-[10px] font-medium', day.isToday ? 'text-accent' : 'text-foreground-tertiary')}>{day.label}</p>
                  <p className={clsx('text-xs', day.isToday ? 'text-accent font-bold' : 'text-foreground-secondary')}>{day.short}</p>
                </div>
              ))}
            </div>
            <div className="w-16" />
          </div>

          {/* Habit rows */}
          {habits.map((habit) => {
            const HabitIcon = getIconComponent(habit.icon || 'repeat');
            const completedDates = completedMap[habit.id] || new Set();
            const localProgress = progressMap[habit.id];
            const completedDaysCount = localProgress?.completed_days ?? habit.completed_days ?? 0;
            const progressPct = localProgress?.progress ?? habit.progress ?? 0;

            return (
              <Card key={habit.id} className="group relative">
                <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${habit.color}20` }}
                >
                  <HabitIcon className="w-4 h-4" style={{ color: habit.color }} />
                </div>

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(progressPct, progressPct > 0 ? 2 : 0)}%`, backgroundColor: habit.color }}
                      />
                    </div>
                    <span className="text-[10px] text-foreground-secondary whitespace-nowrap">
                      {completedDaysCount}/{habit.target_days || 30} · {progressPct}%
                    </span>
                  </div>
                </div>

                {/* 7-day grid */}
                <div className="flex gap-1.5">
                  {last7Days.map((day) => {
                    const done = completedDates.has(day.date);
                    return (
                      <button
                        key={day.date}
                        onClick={() => handleToggle(habit.id, day.date)}
                        className={clsx(
                          'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                          day.isToday && 'ring-2 ring-border-focus',
                          done
                            ? 'text-white shadow-sm'
                            : 'bg-surface hover:bg-elevated text-foreground-tertiary',
                        )}
                        style={done ? { backgroundColor: habit.color } : {}}
                      >
                        {done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Streak */}
                <div className="w-16 flex items-center justify-end gap-1">
                  <Flame className="w-4 h-4 text-warning" />
                  <span className="text-sm font-semibold text-foreground">
                    {streakMap[habit.id] ?? habit.current_streak ?? 0}
                  </span>
                </div>

                {/* Context menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setContextMenu(contextMenu === habit.id ? null : habit.id)}
                    className="p-1 rounded-md hover:bg-surface"
                  >
                    <MoreHorizontal className="w-4 h-4 text-foreground-tertiary" />
                  </button>
                  {contextMenu === habit.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setContextMenu(null)} />
                      <div className="absolute right-0 top-7 z-20 bg-background rounded-lg shadow-lg border border-border py-1 w-36">
                        <button
                          onClick={() => {
                            setEditingHabit({ id: habit.id, name: habit.name, description: habit.description || '', color: habit.color, icon: habit.icon || 'repeat' });
                            setName(habit.name);
                            setDescription(habit.description || '');
                            setColor(habit.color);
                            setSelectedIcon(habit.icon || 'repeat');
                            setTargetDays(habit.target_days || 30);
                            setMode('custom');
                            setShowModal(true);
                            setContextMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface"
                        >
                          <PenTool className="w-4 h-4 text-accent" />
                          {t('habitsNew.edit')}
                        </button>
                        <button
                          onClick={() => {
                            deleteHabit.mutate(habit.id);
                            setContextMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-bg"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('habitsNew.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          editingHabit
            ? t('habitsNew.editHabit')
            : mode === 'target'
              ? t('habitsNew.setDuration')
              : t('habitsPage.newHabit')
        }
        footer={
          mode === 'target' ? (
            <>
              <Button variant="secondary" onClick={() => { setMode('templates'); setPendingTemplate(null); }}>
                {`← ${t('habitsNew.back')}`}
              </Button>
              <Button onClick={confirmCreateFromTemplate} loading={createHabit.isPending}>
                {t('common.create')}
              </Button>
            </>
          ) : mode === 'custom' ? (
          <>
            {!editingHabit && (
              <Button variant="secondary" onClick={() => setMode('templates')}>
                {`← ${t('habitsNew.back')}`}
              </Button>
            )}
            <Button onClick={handleCreateCustom} loading={createHabit.isPending || updateHabit.isPending} disabled={!name.trim()}>
              {editingHabit ? t('common.save') : t('common.create')}
            </Button>
          </>
        ) : undefined}
      >
        {mode === 'target' ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
              {(() => { const Icon = getIconComponent(selectedIcon); return <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}><Icon className="w-5 h-5" style={{ color }} /></div>; })()}
              <p className="text-sm font-semibold text-foreground">{name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('habitsNew.howManyDays')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 21, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTargetDays(d)}
                    className={clsx(
                      'py-3 rounded-xl text-sm font-semibold transition-all',
                      targetDays === d
                        ? 'bg-accent text-white shadow-md scale-105'
                        : 'bg-elevated text-foreground-secondary hover:bg-border',
                    )}
                  >
                    {d} {t('habitsNew.daysShort')}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-foreground-secondary">{t('habitsNew.orCustom')}:</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={targetDays}
                  onChange={(e) => setTargetDays(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center"
                />
                <span className="text-xs text-foreground-secondary">{t('habitsNew.days')}</span>
              </div>
            </div>
          </div>
        ) : mode === 'templates' ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              {t('habitsNew.choosePreset')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HABIT_TEMPLATES.map((tmpl) => {
                const Icon = getIconComponent(tmpl.icon);
                return (
                  <button
                    key={tmpl.name_en}
                    onClick={() => handleCreateFromTemplate(tmpl)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/10 transition-all text-left group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: tmpl.color }} />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {getTemplateName(tmpl)}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setMode('custom')}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-foreground-secondary hover:border-accent hover:text-accent hover:bg-accent/10 transition-all"
            >
              <PenTool className="w-4 h-4" />
              {t('habitsNew.createCustom')}
            </button>
          </div>
        ) : (
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

            {/* Target days */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('habitsNew.goalDays')}
              </label>
              <div className="flex gap-2">
                {[7, 14, 21, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTargetDays(d)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      targetDays === d
                        ? 'bg-accent/10 text-accent ring-1 ring-border-focus'
                        : 'bg-elevated text-foreground-secondary hover:bg-border',
                    )}
                  >
                    {d}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={targetDays}
                  onChange={(e) => setTargetDays(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center"
                />
              </div>
            </div>

            {/* Icon selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('habitsNew.icon')}
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {HABIT_ICONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setSelectedIcon(item.name)}
                      className={clsx(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                        selectedIcon === item.name
                          ? 'bg-accent/10 ring-2 ring-border-focus scale-110'
                          : 'hover:bg-surface',
                      )}
                    >
                      <Icon className={clsx('w-4 h-4', selectedIcon === item.name ? 'text-accent' : 'text-foreground-secondary')} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('habitsPage.color')}
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={clsx(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
