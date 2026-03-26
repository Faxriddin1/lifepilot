import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useCallback } from 'react';
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
  ChevronsLeft,
  ChevronsRight,
  X,
  GraduationCap,
} from 'lucide-react';
import clsx from 'clsx';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: string;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    titleKey: 'sidebar.main',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, labelKey: 'sidebar.dashboard' },
      { to: '/inbox', icon: <Inbox className="w-5 h-5" />, labelKey: 'sidebar.inbox' },
    ],
  },
  {
    titleKey: 'sidebar.tasks',
    items: [
      { to: '/tasks', icon: <CheckSquare className="w-5 h-5" />, labelKey: 'sidebar.myTasks' },
      { to: '/projects', icon: <FolderKanban className="w-5 h-5" />, labelKey: 'sidebar.projects' },
      { to: '/tasks/kanban', icon: <Columns3 className="w-5 h-5" />, labelKey: 'sidebar.kanban' },
      { to: '/tasks/calendar', icon: <Calendar className="w-5 h-5" />, labelKey: 'sidebar.calendar' },
    ],
  },
  {
    titleKey: 'sidebar.productivity',
    items: [
      { to: '/focus', icon: <Timer className="w-5 h-5" />, labelKey: 'sidebar.focus' },
      { to: '/daily-log', icon: <BookOpen className="w-5 h-5" />, labelKey: 'sidebar.dailyLog' },
      { to: '/habits', icon: <Repeat className="w-5 h-5" />, labelKey: 'sidebar.habits' },
      { to: '/analytics', icon: <BarChart3 className="w-5 h-5" />, labelKey: 'sidebar.analytics' },
    ],
  },
  {
    titleKey: 'sidebar.learning',
    items: [
      { to: '/learning', icon: <GraduationCap className="w-5 h-5" />, labelKey: 'sidebar.myGoals' },
    ],
  },
  {
    titleKey: 'sidebar.finance',
    items: [
      { to: '/finance', icon: <Wallet className="w-5 h-5" />, labelKey: 'sidebar.overview' },
      { to: '/transactions', icon: <ArrowLeftRight className="w-5 h-5" />, labelKey: 'sidebar.transactions' },
      { to: '/budgets', icon: <PiggyBank className="w-5 h-5" />, labelKey: 'sidebar.budgets' },
      { to: '/goals', icon: <Target className="w-5 h-5" />, labelKey: 'sidebar.goals' },
      { to: '/reports', icon: <FileBarChart className="w-5 h-5" />, labelKey: 'sidebar.reports' },
    ],
  },
];

/** Боковая панель навигации с секциями меню, профилем и возможностью сворачивания. Shortcut: [ */
export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  // Keyboard shortcut: [ to toggle sidebar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      toggleSidebar();
    }
    // Escape closes mobile sidebar
    if (e.key === 'Escape' && mobileSidebarOpen) {
      closeMobileSidebar();
    }
  }, [toggleSidebar, mobileSidebarOpen, closeMobileSidebar]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-md transition-colors duration-normal',
      sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
      isActive
        ? 'bg-accent/10 text-accent border-l-2 border-accent font-medium'
        : 'text-foreground-secondary hover:bg-surface hover:text-foreground border-l-2 border-transparent'
    );

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={closeMobileSidebar}
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 flex flex-col bg-sidebar border-r border-border overflow-hidden z-30',
          // Desktop: smooth width transition
          'lg:translate-x-0 lg:transition-[width] lg:duration-slow lg:ease-[var(--ease-out)]',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile: slide in as sheet (280px)
          'w-[280px] transition-transform duration-slow ease-[var(--ease-out)]',
          mobileSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header: Logo / User + toggle/close */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-foreground-inverse">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || user?.email || 'User'}
              </p>
              <p className="text-xs text-foreground-secondary truncate">{user?.email}</p>
            </div>
          )}
          {/* Mobile close button */}
          {mobileSidebarOpen && (
            <button
              onClick={closeMobileSidebar}
              className="lg:hidden p-1 rounded-md text-foreground-tertiary hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Desktop collapse toggle in header */}
          {!mobileSidebarOpen && !sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1 rounded-md text-foreground-tertiary hover:text-foreground hover:bg-surface transition-colors"
              title={t('sidebar.collapse') + ' ( [ )'}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={clsx('flex-1 overflow-y-auto px-2 py-3 scrollbar-thin', sidebarCollapsed && !mobileSidebarOpen ? 'space-y-2' : 'space-y-5')}>
          {navSections.map((section, idx) => {
            const isCollapsed = sidebarCollapsed && !mobileSidebarOpen;
            return (
              <div key={section.titleKey}>
                {!isCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t(section.titleKey)}
                  </p>
                ) : idx > 0 ? (
                  <div className="mx-3 mb-1 border-t border-border" />
                ) : null}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={navLinkClass}
                      title={isCollapsed ? t(item.labelKey) : undefined}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!isCollapsed && (
                        <span className="text-sm truncate">{t(item.labelKey)}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: Settings + Collapse */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          <NavLink
            to="/settings"
            className={navLinkClass}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileSidebarOpen) && <span className="text-sm">{t('sidebar.settings')}</span>}
          </NavLink>

          {/* Desktop-only collapse/expand button at bottom */}
          <button
            onClick={toggleSidebar}
            className={clsx(
              'hidden lg:flex items-center gap-3 w-full rounded-md text-foreground-secondary hover:bg-surface transition-colors duration-normal',
              sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
            )}
            title={sidebarCollapsed ? t('sidebar.expand') + ' ( [ )' : t('sidebar.collapse') + ' ( [ )'}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronsLeft className="w-5 h-5" />
                <span className="text-sm">{t('sidebar.collapse')}</span>
                <kbd className="ml-auto text-[10px] text-foreground-tertiary bg-surface px-1.5 py-0.5 rounded border border-border">[</kbd>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
