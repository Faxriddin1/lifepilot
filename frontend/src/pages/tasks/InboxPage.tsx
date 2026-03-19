import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Check, MoreHorizontal, Trash2, ArrowRight, Inbox,
  Calendar, Flag, FolderKanban, ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  useTasksQuery, useCreateTask, useUpdateTask, useDeleteTask, useProjectsQuery,
} from '@/hooks/useTasks';
import { getPriorityLabel, PRIORITY_COLORS } from '@/utils/constants';
import { TaskStatus, Priority, type CreateTaskData, type Task } from '@/types';
import { TaskDetailModal } from './TaskDetailModal';

/** Inbox — быстрый сбор и разбор задач со статусом «Входящие». */
export function InboxPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useTasksQuery({ status: TaskStatus.INBOX });
  const { data: projects } = useProjectsQuery();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [newTitle, setNewTitle] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<'main' | 'priority' | 'project' | 'deadline'>('main');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

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
    closeMenu();
  };

  const setPriority = (taskId: string, priority: Priority) => {
    updateTask.mutate({ id: taskId, data: { priority } });
    closeMenu();
  };

  const setProject = (taskId: string, projectId: string | null) => {
    updateTask.mutate({ id: taskId, data: { project: projectId } as any });
    closeMenu();
  };

  const setDeadline = (taskId: string, deadline: string) => {
    updateTask.mutate({ id: taskId, data: { deadline } as any });
    closeMenu();
  };

  const openMenu = (taskId: string, type: 'main' | 'priority' | 'project' | 'deadline' = 'main') => {
    setActiveMenu(taskId);
    setMenuType(type);
  };

  const closeMenu = () => {
    setActiveMenu(null);
    setMenuType('main');
  };

  const startEdit = (taskId: string, title: string) => {
    setEditingId(taskId);
    setEditTitle(title);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateTask.mutate({ id: editingId, data: { title: editTitle.trim() } });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') { setEditingId(null); setEditTitle(''); }
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
            placeholder={t('inbox.quickAddPlaceholder')}
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
            {t('inbox.add')}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t('inbox.pressEnter')}
        </p>
      </Card>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title={t('inbox.inboxEmpty')}
          description={t('inbox.inboxEmptyDesc')}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">
            {tasks.length} {t('inbox.tasksInInbox')}
          </p>

          {tasks.map((task) => (
            <Card key={task.id} className="group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {/* Complete button */}
                <button
                  onClick={() => moveToStatus(task.id, TaskStatus.DONE)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center transition-colors flex-shrink-0"
                  title={t('inbox.complete')}
                >
                  <Check className="w-3.5 h-3.5 text-transparent group-hover:text-green-500 transition-colors" />
                </button>

                {/* Title — inline editable */}
                <div className="flex-1 min-w-0">
                  {editingId === task.id ? (
                    <input
                      ref={editRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="w-full text-sm font-medium bg-transparent border-b-2 border-blue-500 outline-none py-0.5 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-text hover:text-blue-600 transition-colors"
                      onClick={() => startEdit(task.id, task.title)}
                    >
                      {task.title}
                    </p>
                  )}
                  {/* Meta info row */}
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.project_name && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <FolderKanban className="w-3 h-3" /> {task.project_name}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> {task.deadline.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick action buttons — visible on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Priority */}
                  <button
                    onClick={() => openMenu(task.id, 'priority')}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={t('inbox.priority')}
                  >
                    <Flag className="w-3.5 h-3.5" style={{ color: PRIORITY_COLORS[task.priority as Priority] }} />
                  </button>
                  {/* Project */}
                  <button
                    onClick={() => openMenu(task.id, 'project')}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={t('inbox.project')}
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {/* Deadline */}
                  <button
                    onClick={() => openMenu(task.id, 'deadline')}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={t('inbox.deadline')}
                  >
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {/* Open details */}
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={t('inbox.details')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>

                {/* Priority badge */}
                <Badge
                  variant="default"
                  className="text-[10px] flex-shrink-0"
                >
                  {getPriorityLabel(task.priority as Priority)}
                </Badge>

                {/* Main menu */}
                <div className="relative">
                  <button
                    onClick={() => openMenu(task.id, 'main')}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>

                  {activeMenu === task.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMenu} />
                      <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-52">

                        {/* Main menu */}
                        {menuType === 'main' && (
                          <>
                            <button onClick={() => moveToStatus(task.id, TaskStatus.IN_PROGRESS)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <ArrowRight className="w-4 h-4 text-blue-500" /> {t('inbox.inProgress')}
                            </button>
                            <button onClick={() => moveToStatus(task.id, TaskStatus.REVIEW)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <ArrowRight className="w-4 h-4 text-amber-500" /> {t('inbox.review')}
                            </button>
                            <button onClick={() => moveToStatus(task.id, TaskStatus.DONE)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <Check className="w-4 h-4 text-green-500" /> {t('inbox.done')}
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button onClick={() => setMenuType('priority')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <Flag className="w-4 h-4 text-gray-400" /> {t('inbox.priorityMenu')}
                            </button>
                            <button onClick={() => setMenuType('project')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <FolderKanban className="w-4 h-4 text-gray-400" /> {t('inbox.projectMenu')}
                            </button>
                            <button onClick={() => setMenuType('deadline')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" /> {t('inbox.deadlineMenu')}
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button onClick={() => { setSelectedTask(task); closeMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <ExternalLink className="w-4 h-4 text-gray-400" /> {t('inbox.details')}
                            </button>
                            <button
                              onClick={() => { deleteTask.mutate(task.id); closeMenu(); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" /> {t('inbox.delete')}
                            </button>
                          </>
                        )}

                        {/* Priority submenu */}
                        {menuType === 'priority' && (
                          <>
                            <button onClick={() => setMenuType('main')} className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left">
                              ← {t('inbox.back')}
                            </button>
                            {[Priority.P1, Priority.P2, Priority.P3, Priority.P4].map((p) => (
                              <button
                                key={p}
                                onClick={() => setPriority(task.id, p)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                                  task.priority === p && 'bg-blue-50 dark:bg-blue-900/20',
                                )}
                              >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
                                {getPriorityLabel(p)}
                                {task.priority === p && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
                              </button>
                            ))}
                          </>
                        )}

                        {/* Project submenu */}
                        {menuType === 'project' && (
                          <>
                            <button onClick={() => setMenuType('main')} className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left">
                              ← {t('inbox.back')}
                            </button>
                            <button
                              onClick={() => setProject(task.id, null)}
                              className={clsx(
                                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                                !task.project && 'bg-blue-50 dark:bg-blue-900/20',
                              )}
                            >
                              <span className="text-gray-400">—</span>
                              {t('inbox.noProject')}
                              {!task.project && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
                            </button>
                            {(projects ?? []).map((proj) => (
                              <button
                                key={proj.id}
                                onClick={() => setProject(task.id, proj.id)}
                                className={clsx(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                                  task.project === proj.id && 'bg-blue-50 dark:bg-blue-900/20',
                                )}
                              >
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: proj.color }} />
                                <span className="truncate">{proj.name}</span>
                                {task.project === proj.id && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
                              </button>
                            ))}
                          </>
                        )}

                        {/* Deadline submenu */}
                        {menuType === 'deadline' && (
                          <>
                            <button onClick={() => setMenuType('main')} className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left">
                              ← {t('inbox.back')}
                            </button>
                            {(() => {
                              const today = new Date();
                              const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                              const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
                              const fmt = (d: Date) => d.toISOString().split('T')[0];
                              return (
                                <>
                                  <button onClick={() => setDeadline(task.id, fmt(today))} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Calendar className="w-4 h-4 text-red-500" /> {t('inbox.today')}
                                  </button>
                                  <button onClick={() => setDeadline(task.id, fmt(tomorrow))} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Calendar className="w-4 h-4 text-amber-500" /> {t('inbox.tomorrow')}
                                  </button>
                                  <button onClick={() => setDeadline(task.id, fmt(nextWeek))} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-500" /> {t('inbox.nextWeek')}
                                  </button>
                                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                  <div className="px-3 py-2">
                                    <input
                                      type="date"
                                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                      value={task.deadline?.split('T')[0] || ''}
                                      onChange={(e) => { if (e.target.value) setDeadline(task.id, e.target.value); }}
                                    />
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
