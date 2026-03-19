import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useTasksQuery, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { PRIORITY_DOT_COLORS, getPriorityLabel, getKanbanColumns } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { TaskStatus, Priority, type Task } from '@/types';
import { TaskDetailModal } from './TaskDetailModal';

/** Карточка задачи с drag + клик для деталей. */
function TaskCard({
  task,
  overlay = false,
  onClickTask,
}: {
  task: Task;
  overlay?: boolean;
  onClickTask?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, type: 'task' },
  });

  const style = overlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm group/card',
        'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer',
        isDragging && 'opacity-50',
        overlay && 'shadow-xl rotate-2 scale-105',
      )}
      onClick={() => !isDragging && onClickTask?.(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...(overlay ? {} : { ...attributes, ...listeners })}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={clsx('w-2 h-2 rounded-full', PRIORITY_DOT_COLORS[task.priority as Priority])}
              title={getPriorityLabel(task.priority as Priority)}
            />
            {task.project_name && (
              <Badge variant="default" size="sm">{task.project_name}</Badge>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(task.deadline, 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Колонка канбан-доски с droppable зоной. */
function KanbanColumn({
  columnId,
  label,
  tasks,
  onClickTask,
  onAddTask,
}: {
  columnId: TaskStatus;
  label: string;
  tasks: Task[];
  onClickTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnId}`,
    data: { type: 'column', status: columnId },
  });

  const colorMap: Record<string, string> = {
    [TaskStatus.INBOX]: 'bg-gray-400',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-500',
    [TaskStatus.REVIEW]: 'bg-amber-500',
    [TaskStatus.DONE]: 'bg-green-500',
  };

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2.5 h-2.5 rounded-full', colorMap[columnId] || 'bg-gray-400')} />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => onAddTask(columnId)}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx(
            'space-y-2 min-h-[200px] p-2 rounded-lg border border-dashed transition-colors',
            isOver
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50',
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClickTask={onClickTask} />
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-8">{t('kanban.dropHere')}</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/** Канбан-доска с drag-and-drop, quick add и детальным просмотром задач. */
export function KanbanPage() {
  const { data, isLoading } = useTasksQuery({ page_size: 100 });
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const tasksByColumn = useMemo(() => {
    const tasks = data?.results ?? [];
    const grouped: Record<string, Task[]> = {};
    for (const col of getKanbanColumns()) {
      grouped[col.id] = [];
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped[TaskStatus.INBOX]?.push(task);
      }
    }
    return grouped;
  }, [data]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = (event.active.data.current as { task?: Task })?.task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overData = over.data.current as { type?: string; status?: TaskStatus; task?: Task } | undefined;

    let targetStatus: TaskStatus | undefined;

    if (overData?.type === 'column') {
      targetStatus = overData.status;
    } else if (overData?.task) {
      targetStatus = overData.task.status;
    }

    if (targetStatus) {
      const currentTask = data?.results.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== targetStatus) {
        updateTask.mutate({ id: taskId, data: { status: targetStatus } });
      }
    }
  };

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim() || !quickAddStatus) return;
    createTask.mutate({
      title: quickAddTitle.trim(),
      status: quickAddStatus,
      priority: Priority.P3,
    });
    setQuickAddTitle('');
    setQuickAddStatus(null);
  };

  const handleQuickAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleQuickAdd();
    if (e.key === 'Escape') { setQuickAddStatus(null); setQuickAddTitle(''); }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {data?.count ?? 0} {t('kanban.tasksAcross')} {getKanbanColumns().length} {t('kanban.columns')}
        </p>
      </div>

      {/* Quick add bar */}
      {quickAddStatus && (
        <div className="mb-4 flex gap-2 items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
            + {getKanbanColumns().find((c) => c.id === quickAddStatus)?.label}:
          </span>
          <Input
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onKeyDown={handleQuickAddKeyDown}
            placeholder={t('kanbanNew.taskTitlePlaceholder')}
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleQuickAdd} disabled={!quickAddTitle.trim()}>
            {t('kanbanNew.add')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setQuickAddStatus(null); setQuickAddTitle(''); }}>
            ✕
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {getKanbanColumns().map((col) => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              tasks={tasksByColumn[col.id] || []}
              onClickTask={setSelectedTask}
              onAddTask={(status) => { setQuickAddStatus(status); setQuickAddTitle(''); }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
