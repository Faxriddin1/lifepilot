from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def confirm_action_keyboard(action_id: str, locale: str = "ru") -> InlineKeyboardMarkup:
    labels = {
        "ru": ("✅ Да", "❌ Отмена"),
        "en": ("✅ Yes", "❌ Cancel"),
        "uz": ("✅ Ha", "❌ Bekor"),
        "uz-cyr": ("✅ Ҳа", "❌ Бекор"),
    }
    yes, cancel = labels.get(locale, labels["ru"])

    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=yes, callback_data=f"confirm:{action_id}"),
            InlineKeyboardButton(text=cancel, callback_data=f"cancel:{action_id}"),
        ]
    ])
