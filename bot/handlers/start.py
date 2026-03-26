from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, CallbackQuery

from i18n import get_translator
from keyboards.main_menu import main_menu_keyboard
from services.auth import link_account, link_account_by_code

router = Router()


class LoginStates(StatesGroup):
    waiting_email = State()
    waiting_password = State()
    waiting_code = State()


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext, lifepilot_user=None, session_factory=None, **kwargs):
    t = get_translator("ru")

    if lifepilot_user and lifepilot_user.access_token:
        t = get_translator(lifepilot_user.locale)
        await message.answer(t("already_linked"))
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔑 Код из Settings", callback_data="auth:code")],
        [InlineKeyboardButton(text="📧 Email и пароль", callback_data="auth:email")],
    ])

    await message.answer(
        f"{t('welcome')}\n\n{t('link_account')}\n\nВыберите способ привязки:",
        reply_markup=keyboard,
    )
    await state.clear()


@router.callback_query(F.data == "auth:code")
async def auth_code_start(callback: CallbackQuery, state: FSMContext, **kwargs):
    await callback.message.edit_text(
        "🔑 *Привязка через код:*\n\n"
        "1. Откройте lifepilot.uz → Settings → Security\n"
        "2. Нажмите «Получить код привязки»\n"
        "3. Отправьте 6-значный код сюда",
    )
    await state.set_state(LoginStates.waiting_code)
    await callback.answer()


@router.callback_query(F.data == "auth:email")
async def auth_email_start(callback: CallbackQuery, state: FSMContext, **kwargs):
    t = get_translator("ru")
    await callback.message.edit_text(t("enter_email"))
    await state.set_state(LoginStates.waiting_email)
    await callback.answer()


@router.message(LoginStates.waiting_code)
async def process_code(message: Message, state: FSMContext, session_factory=None, **kwargs):
    code = message.text.strip()

    # Validate: 6 digits
    if not code.isdigit() or len(code) != 6:
        await message.answer("❌ Введите 6-значный код из Settings.")
        return

    status_msg = await message.answer("🔄 Проверяю код...")

    result = await link_account_by_code(message.from_user.id, code, session_factory)

    if result:
        locale = result.get("locale", "ru")
        t = get_translator(locale)
        await status_msg.edit_text(t("login_success"))
        await message.answer(
            "Просто напишите что нужно — текстом или голосовым. Или используйте меню ⬇️",
            reply_markup=main_menu_keyboard(locale),
        )
    else:
        await status_msg.edit_text("❌ Неверный или просроченный код. Попробуйте получить новый в Settings.")

    await state.clear()


@router.message(Command("menu"))
async def cmd_menu(message: Message, lifepilot_user=None, **kwargs):
    locale = lifepilot_user.locale if lifepilot_user else "ru"
    await message.answer("🏠 Главное меню:", reply_markup=main_menu_keyboard(locale))


@router.message(Command("help"))
async def cmd_help(message: Message, lifepilot_user=None, **kwargs):
    locale = lifepilot_user.locale if lifepilot_user else "ru"
    t = get_translator(locale)
    await message.answer(t("help"))


@router.message(LoginStates.waiting_email)
async def process_email(message: Message, state: FSMContext, **kwargs):
    email = message.text.strip()

    if "@" not in email or "." not in email:
        await message.answer("❌ Введите корректный email.")
        return

    await state.update_data(email=email)
    t = get_translator("ru")
    await message.answer(t("enter_password"))

    # Delete the message with email for security
    try:
        await message.delete()
    except Exception:
        pass

    await state.set_state(LoginStates.waiting_password)


@router.message(LoginStates.waiting_password)
async def process_password(message: Message, state: FSMContext, session_factory=None, **kwargs):
    password = message.text.strip()

    # Delete password message immediately
    try:
        await message.delete()
    except Exception:
        pass

    data = await state.get_data()
    email = data.get("email", "")

    status_msg = await message.answer("🔄 Проверяю данные...")

    result = await link_account(message.from_user.id, email, password, session_factory)

    if result:
        locale = result.get("locale", "ru")
        t = get_translator(locale)
        await status_msg.edit_text(t("login_success"))
        await message.answer(
            "Просто напишите что нужно — текстом или голосовым. Или используйте меню ⬇️",
            reply_markup=main_menu_keyboard(locale),
        )
    else:
        t = get_translator("ru")
        await status_msg.edit_text(t("login_failed"))

    await state.clear()
