import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Clock, Flag } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useTasksQuery } from '@/hooks/useTasks';
import { PRIORITY_COLORS, PRIORITY_DOT_COLORS, getPriorityLabel, getStatusLabel } from '@/utils/constants';
import { type Task, type Priority, type TaskStatus } from '@/types';
import { TaskDetailModal } from './TaskDetailModal';

/** Форматирует Date в строку YYYY-MM-DD для ключа. */
const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Страница календаря задач с месячным видом, панелью задач дня и переходом к деталям. */
export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { data, isLoading } = useTasksQuery({});

  const tasks = data?.results ?? [];
  const weekdays = t('calendar.weekdaysShort', { returnObjects: true }) as string[];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  /** Генерация ячеек календаря (6 недель × 7 дней = 42 ячейки). */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  /** Группировка задач по дате дедлайна. */
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.deadline) {
        const key = task.deadline.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const today = new Date();
  const todayKey = formatDateKey(today);

  const monthName = currentDate.toLocaleString(i18n.language === 'uz-cyr' ? 'uz' : i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDateKey(todayKey);
  };

  /** Форматирует выбранную дату для заголовка боковой панели. */
  const formatSelectedDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(i18n.language === 'uz-cyr' ? 'uz' : i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const selectedDayTasks = selectedDateKey ? (tasksByDate[selectedDateKey] || []) : [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
          </button>
          <h2 className="text-xl font-bold text-foreground capitalize min-w-[220px] text-center">
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToday}>
          {t('calendar.today')}
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className={clsx(
          'flex-1 border border-border rounded-xl overflow-hidden shadow-sm transition-all',
          selectedDateKey && 'max-w-[calc(100%-320px)]',
        )}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-surface border-b border-border">
            {weekdays.map((day, i) => (
              <div
                key={day}
                className={clsx(
                  'py-3 text-center text-sm font-semibold tracking-wide',
                  i >= 5 ? 'text-danger' : 'text-foreground-secondary',
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const key = formatDateKey(day.date);
              const dayTasks = tasksByDate[key] || [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDateKey;
              const isWeekend = idx % 7 >= 5;
              const rowIdx = Math.floor(idx / 7);
              const isLastRow = rowIdx === 5;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateKey(isSelected ? null : key)}
                  className={clsx(
                    'min-h-[110px] p-2 border-b border-r border-border cursor-pointer transition-all duration-150',
                    !day.isCurrentMonth && 'bg-surface',
                    day.isCurrentMonth && !isSelected && 'hover:bg-accent/5',
                    isWeekend && day.isCurrentMonth && 'bg-warning/5',
                    isSelected && 'bg-accent/10 ring-2 ring-inset ring-accent/40',
                    idx % 7 === 6 && 'border-r-0',
                    isLastRow && 'border-b-0',
                  )}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={clsx(
                        'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                        isToday && 'bg-accent text-white shadow-sm',
                        !isToday && day.isCurrentMonth && 'text-foreground',
                        !isToday && !day.isCurrentMonth && 'text-foreground-secondary',
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task pills */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateKey(key);
                          setSelectedTask(task);
                        }}
                        className={clsx(
                          'text-[11px] leading-tight px-1.5 py-1 rounded-md truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm font-medium border-l-[3px]',
                          PRIORITY_COLORS[task.priority as Priority]
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-foreground-secondary pl-1.5 font-medium">
                        +{dayTasks.length - 3} {t('calendar.more')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel — tasks of selected day */}
        {selectedDateKey && (
          <div className="w-[300px] flex-shrink-0 border border-border rounded-xl overflow-hidden shadow-sm bg-background animate-fade-in">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
              <div>
                <p className="text-sm font-bold text-foreground capitalize">
                  {formatSelectedDate(selectedDateKey)}
                </p>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  {selectedDayTasks.length} {t('calendar.tasks')}
                </p>
              </div>
              <button
                onClick={() => setSelectedDateKey(null)}
                className="p-1 rounded-md hover:bg-elevated transition-colors"
              >
                <X className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>

            {/* Task list */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {selectedDayTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-foreground-secondary">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-foreground-tertiary" />
                  {t('calendar.noTasksForDay')}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="px-4 py-3 hover:bg-surface cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority as Priority] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="default"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {getStatusLabel(task.status as TaskStatus)}
                            </Badge>
                            <span className="flex items-center gap-0.5 text-[10px] text-foreground-secondary">
                              <Flag className="w-3 h-3" />
                              {getPriorityLabel(task.priority as Priority)}
                            </span>
                          </div>
                          {task.project_name && (
                            <p className="text-[10px] text-foreground-secondary mt-1">
                              {task.project_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground-tertiary group-hover:text-foreground-secondary mt-0.5 flex-shrink-0 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mt-4 text-sm text-foreground-secondary">
        <span>
          {t('calendar.total')}: <span className="font-semibold text-foreground">{tasks.length}</span> {t('calendar.tasks')}
        </span>
        <span>
          {t('calendar.withDeadline')}: <span className="font-semibold text-foreground">{tasks.filter((t) => t.deadline).length}</span>
        </span>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
