"""Start handler — registration + account linking flow."""

import logging

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from asgiref.sync import sync_to_async
from django.core.cache import cache

logger = logging.getLogger("bot")
router = Router()


class LinkStates(StatesGroup):
    waiting_code = State()
    waiting_email = State()
    waiting_password = State()
    # Registration
    reg_name = State()
    reg_email = State()
    reg_password = State()


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext, **kwargs):
    telegram_id = message.from_user.id
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import RefreshToken
    User = get_user_model()

    # 1. Check JWT in Redis cache
    tokens = cache.get(f"bot:jwt:{telegram_id}")
    if tokens:
        from apps.bot.keyboards.main_menu import get_main_menu
        try:
            user = await User.objects.aget(telegram_id=telegram_id)
            locale = user.locale or "ru"
            name = user.name or user.email.split("@")[0]
        except User.DoesNotExist:
            locale = "ru"
            name = message.from_user.first_name or "User"

        await message.answer(
            f"✅ Добро пожаловать, {name}!\n\n"
            "Просто напишите что хотите сделать, или используйте меню.",
            reply_markup=get_main_menu(locale),
        )
        return

    # 2. AUTO-LINK: Check if telegram_id already in DB
    try:
        user = await User.objects.aget(telegram_id=telegram_id)
        refresh = await sync_to_async(RefreshToken.for_user)(user)
        cache.set(f"bot:jwt:{telegram_id}", {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": str(user.id),
        }, 60 * 60 * 24 * 7)

        from apps.bot.keyboards.main_menu import get_main_menu
        locale = user.locale or "ru"
        name = user.name or user.email.split("@")[0]

        await message.answer(
            f"✅ Добро пожаловать, {name}!\n\n"
            "Ваш аккаунт подключён автоматически.\n"
            "Просто напишите что хотите сделать.",
            reply_markup=get_main_menu(locale),
        )
        return
    except User.DoesNotExist:
        pass

    # 3. New user — show registration + login options
    first_name = message.from_user.first_name or ""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Создать аккаунт", callback_data="reg:start")],
        [InlineKeyboardButton(text="🔑 У меня есть аккаунт", callback_data="link:choose")],
    ])

    await message.answer(
        f"👋 Привет, {first_name}!\n\n"
        "🚀 <b>LifePilot</b> — ваш персональный помощник:\n"
        "• 📋 Задачи и проекты\n"
        "• 💰 Финансы и бюджет\n"
        "• 📚 AI-обучение с персональным планом\n"
        "• ⏱ Фокус-таймер и привычки\n\n"
        "Выберите действие:",
        reply_markup=keyboard,
        parse_mode="HTML",
    )


# ==================== REGISTRATION ====================

@router.callback_query(F.data == "reg:start")
async def reg_start(callback: CallbackQuery, state: FSMContext):
    first_name = callback.from_user.first_name or ""
    await state.update_data(name=first_name)
    await callback.message.edit_text(
        f"📱 <b>Регистрация</b>\n\n"
        f"Ваше имя: <b>{first_name}</b>\n\n"
        "Хотите изменить? Введите имя или нажмите «Далее»:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=f"✅ Продолжить как {first_name}", callback_data="reg:keep_name")],
            [InlineKeyboardButton(text="← Назад", callback_data="link:back")],
        ]) if first_name else InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="← Назад", callback_data="link:back")],
        ]),
    )
    await state.set_state(LinkStates.reg_name)
    await callback.answer()


@router.callback_query(F.data == "reg:keep_name")
async def reg_keep_name(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text("📧 Введите ваш email:")
    await state.set_state(LinkStates.reg_email)
    await callback.answer()


@router.message(LinkStates.reg_name)
async def reg_name_input(message: Message, state: FSMContext):
    name = message.text.strip() if message.text else ""
    if len(name) < 2:
        await message.answer("❌ Имя слишком короткое. Введите ещё раз:")
        return
    await state.update_data(name=name)
    await message.answer("📧 Введите ваш email:")
    await state.set_state(LinkStates.reg_email)


@router.message(LinkStates.reg_email)
async def reg_email_input(message: Message, state: FSMContext):
    email = message.text.strip().lower() if message.text else ""
    if "@" not in email or "." not in email:
        await message.answer("❌ Некорректный email. Попробуйте ещё:")
        return

    # Check if email already exists
    from django.contrib.auth import get_user_model
    User = get_user_model()
    exists = await User.objects.filter(email=email).aexists()
    if exists:
        await message.answer(
            "⚠️ Этот email уже зарегистрирован.\n\n"
            "Используйте «У меня есть аккаунт» → /start"
        )
        await state.clear()
        return

    await state.update_data(email=email)
    await message.answer(
        "🔒 Придумайте пароль (минимум 8 символов):\n\n"
        "💡 Сообщение с паролем будет удалено."
    )
    await state.set_state(LinkStates.reg_password)


@router.message(LinkStates.reg_password)
async def reg_password_input(message: Message, state: FSMContext):
    password = message.text.strip() if message.text else ""

    # Delete password message
    try:
        await message.delete()
    except Exception:
        pass

    if len(password) < 8:
        await message.answer("❌ Пароль слишком короткий (минимум 8 символов). Попробуйте ещё:")
        return

    data = await state.get_data()
    name = data.get("name", message.from_user.first_name or "User")
    email = data.get("email", "")
    telegram_id = message.from_user.id

    # Create user
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import RefreshToken
    User = get_user_model()

    try:
        user = await sync_to_async(User.objects.create_user)(
            email=email,
            password=password,
            name=name,
            telegram_id=telegram_id,
        )

        # Create default categories for finance
        try:
            from django.core.management import call_command
            await sync_to_async(call_command)("create_default_categories", "--skip-existing")
        except Exception:
            pass

        # Generate JWT
        refresh = await sync_to_async(RefreshToken.for_user)(user)
        cache.set(f"bot:jwt:{telegram_id}", {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": str(user.id),
        }, 60 * 60 * 24 * 7)

        from apps.bot.keyboards.main_menu import get_main_menu

        await message.answer(
            f"🎉 <b>Аккаунт создан!</b>\n\n"
            f"👤 {name}\n"
            f"📧 {email}\n\n"
            "Теперь вы можете:\n"
            "• Писать «купил кофе 25к» → запишу расход\n"
            "• «добавь задачу: купить продукты» → создам задачу\n"
            "• «хочу выучить Python» → AI составит план\n"
            "• Отправить фото чека → распознаю\n"
            "• Отправить голосовое → выполню\n\n"
            f"🌐 Веб-версия: lifepilot.uz",
            reply_markup=get_main_menu(user.locale or "ru"),
            parse_mode="HTML",
        )
        await state.clear()

    except Exception as e:
        logger.error(f"Registration failed: {e}", exc_info=True)
        await message.answer(
            f"❌ Ошибка регистрации: {str(e)[:100]}\n\nПопробуйте /start заново."
        )
        await state.clear()


# ==================== LOGIN (existing account) ====================

@router.callback_query(F.data == "link:choose")
async def link_choose(callback: CallbackQuery):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📧 Email и пароль", callback_data="link:email")],
        [InlineKeyboardButton(text="🌐 Войти на сайте + привязать", url="https://lifepilot.uz/settings")],
        [InlineKeyboardButton(text="← Назад", callback_data="link:back")],
    ])
    await callback.message.edit_text(
        "🔑 <b>Привязка аккаунта</b>\n\n"
        "Введите email и пароль от LifePilot,\n"
        "или откройте сайт и привяжите через Telegram Widget.",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "link:back")
async def link_back(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    # Re-show start menu
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Создать аккаунт", callback_data="reg:start")],
        [InlineKeyboardButton(text="🔑 У меня есть аккаунт", callback_data="link:choose")],
    ])
    await callback.message.edit_text(
        "👋 Выберите действие:",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "link:code")
async def link_code_start(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "🔑 Откройте <b>lifepilot.uz</b> → Настройки → Безопасность → «Привязать Telegram».\n\n"
        "Введите 6-значный код:",
        parse_mode="HTML",
    )
    await state.set_state(LinkStates.waiting_code)
    await callback.answer()


@router.message(LinkStates.waiting_code)
async def link_code_verify(message: Message, state: FSMContext):
    code = message.text.strip() if message.text else ""

    if not code.isdigit() or len(code) != 6:
        await message.answer("❌ Код должен быть из 6 цифр. Попробуйте ещё:")
        return

    import httpx
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=10) as client:
        resp = await client.post("/auth/telegram/verify-code/", json={
            "code": code,
            "telegram_id": message.from_user.id,
        })

    if resp.status_code == 200:
        data = resp.json()
        cache.set(f"bot:jwt:{message.from_user.id}", {
            "access": data["tokens"]["access"],
            "refresh": data["tokens"]["refresh"],
            "user_id": data.get("user", {}).get("id"),
        }, 60 * 60 * 24 * 7)

        from apps.bot.keyboards.main_menu import get_main_menu
        await message.answer(
            "✅ Аккаунт привязан!\n\n"
            "Просто пишите что хотите:\n"
            "• «купил кофе 25к» → расход\n"
            "• «добавь задачу: купить продукты» → задача\n"
            "• «хочу выучить Python» → план обучения",
            reply_markup=get_main_menu(),
        )
        await state.clear()
    else:
        await message.answer("❌ Неверный или просроченный код. Попробуйте ещё:")


@router.callback_query(F.data == "link:email")
async def link_email_start(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text("📧 Введите ваш email в LifePilot:")
    await state.set_state(LinkStates.waiting_email)
    await callback.answer()


@router.message(LinkStates.waiting_email)
async def link_email_input(message: Message, state: FSMContext):
    email = message.text.strip() if message.text else ""
    if "@" not in email:
        await message.answer("❌ Некорректный email. Попробуйте ещё:")
        return
    await state.update_data(email=email)
    await message.answer("🔒 Введите пароль (сообщение будет удалено):")
    await state.set_state(LinkStates.waiting_password)


@router.message(LinkStates.waiting_password)
async def link_password_input(message: Message, state: FSMContext):
    password = message.text.strip() if message.text else ""
    data = await state.get_data()
    email = data.get("email", "")

    try:
        await message.delete()
    except Exception:
        pass

    import httpx
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=10) as client:
        resp = await client.post("/auth/telegram/login/", json={
            "email": email,
            "password": password,
            "telegram_id": message.from_user.id,
        })

    if resp.status_code == 200:
        resp_data = resp.json()
        cache.set(f"bot:jwt:{message.from_user.id}", {
            "access": resp_data["tokens"]["access"],
            "refresh": resp_data["tokens"]["refresh"],
            "user_id": resp_data.get("user", {}).get("id"),
        }, 60 * 60 * 24 * 7)

        from apps.bot.keyboards.main_menu import get_main_menu
        await message.answer("✅ Аккаунт привязан!", reply_markup=get_main_menu())
        await state.clear()
    else:
        await message.answer("❌ Неверный email или пароль. Попробуйте /start заново.")
        await state.clear()


# ==================== HELP ====================

@router.message(Command("help"))
async def cmd_help(message: Message, **kwargs):
    await message.answer(
        "📖 <b>LifePilot Bot</b>\n\n"
        "<b>Что я умею:</b>\n"
        "• Пишите: «купил кофе 25к» → расход записан\n"
        "• «добавь задачу: купить продукты» → задача создана\n"
        "• «хочу выучить Python» → AI план обучения\n"
        "• Фото чека → расход распознан\n"
        "• Голосовое → распознаю и выполню\n\n"
        "<b>Команды:</b>\n"
        "/start — главное меню\n"
        "/plan — цели обучения\n"
        "/today — задания на сегодня\n"
        "/ask [вопрос] — AI-тьютор\n"
        "/settings — настройки бота\n"
        "/help — эта справка",
        parse_mode="HTML",
    )
