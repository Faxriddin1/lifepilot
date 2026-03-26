# LifePilot

**All-in-one platform for task management, productivity tracking, personal finance, and adaptive learning.** Free to use, no subscriptions.

[![Django](https://img.shields.io/badge/Django-5.0-green?logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-NonCommercial-orange)](#license)

**Live:** [https://lifepilot.uz](https://lifepilot.uz)

---

## About

LifePilot combines task management, productivity tools, personal finance, and AI-powered adaptive learning into a single application. It supports 4 languages with full localization, dark/light themes, a comprehensive admin panel, and a Telegram bot for natural language interactions.

- Completely free -- no subscriptions, no paid plans, no billing
- Anonymous usage data collected for platform improvement only
- ~28,000+ lines of code: 130+ Python files + 100+ TS/TSX files (updated March 2026)

---

## Recent Updates (March 2026)

### AI-Powered Learning
- AI generates personalized learning plans (Gemini 2.5 Flash)
- Adaptive plans that adjust based on your progress
- Socratic AI tutor — guides you with questions, not answers
- Duolingo-style streaks with freeze protection

### Telegram Bot
- Register and use LifePilot directly from Telegram
- Natural language: "bought coffee 25k" → expense recorded
- Voice messages and receipt photo recognition
- Learning commands: /plan, /today, /ask
- New: bot settings menu (language, notifications, quiet hours)

### Smart Notifications
- Morning digest with your daily plan
- Streak risk alerts before you lose progress
- Deadline reminders 24h before due
- Quiet hours respect your sleep schedule

### Currency Conversion
- Automatic UZS↔USD conversion using CBU.uz rates
- Works with 50+ currencies

### UI/UX Redesign
- New design system with 70+ CSS tokens
- Dark/Light theme
- Command Palette (⌘K)
- Learning pages with step-by-step plan generation

---

## Features

### Tasks & Projects
- Task CRUD with priorities, deadlines, and subtasks (up to 3 levels)
- Kanban board with drag-and-drop between status columns
- Monthly calendar view with side panel for task details
- Inbox for quick task capture (Enter to add, move menu, delete)
- Projects with template cards (icons, colors), progress bars, edit/delete
- Filters, search, bulk actions, context menus

### Productivity
- Focus timer: Pomodoro, Deep Work, Short Break, Long Break modes with task binding
- Habit tracker: templates with icons, target days (weekday selection), 7-day grid, weekly streak counter, toggle completion API
- Daily journal: done/plans/notes, mood (5 variants), energy (0-5 scale), history browser
- Analytics: GitHub-style contribution heatmap, habit progress report, peak hours chart, bar charts
- WCAG-compliant blue/orange color palette for data visualization (avoids green/red)

### Finance
- Accounts with balances and multi-currency support (50+ currencies)
- Transactions (income/expense/transfer) with type, category, and period filters
- Budgets with bullet graph progress and color-coded alert badges (over/almost-reached)
- Financial goals with circular progress ring, contribute action, and goal templates
- Waterfall cashflow chart, category pie chart
- Financial reports page

### Adaptive Learning
- AI-generated study plans via Gemini 2.5 Flash
- Learning goals with modules, daily tasks, and deadlines
- Duolingo-style streak tracking with freeze mechanic
- AI plan adaptation with 4 triggers: stuck, ahead of schedule, weekly review, explicit request
- AI tutor chat scoped to each goal with Socratic method (no direct answers, guided questions)
- Resource resolver: real YouTube and web links attached to each module
- Async plan generation via Celery with status polling

### Dashboard
- Bento Grid layout with StatCard component (sparklines, trend indicators, alert border-l color-coding)
- Compact summary: today's tasks, focus time, account balance, cashflow chart, habits, budgets

### UI/UX (2026 Design System)
- **Design Tokens:** 70+ semantic CSS variables -- colors, shadows, radius, spacing, transitions, typography
- **Theming:** Dark/Light via CSS variables, no hardcoded Tailwind color classes, no theme flash
- **Command Palette:** `Ctrl+K` / `⌘K` for quick navigation and actions (cmdk)
- **Sidebar:** Collapsible (240 to 48px), keyboard shortcut `[`, mobile sheet overlay
- **Animations:** Framer Motion page transitions, modal scale+fade, button active:scale
- **Toast:** Sonner notifications (success, error, promise)
- **Skeleton:** Loading placeholders for all pages
- **Accessibility:** focus-visible ring, prefers-reduced-motion, tabular-nums for financial data
- **Typography:** Inter + JetBrains Mono

### Settings
- Profile management and change password
- Theme: light and dark mode (no flash on page load)
- Language: English, Russian, Uzbek (Latin), Uzbek (Cyrillic)
- 50+ currencies, all IANA timezones
- Date format, number format, first day of week (Monday/Sunday)
- Telegram bot linking
- Export data, delete account

### Landing Page
- Animated intro screen with cursor particle effects
- 3D tilt cards, gradient mesh backgrounds
- Fully responsive, 4-language support

### Telegram Bot
- Thin client architecture — no standalone AI logic, no separate database
- Natural language AI (Gemini 2.5 Flash via AIService) -- create tasks, log expenses, check balance, ask tutor questions
- Voice message transcription (Gemini 2.5 Flash-Lite STT) and receipt photo parsing (Gemini Vision OCR)
- Currency conversion via CBU.uz API (auto UZS↔USD, 50+ currencies)
- Registration flow directly in bot (name → email → password)
- Bot settings: language switch, notification toggles, quiet hours, main menu with Settings button
- 28 supported intents with confirmation flow
- Multi-language (EN, RU, UZ, UZ-Cyr) with per-user locale
- Rate limiting; auth via JWT stored in Redis
- Django app `apps/bot/` with webhook integration; 8 handlers: start, messages, callbacks, executor, learning, voice, photo, settings
- Management commands: `run_bot` (polling), `set_webhook`

### Notifications
- In-app (web) and Telegram channel delivery
- Per-user preferences with quiet hours support
- 5 notification types: morning digest, streak risk, weekly review, deadline reminder, plan ready
- Auto-created preferences on user registration (signal)
- Celery Beat tasks: morning digests, streak alerts, deadline reminders

### Admin Panel (11 pages at `/admin`)
- Dashboard with system metrics, registration growth chart
- User management: block/unblock, assign/remove admin roles
- Full CRUD for all entities: tasks, projects, accounts, transactions, budgets, goals, focus sessions, habits, daily logs
- Table search, filters, pagination (20/page), detail view modal
- Requires `is_staff=True`

### Internationalization
- 4 languages: English (en), Russian (ru), Uzbek Latin (uz), Uzbek Cyrillic (uz-cyr)
- Full coverage -- ~1000 keys × 4 languages, zero hardcoded strings, all UI text via react-i18next `t()` calls
- Language switching in Settings

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Django 5.0, Django REST Framework, PostgreSQL 16, Redis 7, Celery |
| **Frontend** | React 18, TypeScript 5, Vite, TailwindCSS 3, Zustand, TanStack Query, Framer Motion, Sonner, cmdk |
| **Design System** | 70+ semantic CSS variables (tokens.css), dark/light themes, zero hardcoded colors |
| **Auth** | JWT (SimpleJWT) with refresh token rotation + blacklist, Google OAuth 2.0 |
| **AI** | Gemini 2.5 Flash / Flash-Lite (google-genai SDK), 7 AIService methods, Pydantic v2 schemas |
| **i18n** | react-i18next (EN, RU, UZ Latin, UZ Cyrillic) |
| **Infra** | Docker Compose (db, redis, backend, frontend, celery, bot), Celery Beat (6 scheduled tasks) |
| **Deploy** | Google Cloud VM, Nginx reverse proxy, SSL (Let's Encrypt) |
| **Eval** | Promptfoo + Langfuse, 60-case golden dataset, GitHub Actions matrix (7 parallel jobs) |

---

## Screenshots

> Screenshots coming soon.

---

## Quick Start

### With Docker (recommended)

```bash
git clone <repository-url>
cd PM
cp .env.example .env
docker-compose up --build
```

### Without Docker

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_default_categories --skip-existing
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Admin Panel | http://localhost:3000/admin |
| Django Admin | http://localhost:8000/admin/ |
| Swagger UI | http://localhost:8000/api/v1/docs/ |
| ReDoc | http://localhost:8000/api/v1/redoc/ |

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Backend
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=lifepilot
DB_USER=postgres
DB_PASSWORD=lifepilot_secret
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,lifepilot.uz
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://lifepilot.uz

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# AI
GEMINI_API_KEY=your-gemini-api-key

# Telegram Bot
BOT_TOKEN=your-telegram-bot-token

# Resource Resolver
YOUTUBE_API_KEY=your-youtube-data-api-key
SERPER_API_KEY=your-serper-api-key

# Eval / Observability (optional)
LANGFUSE_PUBLIC_KEY=your-langfuse-public-key
LANGFUSE_SECRET_KEY=your-langfuse-secret-key
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Frontend (VITE_ prefix required)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Project Structure

```
PM/
├── backend/
│   ├── config/                # Settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── users/             # User model (UUID, email auth, Google OAuth, telegram_id, preferences)
│   │   ├── tasks/             # Task, Project (subtasks up to 3 levels, templates)
│   │   ├── productivity/      # FocusSession, Habit (target_days, templates), HabitLog, DailyLog
│   │   ├── finance/           # Account, Category, Transaction, Budget, Goal (contribute, templates)
│   │   ├── analytics/         # Dashboard, Productivity/Finance aggregation
│   │   ├── admin_panel/       # Admin API (dashboard, CRUD for all models)
│   │   ├── ai_core/           # AI Service Layer (Gemini 2.5 Flash, 7 methods, Pydantic v2 schemas, cost tracking, Redis cache)
│   │   │   └── eval/          # Golden dataset (60 cases), Promptfoo YAML configs, prompt wrappers
│   │   ├── learning/          # Adaptive learning (LearningGoal, LearningModule, LearningTask, streaks, AI tutor)
│   │   ├── bot/               # Telegram bot (Django app, thin client, webhook mode, 8 handlers including settings)
│   │   └── notifications/     # Notification + NotificationPreference models, Celery Beat tasks
│   ├── scripts/               # eval_prompts.py, check_eval_results.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── styles/            # tokens.css (70+ design tokens, light/dark themes)
│   │   ├── api/               # Axios client + API modules (tasks.ts, finance.ts, learning.ts, ...)
│   │   ├── components/
│   │   │   ├── ui/            # Button, Input, Modal, Card, Badge, Select, StatCard, Skeleton, PageTransition, BulletGraph, WaterfallChart...
│   │   │   └── layout/        # AppLayout (AnimatePresence), Sidebar (collapsible + [), TopBar (⌘K)
│   │   │   └── CommandPalette.tsx  # ⌘K command palette (cmdk)
│   │   ├── hooks/             # React Query hooks (useTasks, useFinance, useFocus, useDashboard, useLearning, ...)
│   │   ├── i18n/              # Localization config + locales (en, ru, uz, uz-cyr) — ~1000 keys each
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage, RegisterPage
│   │   │   ├── dashboard/     # DashboardPage (BI-optimized)
│   │   │   ├── tasks/         # TaskListPage, KanbanPage, CalendarPage, ProjectsPage, InboxPage
│   │   │   ├── productivity/  # FocusTimerPage, HabitsPage, AnalyticsPage, DailyLogPage
│   │   │   ├── finance/       # FinanceOverviewPage, TransactionsPage, BudgetsPage, GoalsPage
│   │   │   ├── learning/      # LearningPage, LearningDetailPage + 13 components
│   │   │   ├── reports/       # ReportsPage
│   │   │   ├── settings/      # SettingsPage
│   │   │   ├── landing/       # LandingPage, IntroScreen, AboutPage, LegalPage
│   │   │   └── admin/         # AdminLayout, AdminDashboard, AdminResourcePage + 10 resource pages
│   │   ├── store/             # Zustand stores (auth, ui)
│   │   ├── types/             # TypeScript interfaces and enums (learning.ts, ...)
│   │   └── utils/             # Formatters, constants, validation, errorHandler, alerts
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Pages

### User Pages (26+)

| Route | Page | Description |
|-------|------|-------------|
| `/` | DashboardPage | BI-optimized summary with StatCard sparklines, trends, alerts |
| `/inbox` | InboxPage | Quick task capture, move to project, delete |
| `/tasks` | TaskListPage | Full task list with filters, search, bulk actions |
| `/tasks/kanban` | KanbanPage | Kanban board with drag-and-drop |
| `/tasks/calendar` | CalendarPage | Monthly calendar with side panel details |
| `/projects` | ProjectsPage | Project cards with templates, icons, progress |
| `/focus` | FocusTimerPage | Focus timer with task binding and history |
| `/daily-log` | DailyLogPage | Journal with mood, energy, history |
| `/habits` | HabitsPage | Habit tracker with templates, streaks, target days |
| `/analytics` | AnalyticsPage | GitHub heatmap, habit progress, peak hours |
| `/finance` | FinanceOverviewPage | Balance, waterfall chart, category breakdown |
| `/transactions` | TransactionsPage | Transaction CRUD with filters and pagination |
| `/budgets` | BudgetsPage | Budgets with bullet graphs and alert badges |
| `/goals` | GoalsPage | Financial goals with progress ring and contribute |
| `/learning` | LearningPage | Learning goals list with create modal, progress cards |
| `/learning/:id` | LearningDetailPage | Goal detail: generating → preview → active plan with modules/tasks |
| `/reports` | ReportsPage | Financial reports |
| `/settings` | SettingsPage | Profile, password, theme, language, currency, timezone |
| `/login` | LoginPage | Email/password + Google OAuth |
| `/register` | RegisterPage | Registration with password strength indicator |
| `/welcome` | LandingPage | Animated landing with 4-language support |
| `/about` | AboutPage | About the project |
| `/privacy` | LegalPage | Privacy policy |
| `/terms` | LegalPage | Terms of service |

### Admin Panel (11 pages)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with system metrics and growth chart |
| `/admin/users` | User management (block/unblock, admin roles) |
| `/admin/tasks` | All tasks with status/priority filters |
| `/admin/projects` | All projects with task counts |
| `/admin/accounts` | All financial accounts |
| `/admin/transactions` | All transactions with type filter |
| `/admin/budgets` | All budgets |
| `/admin/goals` | All financial goals |
| `/admin/focus-sessions` | All focus sessions |
| `/admin/habits` | All habits |
| `/admin/daily-logs` | All journal entries |

---

## API

All endpoints under `/api/v1/`. Authentication via JWT Bearer token. Pagination: 20 items/page. Rate limiting: 100/day anonymous, 1000/day authenticated.

<details>
<summary><b>Auth</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login/` | Login by email/password |
| POST | `/auth/register/` | Registration |
| POST | `/auth/google/` | Login via Google OAuth |
| POST | `/auth/logout/` | Logout (blacklist refresh token) |
| GET/PATCH | `/auth/me/` | Profile (date_format, number_format, week_start) |
| POST | `/auth/token/refresh/` | Refresh JWT |

</details>

<details>
<summary><b>Tasks</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/tasks/items/` | Tasks + filters + bulk update |
| CRUD | `/tasks/projects/` | Projects (templates with icons/colors) |

</details>

<details>
<summary><b>Productivity</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/productivity/focus-sessions/` | Focus sessions (start/stop/history) |
| CRUD | `/productivity/habits/` | Habits (target_days, templates, icons) |
| CRUD | `/productivity/habit-logs/` | Habit logs (today/streak) |
| POST | `/productivity/habit-logs/toggle/` | Toggle habit completion for a date |
| CRUD | `/productivity/daily-logs/` | Daily journal |

</details>

<details>
<summary><b>Finance</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/finance/accounts/` | Accounts |
| CRUD | `/finance/categories/` | Categories (default + user-created) |
| CRUD | `/finance/transactions/` | Transactions + filters |
| CRUD | `/finance/budgets/` | Budgets |
| CRUD | `/finance/goals/` | Financial goals (templates) |
| POST | `/finance/goals/{id}/contribute/` | Contribute amount to a goal |

</details>

<details>
<summary><b>Analytics</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard/` | Summary statistics |
| GET | `/analytics/productivity/` | Heatmap, daily focus, habit progress |
| GET | `/analytics/finance/` | Financial analytics |

</details>

<details>
<summary><b>Learning</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/learning/goals/` | Learning goals CRUD |
| GET/PATCH/DELETE | `/learning/goals/{id}/` | Goal detail |
| POST | `/learning/goals/{id}/generate-plan/` | Trigger AI plan generation (async, 202) |
| GET | `/learning/goals/{id}/status/` | Poll generation status |
| POST | `/learning/goals/{id}/confirm-plan/` | Confirm preview and activate goal |
| GET | `/learning/goals/{id}/today/` | Today's tasks for a goal |
| GET | `/learning/goals/{id}/progress/` | 30-day progress + streak stats |
| POST | `/learning/goals/{id}/pause/` | Pause active goal |
| POST | `/learning/goals/{id}/resume/` | Resume paused goal |
| POST | `/learning/goals/{id}/adapt/` | Trigger AI plan adaptation |
| POST | `/learning/goals/{id}/ask/` | Ask AI tutor a question |
| GET/DELETE | `/learning/goals/{id}/tutor-history/` | Tutor conversation history |
| GET | `/learning/tasks/{id}/` | Task detail |
| POST | `/learning/tasks/{id}/complete/` | Mark task completed (idempotent) |
| POST | `/learning/tasks/{id}/skip/` | Skip task (idempotent) |
| POST | `/learning/tasks/{id}/rate/` | Rate task (1-5) with notes |

</details>

<details>
<summary><b>Notifications</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | List notifications (paginated) |
| POST | `/notifications/{id}/read/` | Mark notification as read |
| POST | `/notifications/read-all/` | Mark all as read |
| GET/PATCH | `/notifications/preferences/` | Notification preferences |

</details>

<details>
<summary><b>AI</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/feedback/` | Submit feedback on AI response quality |

</details>

<details>
<summary><b>Admin Panel (is_staff only)</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin-panel/dashboard/` | System statistics |
| CRUD | `/admin-panel/users/` | Users + toggle_active + toggle_staff |
| CRUD | `/admin-panel/tasks/` | All tasks |
| CRUD | `/admin-panel/projects/` | All projects |
| CRUD | `/admin-panel/accounts/` | All accounts |
| CRUD | `/admin-panel/categories/` | All categories |
| CRUD | `/admin-panel/transactions/` | All transactions |
| CRUD | `/admin-panel/budgets/` | All budgets |
| CRUD | `/admin-panel/goals/` | All goals |
| CRUD | `/admin-panel/focus-sessions/` | All focus sessions |
| CRUD | `/admin-panel/habits/` | All habits |
| CRUD | `/admin-panel/daily-logs/` | All journal entries |

</details>

---

## Security

- JWT with refresh token rotation and blacklist
- Google OAuth 2.0 with id_token verification (google-auth library)
- Ownership validation on all CRUD operations
- Atomic transactions with `select_for_update` for financial operations
- Rate limiting (django-ratelimit): 100/day anonymous, 1000/day authenticated
- CORS whitelist
- CSRF, XSS, Clickjacking protection
- `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS='DENY'`
- Serializer-level validation + frontend form validation
- Argon2 password hashing (with PBKDF2 fallback) and password strength indicator
- Server-side HTML sanitization via bleach (SanitizeMixin on all text-input serializers)
- Circular reference prevention (subtasks max depth 3)
- Admin panel restricted to `is_staff=True`
- Change password, account deletion, data export in settings
- Telegram bot auth via JWT stored in Redis

---

## Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services -> OAuth consent screen -> External -> Publish
3. Credentials -> Create OAuth 2.0 Client ID (Web application)
4. Authorized JavaScript origins: `http://localhost:3000` (dev), `https://lifepilot.uz` (prod)
5. Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback/`
6. Copy Client ID and Client Secret to `.env`

---

## Deployment

- **Hosting:** Google Cloud VM (Compute Engine)
- **Stack:** Docker Compose prod (PostgreSQL 16, Redis 7, Django/gunicorn, React/nginx, Celery, Celery Beat, Telegram Bot)
- **Web server:** Nginx (host-level) as reverse proxy with X-Forwarded-Proto fix for /api/
- **SSL:** Let's Encrypt (certbot) -- HTTPS enforced, HSTS enabled
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy
- **Domain:** lifepilot.uz
- **CI/CD:** GitHub Actions (lint + build on PR, deploy on push to main, 7-parallel eval matrix)

---

## AI Core

All AI functionality is routed through `apps/ai_core/services.AIService` — a unified service layer wrapping Google Gemini 2.5 Flash / Flash-Lite via the google-genai SDK. It exposes 7 structured methods:

1. `parse_user_intent` — classify natural language input
2. `generate_learning_plan` — create a full module/task study plan
3. `adapt_learning_plan` — adjust an existing plan (4 triggers, 7 change types)
4. `answer_learning_question` — AI tutor with Socratic method
5. `generate_daily_tasks` — pick tasks for today
6. `generate_insights` — weekly review and streak motivation
7. `parse_receipt` — extract line items from a photo

All methods use Pydantic v2 schemas for structured I/O, SHA-256 Redis caching, per-request cost calculation, and optional Langfuse tracing (`@observe` decorators). No other module calls Gemini directly.

---

## Learning Module

The adaptive learning system lets users set learning goals, get AI-generated study plans, and track progress with streaks.

**Flow:** create goal → trigger plan generation (async Celery task) → poll status → preview AI plan → confirm → goal becomes active → complete/skip daily tasks.

**Key features:**
- 5 models: LearningGoal, LearningModule, LearningTask, LearningProgress, AdaptationLog
- Daily task queue (`/today/` endpoint)
- Duolingo-style streak system: current_streak, longest_streak, streak_freezes
- AI plan adaptation with 4 triggers: user_stuck, ahead_of_schedule, weekly_review, explicit_request
- 7 adaptation change types: extend_deadline, replace_resource, add_task, remove_task, simplify_module, skip_module, add_module
- AI tutor chat with sliding window context (last 10 messages), rate-limited to 20 questions/day
- Resource resolver: YouTube Data API + Serper API fallback for real learning resources
- Timeout protection: tasks stuck >5 min are reset to draft
- Celery Beat: check_streaks_daily, detect_stuck_users, weekly_learning_review

**Frontend (13 learning components):** GoalCard, CreateGoalModal, PlanPreview, ModuleAccordion, TaskItem, TaskRating, StreakBadge, ProgressBar, GeneratingOverlay (4-step progress indicator), TutorChat, TodayChecklist, LearningDashboardWidget, AdaptationBanner

---

## Telegram Bot

The bot is a thin client — no standalone AI logic, no separate database. All processing goes through the Django ORM and AIService.

**Architecture:** `apps/bot/` (Django app, webhook mode) → Django ORM + `AIService`

**Capabilities:**
- Natural language commands: create tasks, log expenses, check balance, ask tutor questions
- Voice message transcription (Google Speech-to-Text)
- Receipt photo parsing (Google Vision OCR)
- 28 supported intents with confirmation flow
- Multi-language (EN, RU, UZ, UZ-Cyr) with per-user locale
- Rate limiting; auth via JWT stored in Redis
- 8 handlers: start, messages, callbacks, executor, learning, voice, photo, settings
- Management commands: `run_bot` (polling), `set_webhook`

---

## Eval Pipeline

AI response quality is measured across all 7 AIService methods using a curated golden dataset and Promptfoo assertion framework.

**Components:**
- 60 golden test cases across 7 methods
- 7 Promptfoo YAML configs with 74+ tests and structured assertions
- 7 versioned prompt wrapper templates
- `scripts/eval_prompts.py` — standalone Python evaluation runner
- `scripts/check_eval_results.py` — CI quality gate (fails build below threshold)
- GitHub Actions workflow: 7 parallel jobs (one per AI method)
- Langfuse integration: `@observe` decorators on all AIService methods (optional, enabled via env vars)
- Feedback endpoint: `POST /api/v1/ai/feedback/` for human ratings

```bash
# Run evals locally
cd backend
python scripts/eval_prompts.py

# Check results against quality gate
python scripts/check_eval_results.py
```

---

## Development

```bash
# Backend -- run tests
cd backend
python manage.py test

# Frontend -- type checking
cd frontend
npx tsc --noEmit

# Frontend -- linting
npm run lint
```

---

## Contributing

LifePilot is currently a startup project and is **not accepting external contributions** at this time. If you have feedback or suggestions, reach out via email.

---

## License

This project is licensed for **non-commercial use only**.

- **Allowed:** use, study, and modify for personal, educational, and other non-commercial purposes.
- **Prohibited:** commercial use, resale, inclusion in paid products or services without written permission from the author.

See the [LICENSE](LICENSE) file for full terms.

---

## Contact

- **Email:** iamfakhriddin@gmail.com
- **Website:** [lifepilot.uz](https://lifepilot.uz)
