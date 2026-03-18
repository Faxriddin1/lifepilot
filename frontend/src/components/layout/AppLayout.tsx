import { Outlet, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui/Spinner';

/** Основной layout приложения с боковой панелью и верхней навигацией. Защищает маршруты авторизацией. */
export function AppLayout() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
