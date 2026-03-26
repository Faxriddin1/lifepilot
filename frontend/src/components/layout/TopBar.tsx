import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Hamburger + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 -ml-2 rounded-md text-foreground-secondary hover:bg-surface transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add — только на страницах с модалкой создания */}
          {showAddButton && (
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setQuickAddOpen(true)}>
              {t('topbar.add')}
            </Button>
          )}

          {/* Search trigger → opens Command Palette (⌘K) */}
          <button
            onClick={() => {
              // Dispatch Ctrl+K to open Command Palette
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-2 h-8 px-3 border border-border rounded-md text-sm text-foreground-secondary hover:bg-surface transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">{t('topbar.search')}</span>
            <kbd className="ml-1 text-[10px] text-foreground-tertiary bg-surface px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="sm:hidden p-2 rounded-md text-foreground-secondary hover:bg-surface transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Focus Timer Mini Widget */}
          <FocusMiniWidget />

          {/* Notifications */}
          <button className="relative p-2 rounded-md text-foreground-secondary hover:bg-surface transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground-inverse">
                  {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-foreground-tertiary" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg py-1 animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-foreground-secondary truncate">{user?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground-secondary hover:bg-surface hover:text-foreground"
                >
                  <User className="w-4 h-4" />
                  {t('topbar.profile')}
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground-secondary hover:bg-surface hover:text-foreground"
                >
                  <Settings className="w-4 h-4" />
                  {t('topbar.settings')}
                </Link>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger hover:bg-danger-bg"
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 cursor-pointer"
      onClick={() => navigate('/focus')}
    >
      <Timer className={clsx('w-4 h-4 text-accent', !isPaused && 'animate-pulse')} />
      <span className="text-sm font-mono font-semibold text-accent">
        {formatSeconds(remainingSeconds)}
      </span>
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {isPaused ? (
          <button
            onClick={resume}
            className="p-1 rounded hover:bg-accent/20 text-accent"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={pause}
            className="p-1 rounded hover:bg-accent/20 text-accent"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={stop}
          className="p-1 rounded hover:bg-danger-bg text-danger"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
