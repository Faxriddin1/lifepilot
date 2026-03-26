"""Bot settings handler — language, notifications, quiet hours."""

import logging
from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from asgiref.sync import sync_to_async

logger = logging.getLogger("bot")
router = Router()

# Localized strings
STRINGS = {
    "ru": {
        "settings_title": "⚙️ <b>Настройки бота</b>",
        "language": "🌐 Язык интерфейса",
        "notifications": "🔔 Уведомления",
        "current_lang": "Текущий: Русский 🇷🇺",
        "lang_changed": "✅ Язык изменён на: {lang}",
        "notif_title": "🔔 <b>Настройки уведомлений</b>",
        "morning_digest": "☀️ Утренний дайджест",
        "streak_alerts": "🔥 Предупреждения о стриках",
        "deadline_reminders": "⏰ Напоминания о сроках",
        "weekly_review": "📊 Еженедельный отчёт",
        "plan_ready": "✅ План готов",
        "quiet_hours": "🌙 Тихие часы",
        "quiet_hours_set": "🌙 Тихие часы: {start} — {end}",
        "quiet_hours_hint": "Введите время в формате ЧЧ:ЧЧ\nНапример: 22:08 (с 22:00 до 08:00)",
        "quiet_hours_saved": "✅ Тихие часы: {start} — {end}",
        "quiet_hours_error": "❌ Неверный формат. Используйте ЧЧ:ЧЧ (например 22:08)",
        "enabled": "✅ Вкл",
        "disabled": "❌ Выкл",
        "back": "← Назад",
        "saved": "✅ Сохранено",
    },
    "en": {
        "settings_title": "⚙️ <b>Bot Settings</b>",
        "language": "🌐 Interface Language",
        "notifications": "🔔 Notifications",
        "current_lang": "Current: English 🇺🇸",
        "lang_changed": "✅ Language changed to: {lang}",
        "notif_title": "🔔 <b>Notification Settings</b>",
        "morning_digest": "☀️ Morning Digest",
        "streak_alerts": "🔥 Streak Alerts",
        "deadline_reminders": "⏰ Deadline Reminders",
        "weekly_review": "📊 Weekly Review",
        "plan_ready": "✅ Plan Ready",
        "quiet_hours": "🌙 Quiet Hours",
        "quiet_hours_set": "🌙 Quiet hours: {start} — {end}",
        "quiet_hours_hint": "Enter time as HH:HH\nExample: 22:08 (from 22:00 to 08:00)",
        "quiet_hours_saved": "✅ Quiet hours: {start} — {end}",
        "quiet_hours_error": "❌ Invalid format. Use HH:HH (e.g. 22:08)",
        "enabled": "✅ On",
        "disabled": "❌ Off",
        "back": "← Back",
        "saved": "✅ Saved",
    },
    "uz": {
        "settings_title": "⚙️ <b>Bot sozlamalari</b>",
        "language": "🌐 Interfeys tili",
        "notifications": "🔔 Bildirishnomalar",
        "current_lang": "Joriy: O'zbek 🇺🇿",
        "lang_changed": "✅ Til o'zgartirildi: {lang}",
        "notif_title": "🔔 <b>Bildirishnoma sozlamalari</b>",
        "morning_digest": "☀️ Ertalabki xulosa",
        "streak_alerts": "🔥 Streak ogohlantirishlari",
        "deadline_reminders": "⏰ Muddat eslatmalari",
        "weekly_review": "📊 Haftalik hisobot",
        "plan_ready": "✅ Reja tayyor",
        "quiet_hours": "🌙 Tinch soatlar",
        "quiet_hours_set": "🌙 Tinch soatlar: {start} — {end}",
        "quiet_hours_hint": "Vaqtni SS:SS formatida kiriting\nMasalan: 22:08 (22:00 dan 08:00 gacha)",
        "quiet_hours_saved": "✅ Tinch soatlar: {start} — {end}",
        "quiet_hours_error": "❌ Noto'g'ri format. SS:SS ishlating (masalan 22:08)",
        "enabled": "✅ Yoq",
        "disabled": "❌ O'ch",
        "back": "← Orqaga",
        "saved": "✅ Saqlandi",
    },
}


def _t(locale: str, key: str, **kwargs) -> str:
    s = STRINGS.get(locale, STRINGS["ru"]).get(key, STRINGS["ru"].get(key, key))
    return s.format(**kwargs) if kwargs else s


LANG_NAMES = {
    "ru": "🇷🇺 Русский",
    "en": "🇺🇸 English",
    "uz": "🇺🇿 O'zbek tili",
}


# ==================== /settings command ====================

@router.message(Command("settings"))
async def cmd_settings(message: Message, user=None, **kwargs):
    locale = user.locale if user else "ru"
    await message.answer(
        _t(locale, "settings_title"),
        parse_mode="HTML",
        reply_markup=_settings_menu_kb(locale),
    )


def _settings_menu_kb(locale: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=_t(locale, "language"), callback_data="settings:lang")],
        [InlineKeyboardButton(text=_t(locale, "notifications"), callback_data="settings:notif")],
        [InlineKeyboardButton(text=_t(locale, "quiet_hours"), callback_data="settings:quiet")],
    ])


# ==================== Language settings ====================

@router.callback_query(F.data == "settings:lang")
async def settings_language(callback: CallbackQuery, user=None, **kwargs):
    locale = user.locale if user else "ru"
    buttons = []
    for code, name in LANG_NAMES.items():
        check = " ✓" if code == locale else ""
        buttons.append([InlineKeyboardButton(text=f"{name}{check}", callback_data=f"setlang:{code}")])
    buttons.append([InlineKeyboardButton(text=_t(locale, "back"), callback_data="settings:main")])

    await callback.message.edit_text(
        f"🌐 <b>{_t(locale, 'language')}</b>",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("setlang:"))
async def set_language(callback: CallbackQuery, user=None, **kwargs):
    new_lang = callback.data.split(":")[1]
    if user and new_lang in LANG_NAMES:
        user.locale = new_lang
        await sync_to_async(user.save)(update_fields=["locale"])

        from apps.bot.keyboards.main_menu import get_main_menu
        await callback.message.edit_text(
            _t(new_lang, "lang_changed", lang=LANG_NAMES[new_lang]),
            reply_markup=_settings_menu_kb(new_lang),
        )
        # Update reply keyboard
        await callback.message.answer(
            "👍",
            reply_markup=get_main_menu(new_lang),
        )
    await callback.answer()


# ==================== Notification settings ====================

@router.callback_query(F.data == "settings:notif")
async def settings_notifications(callback: CallbackQuery, user=None, **kwargs):
    locale = user.locale if user else "ru"
    prefs = await _get_prefs(user)

    buttons = [
        [_notif_toggle_btn(locale, "morning_digest", prefs.morning_digest)],
        [_notif_toggle_btn(locale, "streak_alerts", prefs.streak_risk)],
        [_notif_toggle_btn(locale, "deadline_reminders", prefs.deadline_reminder)],
        [_notif_toggle_btn(locale, "weekly_review", prefs.weekly_review)],
        [_notif_toggle_btn(locale, "plan_ready", prefs.plan_ready)],
        [InlineKeyboardButton(text=_t(locale, "back"), callback_data="settings:main")],
    ]

    await callback.message.edit_text(
        _t(locale, "notif_title"),
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )
    await callback.answer()


def _notif_toggle_btn(locale: str, key: str, is_on: bool) -> InlineKeyboardButton:
    status = _t(locale, "enabled") if is_on else _t(locale, "disabled")
    return InlineKeyboardButton(
        text=f"{_t(locale, key)} — {status}",
        callback_data=f"togglenotif:{key}",
    )


NOTIF_FIELD_MAP = {
    "morning_digest": "morning_digest",
    "streak_alerts": "streak_risk",
    "deadline_reminders": "deadline_reminder",
    "weekly_review": "weekly_review",
    "plan_ready": "plan_ready",
}


@router.callback_query(F.data.startswith("togglenotif:"))
async def toggle_notification(callback: CallbackQuery, user=None, **kwargs):
    key = callback.data.split(":")[1]
    field = NOTIF_FIELD_MAP.get(key)
    if not field or not user:
        await callback.answer()
        return

    prefs = await _get_prefs(user)
    current = getattr(prefs, field, True)
    setattr(prefs, field, not current)
    await sync_to_async(prefs.save)(update_fields=[field])

    # Refresh notification settings view
    await settings_notifications(callback, user=user)


# ==================== Quiet hours ====================

@router.callback_query(F.data == "settings:quiet")
async def settings_quiet_hours(callback: CallbackQuery, user=None, **kwargs):
    locale = user.locale if user else "ru"
    prefs = await _get_prefs(user)

    start = prefs.quiet_hours_start.strftime("%H:%M") if prefs.quiet_hours_start else "22:00"
    end = prefs.quiet_hours_end.strftime("%H:%M") if prefs.quiet_hours_end else "08:00"

    await callback.message.edit_text(
        f"{_t(locale, 'quiet_hours_set', start=start, end=end)}\n\n"
        f"{_t(locale, 'quiet_hours_hint')}",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="22:00 — 08:00", callback_data="setquiet:22:08")],
            [InlineKeyboardButton(text="23:00 — 07:00", callback_data="setquiet:23:07")],
            [InlineKeyboardButton(text="21:00 — 09:00", callback_data="setquiet:21:09")],
            [InlineKeyboardButton(text=_t(locale, "disabled"), callback_data="setquiet:off")],
            [InlineKeyboardButton(text=_t(locale, "back"), callback_data="settings:main")],
        ]),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("setquiet:"))
async def set_quiet_hours(callback: CallbackQuery, user=None, **kwargs):
    locale = user.locale if user else "ru"
    value = callback.data.split(":", 1)[1]

    prefs = await _get_prefs(user)

    if value == "off":
        from datetime import time
        prefs.quiet_hours_start = time(0, 0)
        prefs.quiet_hours_end = time(0, 0)
        await sync_to_async(prefs.save)(update_fields=["quiet_hours_start", "quiet_hours_end"])
        await callback.message.edit_text(
            f"✅ {_t(locale, 'disabled')}",
            reply_markup=_settings_menu_kb(locale),
        )
    else:
        try:
            parts = value.split(":")
            start_h, end_h = int(parts[0]), int(parts[1])
            from datetime import time
            prefs.quiet_hours_start = time(start_h, 0)
            prefs.quiet_hours_end = time(end_h, 0)
            await sync_to_async(prefs.save)(update_fields=["quiet_hours_start", "quiet_hours_end"])
            await callback.message.edit_text(
                _t(locale, "quiet_hours_saved", start=f"{start_h:02d}:00", end=f"{end_h:02d}:00"),
                reply_markup=_settings_menu_kb(locale),
            )
        except (ValueError, IndexError):
            await callback.message.edit_text(
                _t(locale, "quiet_hours_error"),
                reply_markup=_settings_menu_kb(locale),
            )

    await callback.answer()


# ==================== Back to main settings ====================

@router.callback_query(F.data == "settings:main")
async def settings_back(callback: CallbackQuery, user=None, **kwargs):
    locale = user.locale if user else "ru"
    await callback.message.edit_text(
        _t(locale, "settings_title"),
        parse_mode="HTML",
        reply_markup=_settings_menu_kb(locale),
    )
    await callback.answer()


# ==================== Helpers ====================

async def _get_prefs(user):
    from apps.notifications.models import NotificationPreference
    prefs, _ = await sync_to_async(NotificationPreference.objects.get_or_create)(user=user)
    return prefs
