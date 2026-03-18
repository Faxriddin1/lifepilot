import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectsQuery, useCreateProject } from '@/hooks/useTasks';
import { useUiStore } from '@/store/uiStore';

const PROJECT_COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#4f46e5',
];

/** Страница управления проектами с отображением прогресса выполнения задач. */
export function ProjectsPage() {
  const { data: projects, isLoading } = useProjectsQuery();
  const createProject = useCreateProject();
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), description, color },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setDescription('');
          setColor(PROJECT_COLORS[0]);
        },
      }
    );
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
          {projects?.length ?? 0} {t('projectsList.projects')}
        </p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('projectsList.newProject')}
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title={t('projectsList.noProjects')}
          description={t('projectsList.noProjectsDesc')}
          actionLabel={t('projectsList.createProject')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress =
              project.task_count > 0
                ? Math.round((project.completed_task_count / project.task_count) * 100)
                : 0;

            return (
              <Card key={project.id} hover className="cursor-pointer" onClick={() => navigate(`/tasks?project=${project.id}`)}>
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>
                    {project.completed_task_count} / {project.task_count} {t('projectsList.tasks')}
                  </span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar
                  value={project.completed_task_count}
                  max={project.task_count || 1}
                  variant={progress === 100 ? 'success' : 'primary'}
                  size="sm"
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('projectsList.newProject')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} loading={createProject.isPending}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('projectsList.name')}
            placeholder={t('projectsList.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('projectsList.description')}
            placeholder={t('projectsList.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('projectsList.color')}
            </label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
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
