import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, MoreHorizontal, Trash2, ArrowRight, Inbox } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useTasksQuery, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { getPriorityLabel } from '@/utils/constants';
import { TaskStatus, Priority, type CreateTaskData } from '@/types';

/** Inbox — быстрый сбор задач в статусе «Входящие» с возможностью сортировки и перемещения. */
export function InboxPage() {
  const { t } = useTranslation();
  const isRu = t('common.save') === 'Сохранить';

  const { data, isLoading } = useTasksQuery({ status: TaskStatus.INBOX });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [newTitle, setNewTitle] = useState('');
  const [showMoveMenu, setShowMoveMenu] = useState<string | null>(null);

  const tasks = data?.results ?? [];

  const handleQuickAdd = useCallback(() => {
    if (!newTitle.trim()) return;
    const taskData: CreateTaskData = {
      title: newTitle.trim(),
      status: TaskStatus.INBOX,
      priority: Priority.P3,
    };
    createTask.mutate(taskData);
    setNewTitle('');
  }, [newTitle, createTask]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const moveToStatus = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ id: taskId, data: { status } });
    setShowMoveMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Quick add */}
      <Card className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder={isRu ? 'Быстро добавить задачу...' : 'Quickly add a task...'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={handleQuickAdd}
            loading={createTask.isPending}
            disabled={!newTitle.trim()}
          >
            {isRu ? 'Добавить' : 'Add'}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {isRu ? 'Нажмите Enter для быстрого добавления' : 'Press Enter to quickly add'}
        </p>
      </Card>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title={isRu ? 'Входящие пусты' : 'Inbox is empty'}
          description={isRu ? 'Все задачи разобраны! Добавьте новую задачу выше.' : 'All tasks sorted! Add a new one above.'}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">
            {tasks.length} {isRu ? 'задач во входящих' : 'tasks in inbox'}
          </p>

          {tasks.map((task) => (
            <Card key={task.id} className="group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {/* Complete button */}
                <button
                  onClick={() => moveToStatus(task.id, TaskStatus.DONE)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center transition-colors flex-shrink-0"
                  title={isRu ? 'Завершить' : 'Complete'}
                >
                  <Check className="w-3.5 h-3.5 text-transparent group-hover:text-green-500 transition-colors" />
                </button>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.title}
                  </p>
                  {task.project_name && (
                    <p className="text-xs text-gray-400 mt-0.5">📁 {task.project_name}</p>
                  )}
                </div>

                {/* Priority badge */}
                <Badge variant="default" className="text-[10px] flex-shrink-0">
                  {getPriorityLabel(task.priority as Priority)}
                </Badge>

                {/* Move menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoveMenu(showMoveMenu === task.id ? null : task.id)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>

                  {showMoveMenu === task.id && (
                    <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48">
                      <button
                        onClick={() => moveToStatus(task.id, TaskStatus.IN_PROGRESS)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        {isRu ? 'В работу' : 'In Progress'}
                      </button>
                      <button
                        onClick={() => moveToStatus(task.id, TaskStatus.REVIEW)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ArrowRight className="w-4 h-4 text-amber-500" />
                        {isRu ? 'На ревью' : 'Review'}
                      </button>
                      <button
                        onClick={() => moveToStatus(task.id, TaskStatus.DONE)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                        {isRu ? 'Готово' : 'Done'}
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          deleteTask.mutate(task.id);
                          setShowMoveMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isRu ? 'Удалить' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
