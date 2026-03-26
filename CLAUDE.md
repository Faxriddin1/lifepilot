# LifePilot

All-in-one platform for task management, productivity and personal finance. Free to use, no subscriptions or paid plans.

- **Domain:** https://lifepilot.uz
- **Contact:** iamfakhriddin@gmail.com

## Tech Stack

- **Backend:** Django 5.0 + Django REST Framework + PostgreSQL 16 + Redis 7 + Celery
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS 3 + Zustand + TanStack Query + Framer Motion + Sonner + cmdk
- **Design System:** Semantic CSS-переменные (tokens.css), 70+ design tokens, dark/light через `:root` / `.dark` — zero hardcoded colors
- **Auth:** JWT (simplejwt) — access 30 min, refresh 7 days with rotation + Google OAuth 2.0 (lifepilot.uz domain)
- **i18n:** react-i18next (EN, RU, UZ Latin, UZ Cyrillic) — full coverage, zero hardcoded strings, all UI text via `t()` calls
- **AI:** Gemini 2.5 Flash / 2.5 Flash-Lite (google-genai SDK)
- **Currency conversion:** CBU.uz API (Central Bank of Uzbekistan)
- **Eval:** Promptfoo + Langfuse
- **Infra:** Docker Compose (db, redis, backend, frontend, celery, bot)
- **Deploy:** Google Cloud VM, Docker Compose, Nginx reverse proxy, SSL (Let's Encrypt)

## Setup

### With Docker (recommended)

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

### Without Docker

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

## Project Structure

```
PM/
├── backend/
│   ├── config/              # Settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── users/           # Custom User model (UUID, email auth, Google OAuth, telegram_id, date/number format, week start)
│   │   ├── tasks/           # Task, Project (subtasks up to 3 levels, templates with icons/colors)
│   │   ├── productivity/    # FocusSession, Habit (target_days, templates, icons), HabitLog, DailyLog
│   │   ├── finance/         # Account, Category, Transaction, Budget, Goal (contribute, templates)
│   │   ├── analytics/       # Dashboard, Productivity/Finance aggregation
│   │   ├── admin_panel/     # Admin panel API (dashboard, CRUD for all models)
│   │   ├── ai_core/         # AI Service Layer (Gemini 2.5 Flash, 7 methods, Pydantic v2 schemas, cost tracking, Redis cache)
│   │   │   └── eval/        # Golden dataset (60 cases), Promptfoo YAML configs, prompt wrappers, eval scripts
│   │   ├── learning/        # Adaptive learning (goals, modules, tasks, streaks, AI tutor)
│   │   ├── bot/             # Telegram bot (Django app, thin client, webhook mode, 8 handlers including settings)
│   │   └── notifications/   # Notification service (Telegram, web, Celery Beat)
│   ├── scripts/             # eval_prompts.py, check_eval_results.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── types/           # TypeScript interfaces and enums
│   │   ├── api/             # Axios client + API modules (via Vite proxy)
│   │   ├── store/           # Zustand stores (auth, ui)
│   │   ├── hooks/           # React Query hooks
│   │   ├── i18n/            # i18next config + locales (en.json, ru.json, uz.json, uz-cyr.json)
│   │   ├── styles/          # tokens.css (design tokens — CSS variables, light/dark themes)
│   │   ├── components/ui/   # Button, Input, Modal, Card, Badge, Select, PasswordStrength, StatCard, BulletGraph, WaterfallChart, Skeleton, PageTransition...
│   │   ├── components/      # CommandPalette (cmdk, ⌘K)
│   │   ├── components/layout/ # AppLayout (with AnimatePresence page transitions), Sidebar (collapsible + keyboard [), TopBar (⌘K search trigger)
│   │   ├── pages/           # 26 user pages + 11 admin pages + landing/legal pages
│   │   │   ├── auth/        # LoginPage, RegisterPage (password strength indicator)
│   │   │   ├── dashboard/   # DashboardPage (BI-optimized, StatCard with sparklines/trends/alerts)
│   │   │   ├── tasks/       # TaskListPage, KanbanPage, CalendarPage (full calendar + side panel), ProjectsPage (templates), InboxPage (quick add + move menu)
│   │   │   ├── productivity/ # FocusTimerPage, HabitsPage (templates, icons, target_days, weekly streak), AnalyticsPage (GitHub heatmap, peak hours), DailyLogPage (mood/energy journal)
│   │   │   ├── finance/     # FinanceOverviewPage (waterfall chart), TransactionsPage, BudgetsPage (bullet graphs), GoalsPage (contribute + templates)
│   │   │   ├── learning/    # LearningPage (goal list + create modal), LearningDetailPage (generating → preview → active plan)
│   │   │   ├── reports/     # ReportsPage
│   │   │   ├── settings/    # SettingsPage (change password, export data, delete account, 50+ currencies, all timezones)
│   │   │   ├── landing/     # LandingPage (animated intro, cursor effects, 3D tilt cards, gradient mesh), AboutPage, LegalPage (Privacy/Terms)
│   │   │   └── admin/       # AdminLayout, AdminDashboard, AdminResourcePage + 10 resource pages
│   │   └── utils/           # Formatters, constants, validation, errorHandler, alerts
│   ├── vite.config.ts       # Proxy /api -> 127.0.0.1:8000, envDir: ../
│   └── package.json
├── docker-compose.yml
├── .env                     # Shared .env (backend + frontend VITE_*)
└── .env.example
```

## User Pages (26+)

| Route | Page | Description |
|-------|------|-------------|
| `/` | DashboardPage | BI-optimized: StatCard with sparklines, trends, color-coded alerts, compact layout |
| `/inbox` | InboxPage | Incoming tasks, quick add (Enter), move to project menu, delete |
| `/tasks` | TaskListPage | All tasks: filters, search, bulk actions, CRUD, context menu |
| `/tasks/kanban` | KanbanPage | Kanban board with drag & drop between columns |
| `/tasks/calendar` | CalendarPage | Monthly calendar, tasks by deadlines, side panel with task details, click for CRUD |
| `/projects` | ProjectsPage | Projects: template cards with icons/colors, progress bar, edit/delete, click for project tasks |
| `/focus` | FocusTimerPage | Pomodoro/Deep Work/Short Break/Long Break timer, task binding, history |
| `/daily-log` | DailyLogPage | Journal: done/plans/notes, mood (5 emoji variants), energy (0-5 scale), history browser |
| `/habits` | HabitsPage | Habits: templates with icons, target_days (weekday selection), 7-day grid, weekly streak counter, toggle completion via API |
| `/analytics` | AnalyticsPage | GitHub-style heatmap, habit progress report, peak hours compact chart, bar charts (WCAG blue/orange palette, no donut charts) |
| `/finance` | FinanceOverviewPage | Balance, income/expense, waterfall cashflow chart, category pie chart |
| `/transactions` | TransactionsPage | Transactions: CRUD, filters (type, category, period), pagination |
| `/budgets` | BudgetsPage | Budgets: CRUD, bullet graphs (not progress bars), over/almost-reached color-coded alerts |
| `/goals` | GoalsPage | Financial goals: CRUD with templates, circular progress ring, contribute action |
| `/learning` | LearningPage | Learning goals list with create modal, progress cards |
| `/learning/:id` | LearningDetailPage | Goal detail: generating → preview → active plan with modules/tasks |
| `/reports` | ReportsPage | Financial reports page |
| `/settings` | SettingsPage | Profile, change password, theme (light/dark), language (EN/RU/UZ/UZ-Cyr), 50+ currencies, all timezones, date format, number format, week start (Mon/Sun), export data, delete account |
| `/login` | LoginPage | Login: email/password + Google OAuth |
| `/register` | RegisterPage | Registration: email/password + Google OAuth + password strength indicator |
| `/welcome` | LandingPage | Animated landing: intro screen, cursor effects, 3D tilt cards, gradient mesh, 4-language responsive |
| `/about` | AboutPage | About the project |
| `/legal/privacy` | LegalPage | Privacy policy (also `/privacy` redirects here) |
| `/legal/terms` | LegalPage | Terms of service (also `/terms` redirects here) |

## Admin Panel (11 pages)

Available at `/admin`. Requires `is_staff=True`.

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard: stat cards, finances, task statuses, registrations, growth chart |
| `/admin/users` | Users: CRUD, search, filters, block/unblock, assign/remove admin |
| `/admin/tasks` | All tasks from all users, status/priority filters |
| `/admin/projects` | All projects, task count, search |
| `/admin/accounts` | All financial accounts, balances |
| `/admin/transactions` | All transactions, type filter |
| `/admin/budgets` | All budgets |
| `/admin/goals` | Financial goals, progress bar |
| `/admin/focus-sessions` | All focus sessions |
| `/admin/habits` | All habits |
| `/admin/daily-logs` | All journal entries, mood, energy |

Common admin features:
- Table search
- Filtering (status, type, role)
- Pagination (20 records/page)
- Detail view modal for any record
- Deletion with confirmation
- "Back to app" button

## UI/UX Design (2026 Redesign)

- **Design System:** 70+ semantic CSS variables in `src/styles/tokens.css` — all colors, shadows, radius, spacing, transitions, typography
- **Theme:** Light/Dark via CSS variables (`:root` / `.dark`), zero hardcoded Tailwind colors, no theme flash (inline script in `<head>`)
- **Typography:** Inter (sans) + JetBrains Mono (mono), loaded via Google Fonts with `display=swap`
- **Dashboard:** Bento Grid layout, StatCard with sparklines, trend indicators, alert border-l color-coding
- **Charts:** WCAG-compliant palette, all Recharts colors via `var()` CSS variables for theme awareness
- **Finance charts:** Waterfall chart for cashflow, bullet graphs for budget progress
- **Analytics:** GitHub-style contribution heatmap, compact peak hours chart, habit progress report
- **Alert system:** Color-coded alerts (border-l-3 + semantic colors) across all modules
- **Command Palette:** `⌘K` / `Ctrl+K` — search pages, actions (cmdk library), 4-language support
- **Sidebar:** Collapsible (240→48px), keyboard shortcut `[`, mobile sheet overlay with `X` close + Escape + backdrop click
- **Animations:** Framer Motion page transitions (fade+slide 200ms), modal scale+fade, prefers-reduced-motion respected
- **Toast:** Sonner (replaced react-hot-toast) — `toast.success()`, `toast.error()`, `toast.promise()`
- **Skeleton:** `Skeleton` + `DashboardSkeleton` components for loading states
- **Landing page:** Animated intro screen with cursor particle effects, 3D tilt cards, gradient mesh, fixed light theme
- **Mobile:** Responsive sidebar with hamburger, overlay, auto-close on navigation (lg: breakpoint = 1024px)
- **Accessibility:** focus-visible ring via `--border-focus`, prefers-reduced-motion, tabular-nums for financial data
- **i18n:** Zero hardcoded strings — all UI text via react-i18next `t()` calls across all 4 languages (~1000 keys × 4 languages)

## API

All endpoints under `/api/v1/`. JWT Bearer token authentication.

### Auth
- `POST /api/v1/auth/login/` — login by email/password
- `POST /api/v1/auth/register/` — registration
- `POST /api/v1/auth/google/` — login via Google OAuth 2.0
- `POST /api/v1/auth/logout/` — logout (blacklist refresh)
- `GET/PATCH /api/v1/auth/me/` — profile (includes date_format, number_format, week_start)
- `POST /api/v1/auth/token/refresh/` — refresh JWT

### Tasks
- `/api/v1/tasks/items/` — tasks CRUD + filters + bulk update
- `/api/v1/tasks/projects/` — projects CRUD (templates with icons/colors)

### Productivity
- `/api/v1/productivity/focus-sessions/` — focus sessions (start/stop/history)
- `/api/v1/productivity/habits/` — habits CRUD (includes target_days, templates, icons)
- `/api/v1/productivity/habit-logs/` — habit logs (today/streak)
- `POST /api/v1/productivity/habit-logs/toggle/` — toggle habit completion for a date
- `/api/v1/productivity/daily-logs/` — journal CRUD (today)

### Finance
- `/api/v1/finance/accounts/` — accounts CRUD
- `/api/v1/finance/categories/` — categories (default + user-created)
- `/api/v1/finance/transactions/` — transactions CRUD + filters
- `/api/v1/finance/budgets/` — budgets CRUD
- `/api/v1/finance/goals/` — goals CRUD (templates)
- `POST /api/v1/finance/goals/{id}/contribute/` — contribute amount to a goal

### Analytics
- `/api/v1/analytics/dashboard/` — summary statistics (Redis cached, 5 min TTL)
- `/api/v1/analytics/productivity/` — productivity (heatmap, daily_focus) (Redis cached, 5 min TTL)
- `/api/v1/analytics/finance/` — financial analytics (Redis cached, 5 min TTL)

### Admin Panel (is_staff only)
- `/api/v1/admin-panel/dashboard/` — system statistics
- `/api/v1/admin-panel/users/` — users CRUD + toggle_active + toggle_staff
- `/api/v1/admin-panel/tasks/` — all system tasks
- `/api/v1/admin-panel/projects/` — all projects
- `/api/v1/admin-panel/accounts/` — all accounts
- `/api/v1/admin-panel/categories/` — all categories
- `/api/v1/admin-panel/transactions/` — all transactions
- `/api/v1/admin-panel/budgets/` — all budgets
- `/api/v1/admin-panel/goals/` — all goals
- `/api/v1/admin-panel/focus-sessions/` — all focus sessions
- `/api/v1/admin-panel/habits/` — all habits
- `/api/v1/admin-panel/daily-logs/` — all journals

### Learning
- `GET/POST /api/v1/learning/goals/` — learning goals CRUD
- `GET/PATCH/DELETE /api/v1/learning/goals/{id}/` — goal detail
- `POST /api/v1/learning/goals/{id}/generate-plan/` — trigger AI plan generation (async, returns 202)
- `GET /api/v1/learning/goals/{id}/status/` — poll generation status
- `POST /api/v1/learning/goals/{id}/confirm-plan/` — confirm preview and activate goal
- `GET /api/v1/learning/goals/{id}/today/` — today's tasks for a goal
- `GET /api/v1/learning/goals/{id}/progress/` — 30-day progress + streak stats
- `POST /api/v1/learning/goals/{id}/pause/` — pause active goal
- `POST /api/v1/learning/goals/{id}/resume/` — resume paused goal
- `POST /api/v1/learning/goals/{id}/adapt/` — trigger AI plan adaptation
- `POST /api/v1/learning/goals/{id}/ask/` — ask AI tutor a question
- `GET/DELETE /api/v1/learning/goals/{id}/tutor-history/` — tutor conversation history
- `GET /api/v1/learning/tasks/{id}/` — task detail
- `POST /api/v1/learning/tasks/{id}/complete/` — mark task completed (idempotent)
- `POST /api/v1/learning/tasks/{id}/skip/` — skip task (idempotent)
- `POST /api/v1/learning/tasks/{id}/rate/` — rate task (1-5) with notes

### Notifications
- `GET /api/v1/notifications/` — list notifications (paginated)
- `POST /api/v1/notifications/{id}/read/` — mark notification as read
- `POST /api/v1/notifications/read-all/` — mark all as read
- `GET/PATCH /api/v1/notifications/preferences/` — notification preferences

### AI
- `POST /api/v1/ai/feedback/` — submit feedback on AI response quality

### Bot (Telegram Webhook)
- `POST /api/v1/bot/webhook/` — Telegram webhook receiver (internal)

Pagination: 20 items/page. Throttling: 100/day anon, 1000/day auth.

## Conventions

- **UUID** primary keys for all models
- **AUTH_USER_MODEL** = `users.User` (email-based)
- **TextChoices** enums for status, priority, etc.
- **created_at / updated_at** on all models
- **select_related / prefetch_related** in querysets
- **transaction.atomic + select_for_update** for balances and race conditions
- **Ownership validation** in serializers (parent_task, project, account)
- **IsAdminUser** permission for admin panel (is_staff=True)
- **Design tokens:** All colors via CSS variables in `src/styles/tokens.css` — NEVER use hardcoded Tailwind color classes (bg-gray-*, text-blue-*, dark:bg-*, etc.)
- **Color classes:** Use semantic tokens: `bg-background`, `bg-surface`, `bg-elevated`, `text-foreground`, `text-foreground-secondary`, `border-border`, `bg-accent`, `text-success`, `text-danger`, etc.
- **Dark mode:** Via CSS variables only — adding `dark:` prefix classes is PROHIBITED. Theme switches automatically via `:root` / `.dark` in tokens.css
- **Animations:** Framer Motion for page/modal transitions, CSS `active:scale-[0.97]` for buttons, `duration-fast/normal/slow` tokens
- **Toast notifications:** `import { toast } from 'sonner'` — NOT react-hot-toast, NOT custom ToastStore
- **Command Palette:** `src/components/CommandPalette.tsx` (cmdk) — add new pages/actions there when adding routes
- **Frontend path alias:** `@` -> `src/`
- **API proxy:** in dev Vite proxies `/api` -> `127.0.0.1:8000`
- **i18n:** react-i18next, JSON locale files, `useTranslation()` hook — full coverage, zero hardcoded strings
- **Languages:** 4 languages — English (en), Russian (ru), Uzbek Latin (uz), Uzbek Cyrillic (uz-cyr)
- **Currency:** USD by default, 50+ currencies configurable per-user
- **Timezones:** all IANA timezones available in settings
- **Comments:** JSDoc (frontend), docstrings (backend)
- **Error handling:** `toast.error()` / `toast.success()` (Sonner), try/catch on all API calls
- **Alert system:** semantic color alerts (`text-success`, `text-warning`, `text-danger`) — WCAG-compliant
- **Form validation:** frontend + backend (serializers)
- **Admin panel:** universal AdminResourcePage with configurable columns (intentionally dark sidebar)
- **Free platform:** no subscriptions, no paid plans, no billing — completely free to use
- **Landing page:** fixed light theme (intentionally not tokenized), animated intro, cursor effects, 3D tilt cards
- **AI methods:** All AI calls go through `apps/ai_core/services.AIService` — NEVER call Gemini directly
- **Learning flow:** create goal → generate plan (Celery) → preview → confirm → active
- **Notifications:** All through `NotificationService.send()` — respects preferences and quiet hours
- **Telegram bot:** Thin client in `apps/bot/` (Django app, webhook mode) — no own AI, no own DB, everything via Django ORM + AIService. Auth via JWT stored in Redis. Management commands: `run_bot` (polling), `set_webhook`.

## Environment Variables

```
# Backend
DEBUG=True
SECRET_KEY=<random-string>
DB_NAME=lifepilot
DB_USER=postgres
DB_PASSWORD=lifepilot_secret
DB_HOST=localhost          # db in Docker
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,lifepilot.uz
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://lifepilot.uz

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# AI
GEMINI_API_KEY=<your-gemini-api-key>

# Telegram Bot
BOT_TOKEN=<your-telegram-bot-token>

# Resource Resolver
YOUTUBE_API_KEY=<your-youtube-data-api-key>
SERPER_API_KEY=<your-serper-api-key>

# Eval / Observability (optional)
LANGFUSE_PUBLIC_KEY=<your-langfuse-public-key>
LANGFUSE_SECRET_KEY=<your-langfuse-secret-key>
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Frontend (VITE_ prefix required)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

## Security

- JWT with refresh token rotation + blacklist
- Google OAuth 2.0 (google-auth library, id_token verification, lifepilot.uz domain)
- Ownership validation on all CRUD operations
- Atomic transactions for financial operations
- select_for_update to prevent race conditions
- Rate limiting (django-ratelimit)
- CORS whitelist
- CSRF, XSS, Clickjacking protection
- Server-side HTML sanitization via bleach (SanitizeMixin on all text-input serializers)
- SECURE_CONTENT_TYPE_NOSNIFF, X_FRAME_OPTIONS='DENY'
- Serializer-level validation + frontend form validation
- Argon2 password hashing (with PBKDF2 fallback)
- Password strength indicator on registration
- Change password functionality in settings
- Circular reference prevention (subtasks max depth 3)
- Admin panel protection via IsAdminUser permission (is_staff=True)
- Account deletion with confirmation
- Data export capability
- Telegram bot auth via JWT stored in Redis (no Fernet, no raw SQL)

## Admin

### Django Admin (backend)
- `http://localhost:8000/admin/` — built-in Django admin
- Registered: UserAdmin, TaskAdmin, ProjectAdmin, FocusSessionAdmin, HabitAdmin, HabitLogAdmin, DailyLogAdmin, AccountAdmin, CategoryAdmin, TransactionAdmin, BudgetAdmin, GoalAdmin

### Web Admin Panel (frontend)
- `http://localhost:3000/admin` — custom web admin panel
- Dashboard with system metrics
- CRUD for all models with search, filters, pagination
- User management: block/unblock, assign/remove admin
- Superuser: `admin@lifepilot.uz` / `admin123`

## Google OAuth Setup

1. Create project in Google Cloud Console
2. APIs & Services -> OAuth consent screen -> External -> Publish
3. Credentials -> Create OAuth 2.0 Client ID (Web application)
4. Authorized JavaScript origins: `http://localhost:3000` (dev), `https://lifepilot.uz` (prod)
5. Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback/`
6. Copy Client ID and Client Secret to `.env`

## Deployment (Production)

- **Hosting:** Google Cloud VM (Compute Engine)
- **Stack:** Docker Compose prod (PostgreSQL, Redis, Django/gunicorn, React/nginx, Celery, Celery Beat, Telegram Bot)
- **Web server:** Nginx (host-level) as reverse proxy with SSL
- **SSL:** Let's Encrypt (certbot) — HTTPS enforced, HSTS enabled
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS
- **Domain:** lifepilot.uz
- **Deploy command:** `docker-compose -f docker-compose.prod.yml build frontend && docker-compose -f docker-compose.prod.yml up -d frontend`

## Changelog — March 26, 2026

### AI Platform (Этапы 1-9)
- Created `apps/ai_core/` — 7 AI methods (parse_user_intent, generate_learning_plan, adapt_learning_plan, answer_learning_question, generate_daily_tasks, generate_insights, parse_receipt)
- Pydantic v2 schemas for structured AI output
- AICallLog model for cost tracking ($0.10-$2.50 per 1M tokens)
- 7 versioned system prompts in `prompts/*.v1.txt`
- Redis caching for AI responses (SHA-256 keys)
- GeminiClient singleton with retry logic (429, 500/503)

### Learning Module
- Created `apps/learning/` — 5 models (LearningGoal, LearningModule, LearningTask, LearningProgress, AdaptationLog) + TutorMessage
- AI plan generation via Celery async task
- Resource resolver (YouTube Data API + Serper fallback)
- Duolingo-style streaks with freeze protection
- AI adaptation: 4 triggers (user_stuck, ahead_of_schedule, weekly_review, explicit_request)
- Socratic AI tutor (answer_learning_question)
- Frontend: LearningPage, LearningDetailPage with generating overlay (4-step progress)

### Telegram Bot (rewritten from scratch)
- Created `apps/bot/` as Django app (was standalone `bot/` directory)
- Thin client architecture: no own AI, no own DB
- Webhook mode via Django view
- 8 handlers: start, messages, callbacks, executor, learning, voice, photo, settings
- Registration flow directly in bot (name → email → password)
- AI intent parsing: natural language → structured action
- Voice messages via Gemini 2.5 Flash-Lite STT
- Photo receipts via Gemini Vision OCR
- Currency conversion via CBU.uz API (auto UZS↔USD)
- Bot settings: language switch, notification toggles, quiet hours
- Main menu with ⚙️ Settings button

### Notification System
- Created `apps/notifications/` — Notification + NotificationPreference models
- Morning digest (tasks + learning + habits)
- Streak risk alerts (evening reminder)
- Deadline reminders (24h before)
- Plan ready notification (after AI generation)
- Weekly review with AI adaptation summary
- Quiet hours support (per-user timezone)
- Celery Beat: 6 scheduled tasks

### Eval Pipeline
- Golden dataset: 60 test cases across 7 methods
- 7 Promptfoo YAML configs (74+ tests)
- GitHub Actions CI: 7-parallel matrix jobs
- Langfuse integration (@observe decorators)
- AI feedback endpoint (POST /api/v1/ai/feedback/)
- eval_prompts.py standalone script
- check_eval_results.py CI quality gate

### UI/UX Redesign
- Design tokens: 70+ CSS variables in tokens.css
- Zero hardcoded Tailwind colors across entire codebase
- Dark/Light theme via CSS variables
- Command Palette (⌘K) with cmdk
- Framer Motion page transitions
- Sonner toast notifications
- Sidebar: collapsible + keyboard shortcut [
- Learning pages with generating overlay (4-step progress indicator)
- Dashboard learning widget
- Task detail: date/time split inputs, Save/Done/Delete buttons

### Infrastructure
- Celery autodiscovery fix (explicit task packages)
- Nginx: /bot/ location added to host config
- Telegram webhook: set to lifepilot.uz/bot/webhook/
- ffmpeg installed for voice processing
- Gemini model updated: 2.0-flash-lite → 2.5-flash-lite
- Frontend nginx: /api/ and /bot/ proxy with X-Forwarded-Proto

### Bug Fixes
- Task dropdown menu overflow (z-index portal fix)
- i18n: 95+ missing learning.* keys added to all 4 languages
- Celery tasks not registered (autodiscovery fix)
- Webhook 502 (added /bot/ to host nginx)
- Bot auth middleware: skip callbacks for registration flow
- Task detail: deadline date/time editable inputs
- Duplicate notification prevention (dedup check)
- Idempotent task completion
- N+1 queries (prefetch_related on goal detail)
- Currency normalization (SO'M → UZS)
