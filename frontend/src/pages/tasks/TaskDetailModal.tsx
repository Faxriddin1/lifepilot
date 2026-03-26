import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Tag, Trash2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
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
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { t } = useTranslation();

  // Sync local state when task changes
  useState(() => {
    if (task) {
      setDeadlineDate(task.deadline ? new Date(task.deadline).toLocaleDateString('en-CA') : '');
      setDeadlineTime(task.deadline ? `${String(new Date(task.deadline).getHours()).padStart(2,'0')}:${String(new Date(task.deadline).getMinutes()).padStart(2,'0')}` : '');
      setTimeEstimate(task.time_estimate ? String(task.time_estimate) : '');
      setHasChanges(false);
    }
  });

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
              className="text-xl font-bold text-foreground cursor-pointer hover:text-accent transition-colors"
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
            <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-1 block">
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
            <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-1 block">
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
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-1 block">
                  {t('taskDetail.dueDate', { defaultValue: 'Срок' })}
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => { setDeadlineDate(e.target.value); setHasChanges(true); }}
                  className="block w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-1 block">
                  {t('taskDetail.dueTime', { defaultValue: 'Время' })}
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => { setDeadlineTime(e.target.value); setHasChanges(true); }}
                  className="block w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-1 block">
                  {t('taskDetail.timeEstimate', { defaultValue: 'Время (мин)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={timeEstimate}
                  onChange={(e) => { setTimeEstimate(e.target.value); setHasChanges(true); }}
                  className="block w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-2 block">
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
          <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-2 block">
            {t('taskDetail.description')}
          </label>
          <textarea
            value={description || task.description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            placeholder={t('taskDetail.descPlaceholder')}
            rows={4}
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus placeholder:text-foreground-secondary resize-none"
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-2 block">
            {t('taskDetail.subtasks')} ({task.subtasks?.length ?? 0})
          </label>
          <div className="space-y-1.5">
            {(task.subtasks ?? []).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-surface"
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
                      ? 'bg-success border-success'
                      : 'border-border hover:border-success'
                  )}
                >
                  {sub.is_completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <span
                  className={clsx(
                    'text-sm',
                    sub.is_completed
                      ? 'text-foreground-secondary line-through'
                      : 'text-foreground'
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
        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Save description
                handleDescriptionSave();

                // Build deadline from date + time
                const updates: Record<string, any> = {};
                if (deadlineDate) {
                  const d = new Date(deadlineDate);
                  if (deadlineTime) {
                    const [h, min] = deadlineTime.split(':').map(Number);
                    d.setHours(h, min, 0, 0);
                  } else {
                    d.setHours(23, 59, 0, 0);
                  }
                  updates.deadline = d.toISOString();
                } else if (!deadlineDate && task.deadline) {
                  updates.deadline = null;
                }

                // Save time estimate
                const est = timeEstimate ? parseInt(timeEstimate) : null;
                if (est !== task.time_estimate) {
                  updates.time_estimate = est;
                }

                if (Object.keys(updates).length > 0) {
                  updateTask.mutate({ id: task.id, data: updates });
                }

                setHasChanges(false);
                onClose();
                toast.success(t('common.saved', { defaultValue: 'Сохранено' }));
              }}
            >
              {t('common.save', { defaultValue: 'Сохранить' })}{hasChanges ? ' •' : ''}
            </Button>
            {task.status !== 'done' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Check className="w-3.5 h-3.5" />}
                onClick={() => {
                  updateTask.mutate({ id: task.id, data: { status: TaskStatus.DONE } });
                  onClose();
                  toast.success(t('taskDetail.markedDone', { defaultValue: 'Задача выполнена ✅' }));
                }}
              >
                {t('taskDetail.markDone', { defaultValue: 'Готово' })}
              </Button>
            )}
            <div className="flex-1" />
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
          <p className="text-xs text-foreground-tertiary">
            {t('taskDetail.created')} {formatDate(task.created_at)}
            {task.updated_at !== task.created_at &&
              ` | ${t('taskDetail.updated')} ${formatDate(task.updated_at)}`}
          </p>
        </div>
      </div>
    </Modal>
  );
}
