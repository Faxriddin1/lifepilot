"""Format API responses for Telegram display."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def format_task_list(tasks: list) -> str:
    """Format a list of tasks for Telegram."""
    if not tasks:
        return "📋 No tasks found."

    lines = ["📋 <b>Your tasks:</b>\n"]
    for i, task in enumerate(tasks[:10], 1):
        status_icon = {"inbox": "📥", "in_progress": "🔄", "review": "👀", "done": "✅"}.get(
            task.get("status", ""), "📌"
        )
        priority = task.get("priority", "")
        p_icon = {"P1": "🔴", "P2": "🟠", "P3": "🔵", "P4": "⚪"}.get(priority, "")
        lines.append(f"{i}. {status_icon} {p_icon} {task.get('title', 'Untitled')}")

    return "\n".join(lines)


def format_balance(accounts: list) -> str:
    """Format account balances for Telegram."""
    if not accounts:
        return "💳 No accounts found."

    lines = ["💳 <b>Your accounts:</b>\n"]
    total = 0
    for acc in accounts:
        balance = float(acc.get("balance", 0))
        currency = acc.get("currency", "USD")
        name = acc.get("name", "Account")
        lines.append(f"• {name}: {balance:,.0f} {currency}")
        total += balance

    lines.append(f"\n<b>Total: {total:,.0f}</b>")
    return "\n".join(lines)


def format_receipt_confirmation(receipt) -> tuple[str, InlineKeyboardMarkup]:
    """Format parsed receipt for confirmation."""
    data = receipt.model_dump() if hasattr(receipt, "model_dump") else receipt

    merchant = data.get("merchant", "Unknown")
    total = data.get("total", 0)
    currency = data.get("currency", "")
    category = data.get("category", "")

    text = f"🧾 <b>Receipt: {merchant}</b>\n"

    items = data.get("items", [])
    for item in items[:5]:
        text += f"  • {item.get('name', '')} — {item.get('price', 0)}\n"

    text += f"\n<b>Total: {total:,.0f} {currency}</b>"
    if category:
        text += f"\nCategory: {category}"
    text += "\n\nRecord this expense?"

    import uuid
    from django.core.cache import cache

    action_id = str(uuid.uuid4())[:8]
    cache.set(f"bot:action:{action_id}", {
        "intent": "finance_expense",
        "data": {
            "amount": total,
            "currency": currency,
            "category": category,
            "note": f"Receipt: {merchant}",
        },
    }, 300)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Yes", callback_data=f"confirm:{action_id}"),
            InlineKeyboardButton(text="❌ Cancel", callback_data=f"cancel:{action_id}"),
        ]
    ])

    return text, keyboard
