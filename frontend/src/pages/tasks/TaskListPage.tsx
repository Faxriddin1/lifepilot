import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Check,
  MoreHorizontal,
  Calendar,
  Trash2,
  ListFilter,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useTasksQuery, useCreateTask, useUpdateTask, useDeleteTask, useProjectsQuery } from '@/hooks/useTasks';
import { PRIORITY_COLORS, getPriorityLabel, getStatusLabel } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { Priority, TaskStatus, type TaskFilters, type CreateTaskData } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { TaskDetailModal } from './TaskDetailModal';
import type { Task } from '@/types';

/** Страница списка задач с фильтрацией, поиском, массовыми действиями и пагинацией. */
export function TaskListPage() {
  const [searchParams] = useSearchParams();
  const projectFromUrl = searchParams.get('project') || undefined;
  const [filters, setFilters] = useState<TaskFilters>({});
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (quickAddOpen) {
      setShowAddModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.P3);
  const [newStatus, setNewStatus] = useState<TaskStatus>(TaskStatus.INBOX);
  const [newDueDate, setNewDueDate] = useState('');
  const [newProjectId, setNewProjectId] = useState<string>(projectFromUrl || '');

  useEffect(() => {
    if (showAddModal && projectFromUrl) {
      setNewProjectId(projectFromUrl);
    }
  }, [showAddModal, projectFromUrl]);
  const { t } = useTranslation();

  useEffect(() => {
    if (projectFromUrl) {
      setFilters((prev) => ({ ...prev, project: projectFromUrl }));
    }
  }, [projectFromUrl]);

  const activeFilters: TaskFilters = {
    ...filters,
    search: search || undefined,
  };

  const { data, isLoading } = useTasksQuery(activeFilters);
  const { data: projects } = useProjectsQuery();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = data?.results ?? [];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
    }
  }, [selectedIds.size, tasks]);

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    const taskData: CreateTaskData = {
      title: newTitle.trim(),
      priority: newPriority,
      status: newStatus,
      deadline: newDueDate || null,
      project: newProjectId || null,
    };
    createTask.mutate(taskData, {
      onSuccess: () => {
        setShowAddModal(false);
        setNewTitle('');
        setNewDueDate('');
        setNewProjectId(projectFromUrl || '');
      },
    });
  };

  const handleStatusToggle = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === TaskStatus.DONE ? TaskStatus.INBOX : TaskStatus.DONE;
    updateTask.mutate({ id: taskId, data: { status: nextStatus } });
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteTask.mutate(id));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder={t('taskList.searchTasks')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          options={[
            { value: '', label: t('taskList.allStatuses') },
            ...Object.values(TaskStatus).map((v) => ({ value: v, label: getStatusLabel(v) })),
          ]}
          value={filters.status || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: (e.target.value as TaskStatus) || undefined }))
          }
        />
        <Select
          options={[
            { value: '', label: t('taskList.allPriorities') },
            ...Object.values(Priority).map((v) => ({ value: v, label: getPriorityLabel(v) })),
          ]}
          value={filters.priority || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, priority: (e.target.value as Priority) || undefined }))
          }
        />
        <Select
          options={[
            { value: '', label: t('taskList.allProjects') },
            ...(projects ?? []).map((p) => ({ value: String(p.id), label: p.name })),
          ]}
          value={filters.project || ''}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              project: e.target.value || undefined,
            }))
          }
        />
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
          {t('taskList.addTask')}
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-card px-4 py-2">
          <span className="text-sm font-medium text-accent">
            {selectedIds.size} {t('taskList.selected')}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            {t('taskList.clear')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleBulkDelete}
          >
            {t('common.delete')}
          </Button>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ListFilter className="w-8 h-8" />}
          title={t('taskList.noTasksFound')}
          description={t('taskList.noTasksDesc')}
          actionLabel={t('taskList.createTask')}
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-8 px-3 py-2">
                    <button onClick={toggleSelectAll}>
                      <div
                        className={clsx(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                          selectedIds.size === tasks.length && tasks.length > 0
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        )}
                      >
                        {selectedIds.size === tasks.length && tasks.length > 0 && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>
                  </th>
                  <th className="w-8 px-1 py-2" />
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-3 py-2">
                    {t('taskList.task')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-3 py-2">
                    {t('taskList.status')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-3 py-2">
                    {t('taskList.priority')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-3 py-2 hidden md:table-cell">
                    {t('taskList.project')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-3 py-2 hidden sm:table-cell">
                    {t('taskList.dueDate')}
                  </th>
                  <th className="w-8 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={clsx(
                      'border-b border-border hover:bg-surface transition-colors duration-fast group h-8',
                      selectedIds.has(task.id) && 'bg-accent/5'
                    )}
                  >
                    <td className="px-3 py-1">
                      <button onClick={() => toggleSelect(task.id)}>
                        <div
                          className={clsx(
                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                            selectedIds.has(task.id)
                              ? 'bg-accent border-accent'
                              : 'border-border'
                          )}
                        >
                          {selectedIds.has(task.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    </td>
                    <td className="px-1 py-1">
                      <button
                        onClick={() => handleStatusToggle(task.id, task.status)}
                        className={clsx(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                          task.status === TaskStatus.DONE
                            ? 'bg-success border-success'
                            : 'border-border hover:border-success'
                        )}
                      >
                        {task.status === TaskStatus.DONE && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-1">
                      <span
                        onClick={() => setSelectedTask(task)}
                        className={clsx(
                          'text-sm cursor-pointer hover:text-accent transition-colors truncate block max-w-[300px]',
                          task.status === TaskStatus.DONE
                            ? 'text-foreground-tertiary line-through'
                            : 'text-foreground'
                        )}
                      >
                        {task.title}
                      </span>
                    </td>
                    <td className="px-3 py-1">
                      <Badge
                        size="sm"
                        variant={
                          task.status === TaskStatus.DONE
                            ? 'success'
                            : task.status === TaskStatus.IN_PROGRESS
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {getStatusLabel(task.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-1">
                      <Badge className={PRIORITY_COLORS[task.priority]} size="sm" dot>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </td>
                    <td className="px-3 py-1 hidden md:table-cell">
                      <span className="text-xs text-foreground-tertiary truncate block max-w-[120px]">
                        {task.project_name || '--'}
                      </span>
                    </td>
                    <td className="px-3 py-1 hidden sm:table-cell">
                      {task.deadline ? (
                        <span className="text-xs text-foreground-tertiary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.deadline, 'MMM d')}
                        </span>
                      ) : (
                        <span className="text-xs text-foreground-tertiary">--</span>
                      )}
                    </td>
                    <td className="px-3 py-1 relative">
                      <button
                        onClick={() => setContextMenuTaskId(contextMenuTaskId === task.id ? null : task.id)}
                        className="p-1 rounded text-foreground-tertiary opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-surface transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {contextMenuTaskId === task.id && (
                        <div className="absolute right-4 top-8 z-20 bg-background rounded-lg shadow-lg border border-border py-1 w-40 animate-fade-in">
                          <button
                            onClick={() => { setSelectedTask(task); setContextMenuTaskId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => {
                              deleteTask.mutate(task.id);
                              setContextMenuTaskId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.count > (filters.page_size ?? 20) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-foreground-secondary">{data.count} {t('taskList.totalTasks')}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!data.previous}
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                  }
                >
                  {t('taskList.previous')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!data.next}
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                  }
                >
                  {t('taskList.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('taskList.newTask')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTask} loading={createTask.isPending}>
              {t('taskList.createTask')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('taskList.title')}
            placeholder={t('taskList.titlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('taskList.priority')}
              options={Object.values(Priority).map((v) => ({ value: v, label: getPriorityLabel(v) }))}
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
            />
            <Select
              label={t('taskList.status')}
              options={Object.values(TaskStatus)
                .filter((v) => v !== TaskStatus.ARCHIVED)
                .map((v) => ({ value: v, label: getStatusLabel(v) }))}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
            />
          </div>
          <div className={projectFromUrl ? '' : 'grid grid-cols-2 gap-4'}>
            <Input
              label={t('taskList.dueDate')}
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            {!projectFromUrl && (
              <Select
                label={t('taskList.project')}
                placeholder={t('taskList.selectProject')}
                options={[
                  { value: '', label: t('taskList.noProject') },
                  ...(projects ?? []).map((p) => ({ value: String(p.id), label: p.name })),
                ]}
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
