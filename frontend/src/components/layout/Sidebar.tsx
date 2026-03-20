import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
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
      { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, labelKey: 'sidebar.dashboard' },
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

/** Боковая панель навигации с секциями меню, профилем пользователя и возможностью сворачивания. */
export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-60',
          'lg:translate-x-0 lg:z-30',
          mobileSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0 z-30'
        )}
      >
      {/* User section */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user?.first_name
                ? `${user.first_name} ${user.last_name || ''}`
                : user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-6 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.titleKey}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {t(section.titleKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-md transition-colors duration-150',
                      sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    )
                  }
                  title={sidebarCollapsed ? t(item.labelKey) : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="text-sm truncate">{t(item.labelKey)}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings + Collapse */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-2 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-md transition-colors duration-150',
              sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{t('sidebar.settings')}</span>}
        </NavLink>

        <button
          onClick={toggleSidebar}
          className={clsx(
            'flex items-center gap-3 w-full rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150',
            sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
          )}
          title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5" />
              <span className="text-sm">{t('sidebar.collapse')}</span>
            </>
          )}
        </button>

      </div>
      </aside>
    </>
  );
}
