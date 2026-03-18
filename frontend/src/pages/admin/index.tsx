export { AdminLayout } from './AdminLayout';
export { AdminDashboard } from './AdminDashboard';

import { AdminResourcePage } from './AdminResourcePage';
import * as R from './resources';

export const AdminUsersPage = () => (
  <AdminResourcePage resource="users" title="Пользователи" columns={R.usersColumns} searchable isUsers filters={R.usersFilters} />
);
export const AdminTasksPage = () => (
  <AdminResourcePage resource="tasks" title="Задачи" columns={R.tasksColumns} searchable filters={R.tasksFilters} />
);
export const AdminProjectsPage = () => (
  <AdminResourcePage resource="projects" title="Проекты" columns={R.projectsColumns} searchable />
);
export const AdminAccountsPage = () => (
  <AdminResourcePage resource="accounts" title="Счета" columns={R.accountsColumns} searchable />
);
export const AdminTransactionsPage = () => (
  <AdminResourcePage resource="transactions" title="Транзакции" columns={R.transactionsColumns} searchable filters={R.transactionsFilters} />
);
export const AdminBudgetsPage = () => (
  <AdminResourcePage resource="budgets" title="Бюджеты" columns={R.budgetsColumns} />
);
export const AdminGoalsPage = () => (
  <AdminResourcePage resource="goals" title="Финансовые цели" columns={R.goalsColumns} searchable />
);
export const AdminFocusSessionsPage = () => (
  <AdminResourcePage resource="focus-sessions" title="Фокус-сессии" columns={R.focusSessionsColumns} />
);
export const AdminHabitsPage = () => (
  <AdminResourcePage resource="habits" title="Привычки" columns={R.habitsColumns} searchable />
);
export const AdminDailyLogsPage = () => (
  <AdminResourcePage resource="daily-logs" title="Дневники" columns={R.dailyLogsColumns} />
);
