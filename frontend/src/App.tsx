import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { TaskListPage } from '@/pages/tasks/TaskListPage';
import { KanbanPage } from '@/pages/tasks/KanbanPage';
import { ProjectsPage } from '@/pages/tasks/ProjectsPage';
import { CalendarPage } from '@/pages/tasks/CalendarPage';
import { FocusTimerPage } from '@/pages/productivity/FocusTimerPage';
import { HabitsPage } from '@/pages/productivity/HabitsPage';
import { AnalyticsPage } from '@/pages/productivity/AnalyticsPage';
import { DailyLogPage } from '@/pages/productivity/DailyLogPage';
import { InboxPage } from '@/pages/tasks/InboxPage';
import { FinanceOverviewPage } from '@/pages/finance/FinanceOverviewPage';
import { TransactionsPage } from '@/pages/finance/TransactionsPage';
import { BudgetsPage } from '@/pages/finance/BudgetsPage';
import { GoalsPage } from '@/pages/finance/GoalsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import {
  AdminLayout, AdminDashboard,
  AdminUsersPage, AdminTasksPage, AdminProjectsPage,
  AdminAccountsPage, AdminTransactionsPage, AdminBudgetsPage,
  AdminGoalsPage, AdminFocusSessionsPage, AdminHabitsPage, AdminDailyLogsPage,
} from '@/pages/admin';
import { LandingPage } from '@/pages/landing/LandingPage';
import { LegalPage } from '@/pages/landing/LegalPage';
import { AboutPage } from '@/pages/landing/AboutPage';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

function AppContent() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const initUi = useUiStore((s) => s.initFromStorage);

  useEffect(() => {
    initUi();
    loadFromStorage();
  }, [loadFromStorage, initUi]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/legal/:type" element={<LegalPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/kanban" element={<KanbanPage />} />
          <Route path="/tasks/calendar" element={<CalendarPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/focus" element={<FocusTimerPage />} />
          <Route path="/daily-log" element={<DailyLogPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/finance" element={<FinanceOverviewPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Admin panel */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="budgets" element={<AdminBudgetsPage />} />
          <Route path="goals" element={<AdminGoalsPage />} />
          <Route path="focus-sessions" element={<AdminFocusSessionsPage />} />
          <Route path="habits" element={<AdminHabitsPage />} />
          <Route path="daily-logs" element={<AdminDailyLogsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
