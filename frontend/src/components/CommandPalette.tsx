import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FolderKanban,
  Columns3,
  Calendar,
  Timer,
  BookOpen,
  Repeat,
  BarChart3,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Target,
  FileBarChart,
  Settings,
  Plus,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  action: () => void;
  group: string;
}

/** Command Palette (⌘K / Ctrl+K) — быстрый поиск и навигация. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme, setQuickAddOpen } = useUiStore();

  // Toggle: Ctrl+K / ⌘K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const pages: CommandItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, labelKey: 'sidebar.dashboard', action: () => go('/dashboard'), group: 'pages' },
    { id: 'inbox', icon: <Inbox className="w-4 h-4" />, labelKey: 'sidebar.inbox', action: () => go('/inbox'), group: 'pages' },
    { id: 'tasks', icon: <CheckSquare className="w-4 h-4" />, labelKey: 'sidebar.myTasks', action: () => go('/tasks'), group: 'pages' },
    { id: 'projects', icon: <FolderKanban className="w-4 h-4" />, labelKey: 'sidebar.projects', action: () => go('/projects'), group: 'pages' },
    { id: 'kanban', icon: <Columns3 className="w-4 h-4" />, labelKey: 'sidebar.kanban', action: () => go('/tasks/kanban'), group: 'pages' },
    { id: 'calendar', icon: <Calendar className="w-4 h-4" />, labelKey: 'sidebar.calendar', action: () => go('/tasks/calendar'), group: 'pages' },
    { id: 'focus', icon: <Timer className="w-4 h-4" />, labelKey: 'sidebar.focus', action: () => go('/focus'), group: 'pages' },
    { id: 'daily-log', icon: <BookOpen className="w-4 h-4" />, labelKey: 'sidebar.dailyLog', action: () => go('/daily-log'), group: 'pages' },
    { id: 'habits', icon: <Repeat className="w-4 h-4" />, labelKey: 'sidebar.habits', action: () => go('/habits'), group: 'pages' },
    { id: 'analytics', icon: <BarChart3 className="w-4 h-4" />, labelKey: 'sidebar.analytics', action: () => go('/analytics'), group: 'pages' },
    { id: 'finance', icon: <Wallet className="w-4 h-4" />, labelKey: 'sidebar.overview', action: () => go('/finance'), group: 'pages' },
    { id: 'transactions', icon: <ArrowLeftRight className="w-4 h-4" />, labelKey: 'sidebar.transactions', action: () => go('/transactions'), group: 'pages' },
    { id: 'budgets', icon: <PiggyBank className="w-4 h-4" />, labelKey: 'sidebar.budgets', action: () => go('/budgets'), group: 'pages' },
    { id: 'goals', icon: <Target className="w-4 h-4" />, labelKey: 'sidebar.goals', action: () => go('/goals'), group: 'pages' },
    { id: 'reports', icon: <FileBarChart className="w-4 h-4" />, labelKey: 'sidebar.reports', action: () => go('/reports'), group: 'pages' },
    { id: 'settings', icon: <Settings className="w-4 h-4" />, labelKey: 'sidebar.settings', action: () => go('/settings'), group: 'pages' },
  ];

  const actions: CommandItem[] = [
    {
      id: 'create-task',
      icon: <Plus className="w-4 h-4" />,
      labelKey: 'commandPalette.createTask',
      action: () => { setQuickAddOpen(true); setOpen(false); },
      group: 'actions',
    },
    {
      id: 'toggle-theme',
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      labelKey: 'commandPalette.toggleTheme',
      action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); },
      group: 'actions',
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg animate-slide-up">
        <Command
          className="bg-background border border-border rounded-xl shadow-lg overflow-hidden"
          label={t('commandPalette.label', { defaultValue: 'Command palette' })}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-4 h-4 text-foreground-tertiary flex-shrink-0" />
            <Command.Input
              placeholder={t('commandPalette.placeholder', { defaultValue: 'Search pages, actions...' })}
              className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-foreground-tertiary outline-none"
            />
            <kbd className="text-[10px] text-foreground-tertiary bg-surface px-1.5 py-0.5 rounded border border-border">ESC</kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-8 text-center text-sm text-foreground-secondary">
              {t('commandPalette.noResults', { defaultValue: 'No results found.' })}
            </Command.Empty>

            {/* Pages */}
            <Command.Group heading={t('commandPalette.pages', { defaultValue: 'Pages' })} className="mb-2">
              <p className="px-2 py-1.5 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                {t('commandPalette.pages', { defaultValue: 'Pages' })}
              </p>
              {pages.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.id} ${t(item.labelKey)}`}
                  onSelect={item.action}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground-secondary cursor-pointer transition-colors data-[selected=true]:bg-surface data-[selected=true]:text-foreground"
                >
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions */}
            <Command.Group heading={t('commandPalette.actions', { defaultValue: 'Actions' })}>
              <p className="px-2 py-1.5 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                {t('commandPalette.actions', { defaultValue: 'Actions' })}
              </p>
              {actions.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.id} ${t(item.labelKey, { defaultValue: item.id })}`}
                  onSelect={item.action}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground-secondary cursor-pointer transition-colors data-[selected=true]:bg-surface data-[selected=true]:text-foreground"
                >
                  {item.icon}
                  <span>{t(item.labelKey, { defaultValue: item.id.replace('-', ' ') })}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
