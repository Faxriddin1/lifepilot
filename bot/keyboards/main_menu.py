from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def main_menu_keyboard(locale: str = "ru") -> ReplyKeyboardMarkup:
    """Main bot menu — always visible."""
    menus = {
        "ru": [
            [KeyboardButton(text="💸 Расход"), KeyboardButton(text="💰 Доход"), KeyboardButton(text="💳 Баланс")],
            [KeyboardButton(text="📋 Задачи"), KeyboardButton(text="➕ Новая задача")],
            [KeyboardButton(text="🎯 Фокус"), KeyboardButton(text="✅ Привычки")],
            [KeyboardButton(text="📊 Сводка"), KeyboardButton(text="💰 Финансы"), KeyboardButton(text="⚙️ Меню")],
        ],
        "en": [
            [KeyboardButton(text="💸 Expense"), KeyboardButton(text="💰 Income"), KeyboardButton(text="💳 Balance")],
            [KeyboardButton(text="📋 Tasks"), KeyboardButton(text="➕ New task")],
            [KeyboardButton(text="🎯 Focus"), KeyboardButton(text="✅ Habits")],
            [KeyboardButton(text="📊 Summary"), KeyboardButton(text="💰 Finance"), KeyboardButton(text="⚙️ Menu")],
        ],
        "uz": [
            [KeyboardButton(text="💸 Xarajat"), KeyboardButton(text="💰 Daromad"), KeyboardButton(text="💳 Balans")],
            [KeyboardButton(text="📋 Vazifalar"), KeyboardButton(text="➕ Yangi vazifa")],
            [KeyboardButton(text="🎯 Fokus"), KeyboardButton(text="✅ Odatlar")],
            [KeyboardButton(text="📊 Hisobot"), KeyboardButton(text="💰 Moliya"), KeyboardButton(text="⚙️ Menyu")],
        ],
        "uz-cyr": [
            [KeyboardButton(text="💸 Харажат"), KeyboardButton(text="💰 Даромад"), KeyboardButton(text="💳 Баланс")],
            [KeyboardButton(text="📋 Вазифалар"), KeyboardButton(text="➕ Янги вазифа")],
            [KeyboardButton(text="🎯 Фокус"), KeyboardButton(text="✅ Одатлар")],
            [KeyboardButton(text="📊 Ҳисобот"), KeyboardButton(text="💰 Молия"), KeyboardButton(text="⚙️ Меню")],
        ],
    }

    return ReplyKeyboardMarkup(
        keyboard=menus.get(locale, menus["ru"]),
        resize_keyboard=True,
    )


def extended_menu_keyboard(locale: str = "ru") -> ReplyKeyboardMarkup:
    """Extended menu — shown when user presses ⚙️."""
    menus = {
        "ru": [
            [KeyboardButton(text="🏦 Счета"), KeyboardButton(text="📂 Проекты"), KeyboardButton(text="📁 Категории")],
            [KeyboardButton(text="📈 Бюджеты"), KeyboardButton(text="🎯 Цели")],
            [KeyboardButton(text="📝 Журнал дня"), KeyboardButton(text="📊 Отчёт за неделю")],
            [KeyboardButton(text="🔙 Назад")],
        ],
        "en": [
            [KeyboardButton(text="🏦 Accounts"), KeyboardButton(text="📂 Projects"), KeyboardButton(text="📁 Categories")],
            [KeyboardButton(text="📈 Budgets"), KeyboardButton(text="🎯 Goals")],
            [KeyboardButton(text="📝 Daily log"), KeyboardButton(text="📊 Week report")],
            [KeyboardButton(text="🔙 Back")],
        ],
        "uz": [
            [KeyboardButton(text="🏦 Hisoblar"), KeyboardButton(text="📂 Loyihalar"), KeyboardButton(text="📁 Kategoriyalar")],
            [KeyboardButton(text="📈 Byudjetlar"), KeyboardButton(text="🎯 Maqsadlar")],
            [KeyboardButton(text="📝 Kun jurnali"), KeyboardButton(text="📊 Hafta hisoboti")],
            [KeyboardButton(text="🔙 Orqaga")],
        ],
        "uz-cyr": [
            [KeyboardButton(text="🏦 Ҳисоблар"), KeyboardButton(text="📂 Лойиҳалар"), KeyboardButton(text="📁 Категориялар")],
            [KeyboardButton(text="📈 Бюджетлар"), KeyboardButton(text="🎯 Мақсадлар")],
            [KeyboardButton(text="📝 Кун журнали"), KeyboardButton(text="📊 Ҳафта ҳисоботи")],
            [KeyboardButton(text="🔙 Орқага")],
        ],
    }

    return ReplyKeyboardMarkup(
        keyboard=menus.get(locale, menus["ru"]),
        resize_keyboard=True,
    )


# Button text → AI-ready text mapping (so Gemini understands button presses)
BUTTON_TO_TEXT = {
    # Russian
    "💸 Расход": "записать расход",
    "💰 Доход": "записать доход",
    "💳 Баланс": "покажи баланс",
    "📋 Задачи": "покажи задачи",
    "➕ Новая задача": "создать задачу",
    "🎯 Фокус": "начни фокус 25 минут",
    "✅ Привычки": "покажи привычки",
    "📊 Сводка": "что на сегодня?",
    "💰 Финансы": "финансовый отчёт",
    "🏦 Счета": "покажи счета",
    "📂 Проекты": "покажи проекты",
    "📁 Категории": "покажи категории",
    "📈 Бюджеты": "статус бюджетов",
    "🎯 Цели": "мои цели",
    "📝 Журнал дня": "записать журнал дня",
    "📊 Отчёт за неделю": "отчёт за неделю",
    # English
    "💸 Expense": "record expense",
    "💰 Income": "record income",
    "💳 Balance": "show balance",
    "📋 Tasks": "show tasks",
    "➕ New task": "create task",
    "🎯 Focus": "start focus 25 minutes",
    "✅ Habits": "show habits",
    "📊 Summary": "today summary",
    "💰 Finance": "finance report",
    "🏦 Accounts": "show accounts",
    "📂 Projects": "show projects",
    "📁 Categories": "show categories",
    "📈 Budgets": "budget status",
    "🎯 Goals": "my goals",
    "📝 Daily log": "daily log",
    "📊 Week report": "week report",
    # Uzbek latin
    "💸 Xarajat": "xarajat yozish",
    "💰 Daromad": "daromad yozish",
    "💳 Balans": "balansni ko'rsat",
    "📋 Vazifalar": "vazifalarni ko'rsat",
    "➕ Yangi vazifa": "vazifa yaratish",
    "🎯 Fokus": "fokus boshlash 25 daqiqa",
    "✅ Odatlar": "odatlarni ko'rsat",
    "📊 Hisobot": "bugungi hisobot",
    "💰 Moliya": "moliyaviy hisobot",
    "🏦 Hisoblar": "hisoblarni ko'rsat",
    "📂 Loyihalar": "loyihalarni ko'rsat",
    "📁 Kategoriyalar": "kategoriyalarni ko'rsat",
    "📈 Byudjetlar": "byudjet holati",
    "🎯 Maqsadlar": "maqsadlarim",
    "📝 Kun jurnali": "kun jurnali",
    "📊 Hafta hisoboti": "hafta hisoboti",
    # Uzbek cyrillic
    "💸 Харажат": "харажат ёзиш",
    "💰 Даромад": "даромад ёзиш",
    "💳 Баланс": "балансни кўрсат",
    "📋 Вазифалар": "вазифаларни кўрсат",
    "➕ Янги вазифа": "вазифа яратиш",
    "🎯 Фокус": "фокус бошлаш 25 дақиқа",
    "✅ Одатлар": "одатларни кўрсат",
    "📊 Ҳисобот": "бугунги ҳисобот",
    "💰 Молия": "молиявий ҳисобот",
    "🏦 Ҳисоблар": "ҳисобларни кўрсат",
    "📂 Лойиҳалар": "лойиҳаларни кўрсат",
    "📁 Категориялар": "категорияларни кўрсат",
    "📈 Бюджетлар": "бюджет ҳолати",
    "🎯 Мақсадлар": "мақсадларим",
    "📝 Кун журнали": "кун журнали",
    "📊 Ҳафта ҳисоботи": "ҳафта ҳисоботи",
}
