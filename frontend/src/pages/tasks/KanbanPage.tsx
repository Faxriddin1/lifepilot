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
import { Spinner } from '@/components/ui/Spinner';
import { useTasksQuery, useUpdateTask } from '@/hooks/useTasks';
import { useUiStore } from '@/store/uiStore';
import { PRIORITY_DOT_COLORS, getPriorityLabel, getKanbanColumns } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { TaskStatus, type Task, type Priority } from '@/types';

/** Карточка задачи с поддержкой перетаскивания для канбан-доски. */
function TaskCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = overlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm',
        'hover:shadow-card-hover transition-shadow',
        isDragging && 'opacity-50',
        overlay && 'shadow-lg rotate-2'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...(overlay ? {} : { ...attributes, ...listeners })}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                PRIORITY_DOT_COLORS[task.priority as Priority]
              )}
              title={getPriorityLabel(task.priority as Priority)}
            />
            {task.project_name && (
              <Badge variant="default" size="sm">
                {task.project_name}
              </Badge>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(task.deadline, 'MMM d')}
              </span>
            )}
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Колонка канбан-доски с поддержкой drag-and-drop. */
function KanbanColumn({
  columnId,
  label,
  tasks,
}: {
  columnId: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  const { t } = useTranslation();
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const colorMap: Record<string, string> = {
    [TaskStatus.INBOX]: 'bg-gray-400',
    [TaskStatus.IN_PROGRESS]: 'bg-warning-500',
    [TaskStatus.REVIEW]: 'bg-accent-500',
    [TaskStatus.DONE]: 'bg-success-500',
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
        <button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setQuickAddOpen(true)}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="space-y-2 min-h-[200px] p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700/50"
          data-column={columnId}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-8">{t('kanban.dropHere')}</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/** Страница канбан-доски с перетаскиванием задач между колонками статусов. */
export function KanbanPage() {
  const { data, isLoading } = useTasksQuery({ page_size: 100 });
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const tasksByColumn = useMemo(() => {
    const tasks = data?.results ?? [];
    const grouped: Record<string, Task[]> = {};
    for (const col of getKanbanColumns()) {
      grouped[col.id] = [];
    }
    for (const task of tasks) {
      const col = getKanbanColumns().find((c) => c.id === task.status);
      if (col) {
        grouped[col.id].push(task);
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
    const overElement = over.data.current as { task?: Task } | undefined;
    const overTask = overElement?.task;

    let targetStatus: TaskStatus | undefined;

    if (overTask) {
      targetStatus = overTask.status;
    } else {
      // over.id might be a column status if droppable areas are configured,
      // or we need to find the column element containing the over element.
      const overId = String(over.id);
      const kanbanColumnIds = getKanbanColumns().map((c) => c.id as string);
      if (kanbanColumnIds.includes(overId)) {
        targetStatus = overId as TaskStatus;
      } else {
        // Find the column element that contains the drop target
        const overNode = document.querySelector(`[data-column="${overId}"]`)
          ?? document.getElementById(overId)?.closest('[data-column]');
        if (overNode) {
          targetStatus = overNode.getAttribute('data-column') as TaskStatus;
        }
      }
    }

    if (targetStatus) {
      const currentTask = data?.results.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== targetStatus) {
        updateTask.mutate({ id: taskId, data: { status: targetStatus } });
      }
    }
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
        <div>
          <p className="text-sm text-gray-500">
            {data?.count ?? 0} {t('kanban.tasksAcross')} {getKanbanColumns().length} {t('kanban.columns')}
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} size="sm">
          {t('kanban.addTask')}
        </Button>
      </div>

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
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
