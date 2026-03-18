import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Tag, Trash2, Plus, Check } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useUpdateTask, useDeleteTask, useCreateTask } from '@/hooks/useTasks';
import { PRIORITY_LABELS, STATUS_LABELS, getPriorityLabel, getStatusLabel } from '@/utils/constants';
import { formatDate, formatDuration } from '@/utils/formatters';
import { Priority, TaskStatus, type Task } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Модальное окно детального просмотра и редактирования задачи с подзадачами и описанием. */
export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const { t } = useTranslation();

  if (!task) return null;

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({ id: task.id, data: { title: title.trim() } });
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (description !== task.description) {
      updateTask.mutate({ id: task.id, data: { description } });
    }
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Title */}
        <div>
          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="text-xl font-bold"
            />
          ) : (
            <h2
              className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => {
                setTitle(task.title);
                setEditingTitle(true);
              }}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
              {t('taskDetail.status')}
            </label>
            <Select
              options={Object.entries(STATUS_LABELS)
                .filter(([k]) => k !== TaskStatus.ARCHIVED)
                .map(([v]) => ({ value: v, label: getStatusLabel(v as TaskStatus) }))}
              value={task.status}
              onChange={(e) =>
                updateTask.mutate({
                  id: task.id,
                  data: { status: e.target.value as TaskStatus },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
              {t('taskDetail.priority')}
            </label>
            <Select
              options={Object.entries(PRIORITY_LABELS).map(([v]) => ({ value: v, label: getPriorityLabel(v as Priority) }))}
              value={task.priority}
              onChange={(e) =>
                updateTask.mutate({
                  id: task.id,
                  data: { priority: e.target.value as Priority },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
              {t('taskDetail.dueDate')}
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-gray-400" />
              {task.deadline ? formatDate(task.deadline) : t('taskDetail.noDueDate')}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
              {t('taskDetail.timeTracked')}
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 text-gray-400" />
              {task.time_logged ? formatDuration(task.time_logged) : '0m'}
              {task.time_estimate && (
                <span className="text-gray-400">
                  / {formatDuration(task.time_estimate)} {t('taskDetail.est')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              {t('taskDetail.tags')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  <Tag className="w-3 h-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
            {t('taskDetail.description')}
          </label>
          <textarea
            value={description || task.description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            placeholder={t('taskDetail.descPlaceholder')}
            rows={4}
            className="w-full rounded-input border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
            {t('taskDetail.subtasks')} ({task.subtasks?.length ?? 0})
          </label>
          <div className="space-y-1.5">
            {(task.subtasks ?? []).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <button
                  onClick={() =>
                    updateTask.mutate({
                      id: sub.id,
                      data: { status: sub.is_completed ? TaskStatus.INBOX : TaskStatus.DONE },
                    })
                  }
                  className={clsx(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors',
                    sub.is_completed
                      ? 'bg-success-500 border-success-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-success-400'
                  )}
                >
                  {sub.is_completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <span
                  className={clsx(
                    'text-sm',
                    sub.is_completed
                      ? 'text-gray-400 line-through'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {sub.title}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder={t('taskDetail.addSubtaskPlaceholder')}
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="w-3.5 h-3.5" />}
                disabled={!newSubtask.trim()}
                loading={createTask.isPending}
                onClick={() => {
                  if (!newSubtask.trim()) return;
                  createTask.mutate({
                    title: newSubtask.trim(),
                    parent_task: task.id,
                    status: TaskStatus.INBOX,
                    priority: task.priority as Priority,
                  });
                  setNewSubtask('');
                }}
              >
                {t('taskDetail.add')}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">
            {t('taskDetail.created')} {formatDate(task.created_at)}
            {task.updated_at !== task.created_at &&
              ` | ${t('taskDetail.updated')} ${formatDate(task.updated_at)}`}
          </p>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleDelete}
            loading={deleteTask.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
