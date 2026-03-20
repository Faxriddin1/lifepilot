import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, ListTodo, FolderKanban,
  Wallet, ArrowLeftRight, PiggyBank, Target,
  Timer, Sparkles, BookOpen, ArrowLeft, Shield,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/users', icon: Users, label: 'Пользователи' },
  { path: '/admin/tasks', icon: ListTodo, label: 'Задачи' },
  { path: '/admin/projects', icon: FolderKanban, label: 'Проекты' },
  { path: '/admin/accounts', icon: Wallet, label: 'Счета' },
  { path: '/admin/transactions', icon: ArrowLeftRight, label: 'Транзакции' },
  { path: '/admin/budgets', icon: PiggyBank, label: 'Бюджеты' },
  { path: '/admin/goals', icon: Target, label: 'Цели' },
  { path: '/admin/focus-sessions', icon: Timer, label: 'Фокус-сессии' },
  { path: '/admin/habits', icon: Sparkles, label: 'Привычки' },
  { path: '/admin/daily-logs', icon: BookOpen, label: 'Дневники' },
];

/** Layout для админ-панели с боковой навигацией. */
export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">LifePilot</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Back to app */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться в приложение
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
