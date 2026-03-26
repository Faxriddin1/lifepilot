import { Badge } from '@/components/ui/Badge';
import type { ColumnDef } from './AdminResourcePage';

/** Форматирует дату в краткий формат. */
const fmtDate = (val: string) => val ? new Date(val).toLocaleDateString('ru-RU') : '—';
const fmtDateTime = (val: string) => val ? new Date(val).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

/** Рендер boolean значения. */
const boolBadge = (val: boolean) => (
  <span className={val ? 'text-success font-medium' : 'text-danger font-medium'}>{val ? '✅ Да' : '❌ Нет'}</span>
);

// ─── Users ───────────────────────────────────────────────────────
export const usersColumns: ColumnDef[] = [
  { key: 'email', label: 'Email', render: (v) => <span className="font-medium text-accent">{v}</span> },
  { key: 'name', label: 'Имя' },
  { key: 'is_active', label: 'Активен', render: (v) => boolBadge(v) },
  { key: 'is_staff', label: 'Админ', render: (v) => boolBadge(v) },
  { key: 'tasks_count', label: 'Задач' },
  { key: 'date_joined', label: 'Регистрация', render: (v) => fmtDate(v) },
  { key: 'last_seen_at', label: 'Последний визит', render: (v) => v ? fmtDateTime(v) : '—' },
];

export const usersFilters = [
  { key: 'is_active', label: 'Все статусы', options: [{ value: 'true', label: 'Активные' }, { value: 'false', label: 'Заблокированные' }] },
  { key: 'is_staff', label: 'Все роли', options: [{ value: 'true', label: 'Админы' }, { value: 'false', label: 'Обычные' }] },
];

// ─── Tasks ───────────────────────────────────────────────────────
export const tasksColumns: ColumnDef[] = [
  { key: 'title', label: 'Название', width: '30%' },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'status', label: 'Статус', render: (v) => <Badge variant="default" size="sm">{v}</Badge> },
  { key: 'priority', label: 'Приоритет', render: (v) => <Badge variant="default" size="sm">{v}</Badge> },
  { key: 'project_name', label: 'Проект', render: (v) => v || '—' },
  { key: 'deadline', label: 'Дедлайн', render: (v) => fmtDate(v) },
  { key: 'created_at', label: 'Создана', render: (v) => fmtDate(v) },
];

export const tasksFilters = [
  { key: 'status', label: 'Все статусы', options: [
    { value: 'inbox', label: 'Входящие' }, { value: 'in_progress', label: 'В работе' },
    { value: 'review', label: 'Ревью' }, { value: 'done', label: 'Готово' }, { value: 'archived', label: 'Архив' },
  ]},
  { key: 'priority', label: 'Все приоритеты', options: [
    { value: 'p1', label: 'Срочный' }, { value: 'p2', label: 'Высокий' },
    { value: 'p3', label: 'Средний' }, { value: 'p4', label: 'Низкий' },
  ]},
];

// ─── Projects ────────────────────────────────────────────────────
export const projectsColumns: ColumnDef[] = [
  { key: 'name', label: 'Название', width: '30%' },
  { key: 'user_email', label: 'Владелец', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'task_count', label: 'Задач' },
  { key: 'is_archived', label: 'Архив', render: (v) => boolBadge(!v) },
  { key: 'created_at', label: 'Создан', render: (v) => fmtDate(v) },
];

// ─── Accounts ────────────────────────────────────────────────────
export const accountsColumns: ColumnDef[] = [
  { key: 'name', label: 'Название' },
  { key: 'user_email', label: 'Владелец', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'account_type', label: 'Тип' },
  { key: 'balance', label: 'Баланс', render: (v, r) => <span className="font-mono font-medium">{Number(v).toLocaleString()} {r.currency}</span> },
  { key: 'is_active', label: 'Активен', render: (v) => boolBadge(v) },
];

// ─── Transactions ────────────────────────────────────────────────
export const transactionsColumns: ColumnDef[] = [
  { key: 'date', label: 'Дата', render: (v) => fmtDate(v) },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'transaction_type', label: 'Тип', render: (v) => (
    <span className={v === 'income' ? 'text-success font-medium' : v === 'expense' ? 'text-danger font-medium' : 'text-accent font-medium'}>
      {v === 'income' ? '↑ Доход' : v === 'expense' ? '↓ Расход' : '↔ Перевод'}
    </span>
  )},
  { key: 'amount', label: 'Сумма', render: (v, r) => <span className="font-mono font-medium">{Number(v).toLocaleString()} {r.currency}</span> },
  { key: 'category_name', label: 'Категория', render: (v) => v || '—' },
  { key: 'account_name', label: 'Счёт' },
];

export const transactionsFilters = [
  { key: 'type', label: 'Все типы', options: [
    { value: 'income', label: 'Доход' }, { value: 'expense', label: 'Расход' }, { value: 'transfer', label: 'Перевод' },
  ]},
];

// ─── Budgets ─────────────────────────────────────────────────────
export const budgetsColumns: ColumnDef[] = [
  { key: 'category_name', label: 'Категория' },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'amount', label: 'Сумма', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'period', label: 'Период' },
  { key: 'start_date', label: 'Начало', render: (v) => fmtDate(v) },
  { key: 'end_date', label: 'Конец', render: (v) => fmtDate(v) },
];

// ─── Goals ───────────────────────────────────────────────────────
export const goalsColumns: ColumnDef[] = [
  { key: 'name', label: 'Название' },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'target_amount', label: 'Цель', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'current_amount', label: 'Текущая', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'progress', label: 'Прогресс', render: (v) => (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-elevated rounded-full overflow-hidden">
        <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
      <span className="text-xs font-medium">{v}%</span>
    </div>
  )},
  { key: 'is_completed', label: 'Готово', render: (v) => boolBadge(v) },
  { key: 'deadline', label: 'Дедлайн', render: (v) => fmtDate(v) },
];

// ─── Focus Sessions ──────────────────────────────────────────────
export const focusSessionsColumns: ColumnDef[] = [
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'session_type', label: 'Тип' },
  { key: 'status', label: 'Статус', render: (v) => (
    <Badge variant={v === 'completed' ? 'success' : v === 'active' ? 'warning' : 'default'} size="sm">{v}</Badge>
  )},
  { key: 'duration', label: 'Минут' },
  { key: 'task_title', label: 'Задача', render: (v) => v || '—' },
  { key: 'start_time', label: 'Начало', render: (v) => fmtDateTime(v) },
];

// ─── Habits ──────────────────────────────────────────────────────
export const habitsColumns: ColumnDef[] = [
  { key: 'name', label: 'Название' },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'frequency', label: 'Частота' },
  { key: 'target_count', label: 'Цель' },
  { key: 'is_active', label: 'Активна', render: (v) => boolBadge(v) },
  { key: 'created_at', label: 'Создана', render: (v) => fmtDate(v) },
];

// ─── Daily Logs ──────────────────────────────────────────────────
export const dailyLogsColumns: ColumnDef[] = [
  { key: 'date', label: 'Дата', render: (v) => fmtDate(v) },
  { key: 'user_email', label: 'Пользователь', render: (v) => <span className="text-xs text-foreground-secondary">{v}</span> },
  { key: 'mood', label: 'Настроение', render: (v) => v || '—' },
  { key: 'energy_level', label: 'Энергия', render: (v) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-3 h-3 rounded-sm ${i <= v ? 'bg-warning' : 'bg-elevated'}`} />
      ))}
    </div>
  )},
  { key: 'done', label: 'Сделано', render: (v) => v ? <span className="truncate block max-w-[200px]">{v}</span> : '—' },
];
