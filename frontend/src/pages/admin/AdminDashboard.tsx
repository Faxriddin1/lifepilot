import { useQuery } from '@tanstack/react-query';
import { Users, ListTodo, FolderKanban, ArrowLeftRight, Timer, Sparkles, Target, Wallet } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/ui/Spinner';

/** Карточка статистики */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Users; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/** Страница дашборда админ-панели. */
export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const { users, tasks, projects, finance, productivity, recent_signups } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Обзор системы LifePilot</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Пользователи" value={users.total} sub={`+${users.new_week} за неделю`} color="bg-blue-500" />
        <StatCard icon={ListTodo} label="Задачи" value={tasks.total} sub={`${tasks.completed} завершено`} color="bg-green-500" />
        <StatCard icon={FolderKanban} label="Проекты" value={projects.total} color="bg-purple-500" />
        <StatCard icon={ArrowLeftRight} label="Транзакции" value={finance.total_transactions} sub={`${finance.transactions_today} сегодня`} color="bg-amber-500" />
        <StatCard icon={Wallet} label="Счета" value={finance.total_accounts} color="bg-cyan-500" />
        <StatCard icon={Target} label="Цели" value={finance.total_goals} color="bg-pink-500" />
        <StatCard icon={Timer} label="Фокус-сессии" value={productivity.total_focus_sessions} sub={`${productivity.total_focus_minutes} мин`} color="bg-orange-500" />
        <StatCard icon={Sparkles} label="Привычки" value={productivity.total_habits} color="bg-emerald-500" />
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-1">Общий доход</p>
          <p className="text-xl font-bold text-green-600">${finance.total_income.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-1">Общий расход</p>
          <p className="text-xl font-bold text-red-600">${finance.total_expense.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-1">Активных за неделю</p>
          <p className="text-xl font-bold text-blue-600">{users.active_week} <span className="text-sm font-normal text-gray-400">из {users.total}</span></p>
        </div>
      </div>

      {/* Task statuses + Recent signups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task statuses */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Статусы задач</h3>
          <div className="space-y-3">
            {Object.entries(tasks.statuses || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${tasks.total ? ((count as number) / tasks.total * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent signups */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Последние регистрации</h3>
          <div className="space-y-2">
            {(recent_signups || []).slice(0, 8).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600">
                    {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name || u.email}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(u.date_joined).toLocaleDateString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User growth */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Рост пользователей (7 дней)</h3>
        <div className="flex items-end gap-2 h-24">
          {(users.growth || []).map((d: any) => {
            const maxCount = Math.max(...(users.growth || []).map((g: any) => g.count), 1);
            const height = d.count > 0 ? Math.max((d.count / maxCount) * 100, 8) : 4;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-gray-400">
                  {new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
