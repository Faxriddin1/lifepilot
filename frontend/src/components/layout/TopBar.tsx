import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Bell, ChevronDown, User, Settings, LogOut, Menu, Play, Pause, Square, Timer } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useFocusStore } from '@/store/focusStore';
import { useFocusSession } from '@/hooks/useFocus';
import { formatSeconds } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';

/** Верхняя панель с заголовком страницы, поиском, уведомлениями и меню пользователя. */
export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const setQuickAddOpen = useUiStore((s) => s.setQuickAddOpen);

  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const pagesWithAdd = ['/tasks', '/inbox', '/projects', '/transactions', '/budgets', '/goals', '/habits'];
  const showAddButton = pagesWithAdd.includes(location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const pageTitle = t(`topbar.routes.${location.pathname}`, { defaultValue: 'LifePilot' });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Hamburger + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add — только на страницах с модалкой создания */}
          {showAddButton && (
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setQuickAddOpen(true)}>
              {t('topbar.add')}
            </Button>
          )}

          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('topbar.search')}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }
                  }}
                  className="w-56 h-8 pl-8 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Focus Timer Mini Widget */}
          <FocusMiniWidget />

          {/* Notifications */}
          <button className="relative p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <User className="w-4 h-4" />
                  {t('topbar.profile')}
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4" />
                  {t('topbar.settings')}
                </a>
                <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('topbar.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function FocusMiniWidget() {
  const navigate = useNavigate();
  const { activeSession, elapsedSeconds, isPaused } = useFocusStore();
  const { pause, resume, stop } = useFocusSession();

  const totalSeconds = activeSession ? activeSession.duration * 60 : 0;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  if (!activeSession) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 cursor-pointer"
      onClick={() => navigate('/focus')}
    >
      <Timer className={clsx('w-4 h-4 text-primary-600', !isPaused && 'animate-pulse')} />
      <span className="text-sm font-mono font-semibold text-primary-700 dark:text-primary-300">
        {formatSeconds(remainingSeconds)}
      </span>
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {isPaused ? (
          <button
            onClick={resume}
            className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={pause}
            className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={stop}
          className="p-1 rounded hover:bg-danger-100 dark:hover:bg-danger-800 text-danger-600"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
