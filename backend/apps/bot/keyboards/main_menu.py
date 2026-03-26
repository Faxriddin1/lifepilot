"""Main menu reply keyboard."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup

MENUS = {
    "ru": [
        [KeyboardButton(text="💸 Расход"), KeyboardButton(text="💰 Доход"), KeyboardButton(text="💳 Баланс")],
        [KeyboardButton(text="📋 Задачи"), KeyboardButton(text="➕ Новая задача")],
        [KeyboardButton(text="📚 Обучение"), KeyboardButton(text="📊 Сводка")],
        [KeyboardButton(text="⚙️ Настройки")],
    ],
    "en": [
        [KeyboardButton(text="💸 Expense"), KeyboardButton(text="💰 Income"), KeyboardButton(text="💳 Balance")],
        [KeyboardButton(text="📋 Tasks"), KeyboardButton(text="➕ New task")],
        [KeyboardButton(text="📚 Learning"), KeyboardButton(text="📊 Summary")],
        [KeyboardButton(text="⚙️ Settings")],
    ],
    "uz": [
        [KeyboardButton(text="💸 Xarajat"), KeyboardButton(text="💰 Daromad"), KeyboardButton(text="💳 Balans")],
        [KeyboardButton(text="📋 Vazifalar"), KeyboardButton(text="➕ Yangi vazifa")],
        [KeyboardButton(text="📚 O'qish"), KeyboardButton(text="📊 Hisobot")],
        [KeyboardButton(text="⚙️ Sozlamalar")],
    ],
}

SETTINGS_BUTTONS = {"⚙️ Настройки", "⚙️ Settings", "⚙️ Sozlamalar"}


def get_main_menu(locale: str = "ru") -> ReplyKeyboardMarkup:
    buttons = MENUS.get(locale, MENUS["ru"])
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True, is_persistent=True)
