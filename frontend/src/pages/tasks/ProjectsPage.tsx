import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderKanban, Plus, Briefcase, GraduationCap, Home, Heart,
  Plane, Code, ShoppingBag, Dumbbell, Book, Music, Camera,
  Palette, Globe, Car, Utensils, Baby, Dog, Sparkles, PenTool,
  MoreHorizontal, Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProjectsQuery, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useTasks';
import { useUiStore } from '@/store/uiStore';
import type { Project } from '@/types';

const PROJECT_COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#4f46e5', '#059669', '#ea580c',
  '#0284c7', '#9333ea', '#c026d3', '#65a30d',
];

/** Иконки для проектов. */
const PROJECT_ICONS = [
  { icon: FolderKanban, name: 'folder' },
  { icon: Briefcase, name: 'briefcase' },
  { icon: GraduationCap, name: 'education' },
  { icon: Home, name: 'home' },
  { icon: Heart, name: 'health' },
  { icon: Plane, name: 'travel' },
  { icon: Code, name: 'code' },
  { icon: ShoppingBag, name: 'shopping' },
  { icon: Dumbbell, name: 'fitness' },
  { icon: Book, name: 'book' },
  { icon: Music, name: 'music' },
  { icon: Camera, name: 'photo' },
  { icon: Palette, name: 'design' },
  { icon: Globe, name: 'web' },
  { icon: Car, name: 'auto' },
  { icon: Utensils, name: 'food' },
  { icon: Baby, name: 'family' },
  { icon: Dog, name: 'pets' },
  { icon: Sparkles, name: 'ideas' },
  { icon: PenTool, name: 'writing' },
];

interface ProjectTemplate {
  name_ru: string;
  name_en: string;
  name_uz: string;
  name_uz_cyr: string;
  icon: string;
  color: string;
}

/** Готовые шаблоны проектов. */
const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { name_ru: 'Работа', name_en: 'Work', name_uz: 'Ish', name_uz_cyr: 'Иш', icon: 'briefcase', color: '#2563eb' },
  { name_ru: 'Учёба', name_en: 'Study', name_uz: "O'qish", name_uz_cyr: 'Ўқиш', icon: 'education', color: '#7c3aed' },
  { name_ru: 'Дом', name_en: 'Home', name_uz: 'Uy', name_uz_cyr: 'Уй', icon: 'home', color: '#16a34a' },
  { name_ru: 'Здоровье', name_en: 'Health', name_uz: "Sog'liq", name_uz_cyr: 'Соғлиқ', icon: 'health', color: '#dc2626' },
  { name_ru: 'Путешествия', name_en: 'Travel', name_uz: 'Sayohat', name_uz_cyr: 'Саёҳат', icon: 'travel', color: '#0891b2' },
  { name_ru: 'Фитнес', name_en: 'Fitness', name_uz: 'Fitnes', name_uz_cyr: 'Фитнес', icon: 'fitness', color: '#d97706' },
  { name_ru: 'Покупки', name_en: 'Shopping', name_uz: 'Xaridlar', name_uz_cyr: 'Харидлар', icon: 'shopping', color: '#be185d' },
  { name_ru: 'Чтение', name_en: 'Reading', name_uz: "O'qish", name_uz_cyr: 'Ўқиш', icon: 'book', color: '#4f46e5' },
  { name_ru: 'Разработка', name_en: 'Development', name_uz: 'Dasturlash', name_uz_cyr: 'Дастурлаш', icon: 'code', color: '#059669' },
  { name_ru: 'Дизайн', name_en: 'Design', name_uz: 'Dizayn', name_uz_cyr: 'Дизайн', icon: 'design', color: '#c026d3' },
  { name_ru: 'Семья', name_en: 'Family', name_uz: 'Oila', name_uz_cyr: 'Оила', icon: 'family', color: '#ea580c' },
  { name_ru: 'Идеи', name_en: 'Ideas', name_uz: 'Gʻoyalar', name_uz_cyr: 'Ғоялар', icon: 'ideas', color: '#9333ea' },
];

/** Получает React-компонент иконки по имени. */
function getIconComponent(iconName: string) {
  return PROJECT_ICONS.find((i) => i.name === iconName)?.icon || FolderKanban;
}

/** Страница управления проектами с шаблонами и иконками. */
export function ProjectsPage() {
  const { data: projects, isLoading } = useProjectsQuery();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const quickAddOpen = useUiStore((s) => s.quickAddOpen);
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'templates' | 'custom'>('templates');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    if (quickAddOpen) {
      setShowModal(true);
      setQuickAddOpen(false);
    }
  }, [quickAddOpen, setQuickAddOpen]);

  const getTemplateName = (tmpl: ProjectTemplate) => {
    if (lang === 'ru') return tmpl.name_ru;
    if (lang === 'uz') return tmpl.name_uz;
    if (lang === 'uz-cyr') return tmpl.name_uz_cyr;
    return tmpl.name_en;
  };

  const handleCreateFromTemplate = (tmpl: ProjectTemplate) => {
    createProject.mutate(
      { name: getTemplateName(tmpl), description: '', color: tmpl.color, icon: tmpl.icon },
      { onSuccess: () => { setShowModal(false); } }
    );
  };

  const handleCreateCustom = () => {
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), description, color, icon: selectedIcon },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setDescription('');
          setColor(PROJECT_COLORS[0]);
          setSelectedIcon('folder');
          setMode('templates');
        },
      }
    );
  };

  const openModal = () => {
    setMode('templates');
    setShowModal(true);
  };

  const openEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setColor(project.color);
    setSelectedIcon(project.icon || 'folder');
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleUpdateProject = () => {
    if (!editProject || !name.trim()) return;
    updateProject.mutate(
      { id: editProject.id, data: { name: name.trim(), description, color, icon: selectedIcon } },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditProject(null);
        },
      }
    );
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('projectsNew.confirmDelete'))) {
      deleteProject.mutate(id);
    }
    setContextMenu(null);
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
        <Button icon={<Plus className="w-4 h-4" />} onClick={openModal}>
          {t('projectsList.newProject')}
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title={t('projectsList.noProjects')}
          description={t('projectsList.noProjectsDesc')}
          actionLabel={t('projectsList.createProject')}
          onAction={openModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress =
              project.task_count > 0
                ? Math.round((project.completed_task_count / project.task_count) * 100)
                : 0;
            const IconComp = getIconComponent(project.icon || 'folder');

            return (
              <Card key={project.id} hover className="cursor-pointer group relative" onClick={() => navigate(`/tasks?project=${project.id}`)}>
                {/* Context menu button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                  {contextMenu === project.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} />
                      <div className="absolute right-0 top-7 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-40">
                        <button onClick={(e) => openEdit(project, e)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                          <PenTool className="w-4 h-4 text-blue-500" />
                          {t('projectsNew.edit')}
                        </button>
                        <button onClick={(e) => handleDeleteProject(project.id, e)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                          {t('projectsNew.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <IconComp className="w-5 h-5" style={{ color: project.color }} />
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
        onClose={() => { setShowModal(false); setMode('templates'); }}
        title={t('projectsList.newProject')}
        footer={mode === 'custom' ? (
          <>
            <Button variant="secondary" onClick={() => setMode('templates')}>
              {`← ${t('projectsNew.back')}`}
            </Button>
            <Button onClick={handleCreateCustom} loading={createProject.isPending} disabled={!name.trim()}>
              {t('common.create')}
            </Button>
          </>
        ) : undefined}
      >
        {mode === 'templates' ? (
          <div className="space-y-4">
            {/* Quick templates */}
            <p className="text-sm text-gray-500">
              {t('projectsNew.chooseTemplate')}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PROJECT_TEMPLATES.map((tmpl) => {
                const Icon = getIconComponent(tmpl.icon);
                return (
                  <button
                    key={tmpl.name_en}
                    onClick={() => handleCreateFromTemplate(tmpl)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: tmpl.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                      {getTemplateName(tmpl)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom button */}
            <button
              onClick={() => setMode('custom')}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
            >
              <PenTool className="w-4 h-4" />
              {t('projectsNew.createCustom')}
            </button>
          </div>
        ) : (
          /* Custom project form */
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

            {/* Icon selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('projectsNew.icon')}
              </label>
              <div className="grid grid-cols-10 gap-1.5">
                {PROJECT_ICONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setSelectedIcon(item.name)}
                      className={clsx(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                        selectedIcon === item.name
                          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                      )}
                    >
                      <Icon className={clsx(
                        'w-4.5 h-4.5',
                        selectedIcon === item.name ? 'text-blue-600' : 'text-gray-500',
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('projectsList.color')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={clsx(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditProject(null); }}
        title={t('projectsNew.editProject')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditProject(null); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateProject} loading={updateProject.isPending} disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('projectsList.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('projectsList.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('projectsNew.icon')}
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {PROJECT_ICONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => setSelectedIcon(item.name)}
                    className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                      selectedIcon === item.name
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                    )}
                  >
                    <Icon className={clsx(
                      'w-4.5 h-4.5',
                      selectedIcon === item.name ? 'text-blue-600' : 'text-gray-500',
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('projectsList.color')}
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105',
                  )}
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
