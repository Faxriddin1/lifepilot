# ProductFlow

All-in-one SaaS платформа для управления задачами, продуктивностью и финансами.

## Tech Stack

- **Backend:** Django 5.0 + Django REST Framework + PostgreSQL 16 + Redis 7 + Celery
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS 3 + Zustand + TanStack Query
- **Auth:** JWT (simplejwt) — access 30 мин, refresh 7 дней с ротацией + Google OAuth 2.0
- **i18n:** react-i18next (RU/EN), переключение через Settings
- **Infra:** Docker Compose (db, redis, backend, frontend, celery)

## Запуск

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:3000/admin
- Django Admin: http://localhost:8000/admin/
- Swagger UI: http://localhost:8000/api/v1/docs/
- ReDoc: http://localhost:8000/api/v1/redoc/

### Без Docker

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py create_default_categories --skip-existing
python manage.py runserver 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run dev
```

## Структура проекта

```
PM/
├── backend/
│   ├── config/              # Settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── users/           # Custom User model (UUID, email auth, Google OAuth)
│   │   ├── tasks/           # Task, Project (subtasks до 3 уровней)
│   │   ├── productivity/    # FocusSession, Habit, HabitLog, DailyLog
│   │   ├── finance/         # Account, Category, Transaction, Budget, Goal
│   │   ├── analytics/       # Dashboard, Productivity/Finance агрегация
│   │   └── admin_panel/     # Админ-панель API (dashboard, CRUD всех моделей)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── types/           # TypeScript интерфейсы и enums
│   │   ├── api/             # Axios client + API модули (через Vite proxy)
│   │   ├── store/           # Zustand stores (auth, ui)
│   │   ├── hooks/           # React Query хуки
│   │   ├── i18n/            # i18next конфиг + locales (en.json, ru.json)
│   │   ├── components/ui/   # Button, Input, Modal, Card, Badge, Select...
│   │   ├── components/layout/ # AppLayout, Sidebar, TopBar
│   │   ├── pages/           # 18 пользовательских + 11 админских страниц
│   │   │   ├── auth/        # LoginPage, RegisterPage
│   │   │   ├── dashboard/   # DashboardPage
│   │   │   ├── tasks/       # TaskListPage, KanbanPage, CalendarPage, ProjectsPage, InboxPage
│   │   │   ├── productivity/ # FocusTimerPage, HabitsPage, AnalyticsPage, DailyLogPage
│   │   │   ├── finance/     # FinanceOverviewPage, TransactionsPage, BudgetsPage, GoalsPage
│   │   │   ├── settings/    # SettingsPage
│   │   │   └── admin/       # AdminLayout, AdminDashboard, AdminResourcePage + 10 ресурсных страниц
│   │   └── utils/           # Форматтеры, константы, валидация, errorHandler
│   ├── vite.config.ts       # Proxy /api → 127.0.0.1:8000, envDir: ../
│   └── package.json
├── docker-compose.yml
├── .env                     # Общий .env (backend + frontend VITE_*)
└── .env.example
```

## Страницы пользователя (18)

| Маршрут | Страница | Описание |
|---------|----------|----------|
| `/` | DashboardPage | Сводка: задачи дня, фокус, баланс, графики |
| `/inbox` | InboxPage | Входящие задачи, quick add (Enter), move menu, delete |
| `/tasks` | TaskListPage | Все задачи: фильтры, поиск, bulk actions, CRUD, контекстное меню |
| `/tasks/kanban` | KanbanPage | Kanban-доска с drag & drop между колонками |
| `/tasks/calendar` | CalendarPage | Месячный календарь, задачи по дедлайнам, боковая панель, клик → детали |
| `/projects` | ProjectsPage | Проекты: карточки с прогрессом, клик → задачи проекта |
| `/focus` | FocusTimerPage | Pomodoro/Deep Work/Short Break/Long Break таймер, привязка к задаче, история |
| `/daily-log` | DailyLogPage | Дневник: сделано/планы/заметки, настроение (5 вариантов), энергия (0-5), история |
| `/habits` | HabitsPage | Привычки: CRUD, 7-дневная сетка, toggle выполнения |
| `/analytics` | AnalyticsPage | Графики продуктивности, heatmap, bar charts, donut |
| `/finance` | FinanceOverviewPage | Баланс, income/expense, cashflow chart, pie chart категорий |
| `/transactions` | TransactionsPage | Транзакции: CRUD, фильтры (тип, категория, период), пагинация |
| `/budgets` | BudgetsPage | Бюджеты: CRUD, прогресс-бар, over/almost-reached badges |
| `/goals` | GoalsPage | Финансовые цели: CRUD, circular progress ring |
| `/reports` | FinanceOverviewPage | Отчёты (= обзор финансов) |
| `/settings` | SettingsPage | Профиль, тема (light/dark), язык (RU/EN), валюта, timezone |
| `/login` | LoginPage | Вход: email/пароль + Google OAuth |
| `/register` | RegisterPage | Регистрация: email/пароль + Google OAuth |

## Админ-панель (11 страниц)

Доступна по адресу `/admin`. Требует `is_staff=True`.

| Маршрут | Описание |
|---------|----------|
| `/admin` | Dashboard: stat cards, финансы, статусы задач, регистрации, график роста |
| `/admin/users` | Пользователи: CRUD, поиск, фильтры, блокировка, назначение/снятие админа |
| `/admin/tasks` | Все задачи всех пользователей, фильтры статус/приоритет |
| `/admin/projects` | Все проекты, количество задач, поиск |
| `/admin/accounts` | Все финансовые счета, балансы |
| `/admin/transactions` | Все транзакции, фильтр по типу |
| `/admin/budgets` | Все бюджеты |
| `/admin/goals` | Финансовые цели, прогресс-бар |
| `/admin/focus-sessions` | Все фокус-сессии |
| `/admin/habits` | Все привычки |
| `/admin/daily-logs` | Все дневниковые записи, настроение, энергия |

Общие функции админки:
- Поиск по таблицам
- Фильтрация (статус, тип, роль)
- Пагинация (20 записей/стр)
- Модалка детального просмотра любой записи
- Удаление с подтверждением
- Кнопка «Вернуться в приложение»

## API

Все эндпоинты под `/api/v1/`. JWT Bearer token аутентификация.

### Auth
- `POST /api/v1/auth/login/` — вход по email/пароль
- `POST /api/v1/auth/register/` — регистрация
- `POST /api/v1/auth/google/` — вход через Google OAuth 2.0
- `POST /api/v1/auth/logout/` — выход (blacklist refresh)
- `GET/PATCH /api/v1/auth/me/` — профиль
- `POST /api/v1/auth/token/refresh/` — обновить JWT

### Tasks
- `/api/v1/tasks/items/` — задачи CRUD + фильтры + bulk update
- `/api/v1/tasks/projects/` — проекты CRUD

### Productivity
- `/api/v1/productivity/focus-sessions/` — фокус-сессии (start/stop/history)
- `/api/v1/productivity/habits/` — привычки CRUD
- `/api/v1/productivity/habit-logs/` — логи привычек (today/streak)
- `/api/v1/productivity/daily-logs/` — дневник CRUD (today)

### Finance
- `/api/v1/finance/accounts/` — счета CRUD
- `/api/v1/finance/categories/` — категории (дефолтные + пользовательские)
- `/api/v1/finance/transactions/` — транзакции CRUD + фильтры
- `/api/v1/finance/budgets/` — бюджеты CRUD
- `/api/v1/finance/goals/` — цели CRUD

### Analytics
- `/api/v1/analytics/dashboard/` — сводная статистика
- `/api/v1/analytics/productivity/` — продуктивность (heatmap, daily_focus)
- `/api/v1/analytics/finance/` — финансовая аналитика

### Admin Panel (is_staff only)
- `/api/v1/admin-panel/dashboard/` — системная статистика
- `/api/v1/admin-panel/users/` — CRUD пользователей + toggle_active + toggle_staff
- `/api/v1/admin-panel/tasks/` — все задачи системы
- `/api/v1/admin-panel/projects/` — все проекты
- `/api/v1/admin-panel/accounts/` — все счета
- `/api/v1/admin-panel/categories/` — все категории
- `/api/v1/admin-panel/transactions/` — все транзакции
- `/api/v1/admin-panel/budgets/` — все бюджеты
- `/api/v1/admin-panel/goals/` — все цели
- `/api/v1/admin-panel/focus-sessions/` — все фокус-сессии
- `/api/v1/admin-panel/habits/` — все привычки
- `/api/v1/admin-panel/daily-logs/` — все дневники

Пагинация: 20 элементов/страница. Throttling: 100/день anon, 1000/день auth.

## Conventions

- **UUID** первичные ключи для всех моделей
- **AUTH_USER_MODEL** = `users.User` (email-based)
- **TextChoices** enums для status, priority и т.д.
- **created_at / updated_at** на всех моделях
- **select_related / prefetch_related** в querysets
- **transaction.atomic + select_for_update** для балансов и race conditions
- **Ownership validation** в сериализаторах (parent_task, project, account)
- **IsAdminUser** permission для админ-панели (is_staff=True)
- **Frontend path alias:** `@` → `src/`
- **API proxy:** в dev Vite проксирует `/api` → `127.0.0.1:8000`
- **i18n:** react-i18next, JSON locale файлы, `useTranslation()` хук
- **Язык:** ru по умолчанию, поддержка en (переключается в Settings)
- **Валюта:** USD по умолчанию, настраивается per-user
- **Комментарии:** JSDoc (фронтенд), docstrings на русском (бэкенд)
- **Обработка ошибок:** `showApiError()` / `showSuccess()`, try/catch на всех API-вызовах
- **Валидация форм:** фронтенд + бэкенд (serializers)
- **Админ-панель:** универсальный AdminResourcePage с конфигурируемыми колонками

## Переменные окружения

```
# Backend
DEBUG=True
SECRET_KEY=<random-string>
DB_NAME=productflow
DB_USER=postgres
DB_PASSWORD=productflow_secret
DB_HOST=localhost          # db в Docker
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Frontend (VITE_ prefix обязателен)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

## Безопасность

- JWT с ротацией refresh-токенов + blacklist
- Google OAuth 2.0 (google-auth библиотека, проверка id_token)
- Ownership validation на всех CRUD операциях
- Atomic transactions для финансовых операций
- select_for_update для предотвращения race conditions
- Rate limiting (django-ratelimit)
- CORS whitelist
- CSRF, XSS, Clickjacking защита
- SECURE_CONTENT_TYPE_NOSNIFF, X_FRAME_OPTIONS='DENY'
- Валидация на уровне serializers + фронтенд валидация форм
- PBKDF2 хэширование паролей
- Circular reference prevention (subtasks max depth 3)
- Admin panel защита через IsAdminUser permission (is_staff=True)

## Admin

### Django Admin (бэкенд)
- `http://localhost:8000/admin/` — встроенный Django admin
- Зарегистрированы: UserAdmin, TaskAdmin, ProjectAdmin, FocusSessionAdmin, HabitAdmin, HabitLogAdmin, DailyLogAdmin, AccountAdmin, CategoryAdmin, TransactionAdmin, BudgetAdmin, GoalAdmin

### Web Admin Panel (фронтенд)
- `http://localhost:3000/admin` — кастомная веб-админка
- Dashboard с метриками системы
- CRUD всех моделей с поиском, фильтрами, пагинацией
- Управление пользователями: блокировка, назначение/снятие админа
- Superuser: `admin@productflow.com` / `admin123`

## Google OAuth Setup

1. Создать проект в Google Cloud Console
2. APIs & Services → OAuth consent screen → External → Publish
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. Authorized JavaScript origins: `http://localhost:3000`
5. Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback/`
6. Скопировать Client ID и Client Secret в `.env`
