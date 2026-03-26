"""Confirm/cancel inline keyboard."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def get_confirm_keyboard(action_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да", callback_data=f"confirm:{action_id}"),
            InlineKeyboardButton(text="❌ Отмена", callback_data=f"cancel:{action_id}"),
        ]
    ])
