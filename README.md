# 🚀 ProductFlow

**All-in-one SaaS платформа** для управления задачами, продуктивностью и финансами.

![Django](https://img.shields.io/badge/Django-5.0-green?logo=django)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 О проекте

ProductFlow объединяет три ключевых направления в одном приложении:

- **Задачи и проекты** — Kanban-доска, календарь, подзадачи, bulk-операции
- **Продуктивность** — Pomodoro/Deep Work таймер, привычки, дневник, аналитика
- **Финансы** — Счета, транзакции, бюджеты, финансовые цели, отчёты

Плюс полноценная **админ-панель** для управления всей системой.

---

## ✨ Возможности

### Задачи
- Создание, редактирование, удаление задач
- Kanban-доска с drag & drop
- Месячный календарь с задачами по дедлайнам
- Подзадачи до 3 уровней вложенности
- Inbox — быстрый сбор входящих задач
- Проекты с прогресс-баром
- Фильтры, поиск, bulk actions

### Продуктивность
- Pomodoro / Deep Work / Short Break / Long Break таймер
- Привязка таймера к задаче
- Привычки с 7-дневной сеткой
- Дневник (сделано/планы/заметки, настроение, энергия)
- Графики продуктивности, heatmap, bar charts

### Финансы
- Счета с балансами
- Транзакции (доход/расход/перевод) с фильтрами
- Бюджеты с прогресс-баром
- Финансовые цели с circular progress
- Cashflow график, pie chart по категориям

### Общее
- Google OAuth 2.0 вход
- Двуязычный интерфейс (Русский / English)
- Тёмная и светлая тема
- Настройка валюты и часового пояса
- Адаптивный дизайн

### Админ-панель (`/admin`)
- Dashboard с метриками системы
- Управление пользователями (блокировка, назначение админов)
- CRUD всех сущностей с поиском, фильтрами, пагинацией
- Детальный просмотр любой записи

---

## 🛠 Tech Stack

| Слой | Технологии |
|------|-----------|
| **Backend** | Django 5.0, Django REST Framework, PostgreSQL 16, Redis 7, Celery |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS 3, Zustand, TanStack Query |
| **Auth** | JWT (SimpleJWT) с ротацией refresh-токенов, Google OAuth 2.0 |
| **i18n** | react-i18next (RU/EN) |
| **Infra** | Docker Compose |

---

## 🚀 Быстрый старт

### С Docker (рекомендуется)

```bash
git clone https://github.com/your-username/productflow.git
cd productflow
cp .env.example .env
docker-compose up --build
```

### Без Docker

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

### Доступ

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Admin Panel | http://localhost:3000/admin |
| Django Admin | http://localhost:8000/admin/ |
| Swagger UI | http://localhost:8000/api/v1/docs/ |
| ReDoc | http://localhost:8000/api/v1/redoc/ |

---

## 📁 Структура проекта

```
productflow/
├── backend/
│   ├── config/                # Settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── users/             # User model (UUID, email auth, Google OAuth)
│   │   ├── tasks/             # Task, Project (subtasks до 3 уровней)
│   │   ├── productivity/      # FocusSession, Habit, HabitLog, DailyLog
│   │   ├── finance/           # Account, Category, Transaction, Budget, Goal
│   │   ├── analytics/         # Dashboard, Productivity/Finance агрегация
│   │   └── admin_panel/       # Admin API (dashboard, CRUD всех моделей)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + API модули
│   │   ├── components/        # UI компоненты + Layout
│   │   ├── hooks/             # React Query хуки
│   │   ├── i18n/              # Локализация (en.json, ru.json)
│   │   ├── pages/             # 18 пользовательских + 11 админских страниц
│   │   ├── store/             # Zustand stores (auth, ui)
│   │   ├── types/             # TypeScript интерфейсы
│   │   └── utils/             # Утилиты, валидация, обработка ошибок
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📄 Страницы

### Пользовательские (18)

| Маршрут | Описание |
|---------|----------|
| `/` | Dashboard — сводка задач, фокуса, баланса |
| `/inbox` | Входящие задачи с quick add |
| `/tasks` | Список задач с фильтрами и bulk actions |
| `/tasks/kanban` | Kanban-доска |
| `/tasks/calendar` | Месячный календарь |
| `/projects` | Проекты с прогрессом |
| `/focus` | Таймер фокусировки |
| `/daily-log` | Дневник |
| `/habits` | Привычки |
| `/analytics` | Аналитика продуктивности |
| `/finance` | Обзор финансов |
| `/transactions` | Транзакции |
| `/budgets` | Бюджеты |
| `/goals` | Финансовые цели |
| `/reports` | Отчёты |
| `/settings` | Настройки профиля |
| `/login` | Вход |
| `/register` | Регистрация |

### Админ-панель (11)

| Маршрут | Описание |
|---------|----------|
| `/admin` | Dashboard с метриками системы |
| `/admin/users` | Управление пользователями |
| `/admin/tasks` | Все задачи |
| `/admin/projects` | Все проекты |
| `/admin/accounts` | Все счета |
| `/admin/transactions` | Все транзакции |
| `/admin/budgets` | Все бюджеты |
| `/admin/goals` | Все цели |
| `/admin/focus-sessions` | Все фокус-сессии |
| `/admin/habits` | Все привычки |
| `/admin/daily-logs` | Все дневники |

---

## 🔌 API

Все эндпоинты под `/api/v1/`. Аутентификация через JWT Bearer token.

<details>
<summary><b>Auth</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/auth/login/` | Вход по email/пароль |
| POST | `/auth/register/` | Регистрация |
| POST | `/auth/google/` | Вход через Google OAuth |
| POST | `/auth/logout/` | Выход (blacklist refresh) |
| GET/PATCH | `/auth/me/` | Профиль |
| POST | `/auth/token/refresh/` | Обновить JWT |

</details>

<details>
<summary><b>Tasks</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| CRUD | `/tasks/items/` | Задачи + фильтры + bulk update |
| CRUD | `/tasks/projects/` | Проекты |

</details>

<details>
<summary><b>Productivity</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| CRUD | `/productivity/focus-sessions/` | Фокус-сессии (start/stop/history) |
| CRUD | `/productivity/habits/` | Привычки |
| CRUD | `/productivity/habit-logs/` | Логи привычек (today/streak) |
| CRUD | `/productivity/daily-logs/` | Дневник (today) |

</details>

<details>
<summary><b>Finance</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| CRUD | `/finance/accounts/` | Счета |
| CRUD | `/finance/categories/` | Категории |
| CRUD | `/finance/transactions/` | Транзакции + фильтры |
| CRUD | `/finance/budgets/` | Бюджеты |
| CRUD | `/finance/goals/` | Финансовые цели |

</details>

<details>
<summary><b>Analytics</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/analytics/dashboard/` | Сводная статистика |
| GET | `/analytics/productivity/` | Heatmap, daily focus |
| GET | `/analytics/finance/` | Финансовая аналитика |

</details>

<details>
<summary><b>Admin Panel (is_staff only)</b></summary>

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/admin-panel/dashboard/` | Системная статистика |
| CRUD | `/admin-panel/users/` | Пользователи + toggle_active + toggle_staff |
| CRUD | `/admin-panel/tasks/` | Задачи |
| CRUD | `/admin-panel/projects/` | Проекты |
| CRUD | `/admin-panel/accounts/` | Счета |
| CRUD | `/admin-panel/categories/` | Категории |
| CRUD | `/admin-panel/transactions/` | Транзакции |
| CRUD | `/admin-panel/budgets/` | Бюджеты |
| CRUD | `/admin-panel/goals/` | Цели |
| CRUD | `/admin-panel/focus-sessions/` | Фокус-сессии |
| CRUD | `/admin-panel/habits/` | Привычки |
| CRUD | `/admin-panel/daily-logs/` | Дневники |

</details>

---

## ⚙️ Переменные окружения

Создайте `.env` файл в корне проекта:

```env
# Backend
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=productflow
DB_USER=postgres
DB_PASSWORD=productflow_secret
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Frontend
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 🔒 Безопасность

- JWT с ротацией refresh-токенов + blacklist
- Google OAuth 2.0 (проверка id_token через google-auth)
- Ownership validation на всех CRUD операциях
- Atomic transactions для финансовых операций
- `select_for_update` для предотвращения race conditions
- Rate limiting (100/день anon, 1000/день auth)
- CORS whitelist
- CSRF, XSS, Clickjacking защита
- Admin panel — доступ только `is_staff=True`
- Валидация: serializers (бэкенд) + формы (фронтенд)
- Circular reference prevention (subtasks max depth 3)

---

## 🔧 Google OAuth Setup

1. Откройте [Google Cloud Console](https://console.cloud.google.com)
2. Создайте проект → APIs & Services → OAuth consent screen → External → Publish
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. Authorized JavaScript origins: `http://localhost:3000`
5. Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback/`
6. Скопируйте Client ID и Client Secret в `.env`

---

## 📊 Скриншоты

| Dashboard | Kanban | Calendar |
|-----------|--------|----------|
| Сводка задач, фокуса, баланса | Drag & drop между колонками | Месячный вид с задачами |

| Focus Timer | Daily Log | Admin Panel |
|-------------|-----------|-------------|
| Pomodoro с круговым прогрессом | Дневник с настроением | Системная статистика |

---

## 🤝 Разработка

```bash
# Backend — запуск тестов
cd backend
python manage.py test

# Frontend — проверка типов
cd frontend
npx tsc --noEmit

# Frontend — линтинг
npm run lint
```

---

## 📝 Лицензия

MIT License. Свободное использование в коммерческих и некоммерческих проектах.
