def format_money(amount: float, currency: str = "UZS") -> str:
    if currency == "UZS":
        return f"{int(amount):,} сум".replace(",", " ")
    elif currency == "USD":
        return f"${amount:,.2f}"
    elif currency == "EUR":
        return f"€{amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def format_budgets(budgets: list, locale: str = "ru") -> str:
    if not budgets:
        return "—"
    lines = []
    for b in budgets[:5]:
        name = b.get("category_name", b.get("name", ""))
        spent = b.get("spent", 0)
        limit = b.get("amount", b.get("limit", 0))
        pct = (spent / limit * 100) if limit > 0 else 0
        bar = "🟢" if pct < 70 else "🟡" if pct < 90 else "🔴"
        lines.append(f"  {bar} {name}: {int(spent):,}/{int(limit):,} ({pct:.0f}%)")
    return "\n".join(lines)


def format_habits(habits: list, locale: str = "ru") -> str:
    if not habits:
        return "—"
    lines = []
    for h in habits:
        name = h.get("habit_name", h.get("name", ""))
        days = h.get("days", [])
        completed = sum(1 for d in days if d.get("completed"))
        total = len(days) or 7
        marks = ""
        for d in days:
            marks += "✅" if d.get("completed") else "⬜"
        lines.append(f"  {name}: {marks} ({completed}/{total})")
    return "\n".join(lines)


def format_task_list(tasks: list, locale: str = "ru") -> str:
    if not tasks:
        return "📋 Задач нет" if locale == "ru" else "📋 No tasks"
    lines = []
    for t in tasks:
        status_icons = {"todo": "⬜", "in_progress": "🔵", "done": "✅"}
        priority_icons = {"P1": "🔴", "P2": "🟡", "P3": "⚪", "P4": "⬜"}
        icon = status_icons.get(t.get("status"), "⬜")
        pri = priority_icons.get(t.get("priority"), "")
        title = t.get("title", "")
        deadline = t.get("deadline", "")
        dl_str = f" (до {deadline})" if deadline else ""
        lines.append(f"{icon}{pri} {title}{dl_str}")
    return "\n".join(lines)


def format_week_report(data: dict | None, currency: str = "UZS") -> str:
    if not data:
        return "📊 Не удалось загрузить аналитику"

    completed = data.get("completed_tasks", data.get("tasks_completed", 0))
    total = data.get("total_tasks", data.get("tasks_total", 0))
    focus = data.get("total_focus_minutes", data.get("focus_minutes", 0))
    rate = data.get("task_completion_rate", 0)
    streak = data.get("streak_days", data.get("current_streak", 0))

    income = data.get("income_week", data.get("total_income", 0))
    expenses = data.get("expenses_week", data.get("total_expenses", 0))
    balance = data.get("total_balance", data.get("balance", 0))

    return f"""📊 *Сводка за неделю*

📋 Задач выполнено: {completed}/{total}
🎯 Время фокуса: {focus} мин
📈 Completion rate: {rate:.0f}%
🔥 Серия: {streak} дней

💰 Доходы: {format_money(income, currency)}
💸 Расходы: {format_money(expenses, currency)}
💵 Баланс: {format_money(balance, currency)}"""


def format_finance_report(data: dict | None, currency: str = "UZS") -> str:
    if not data:
        return "💰 Не удалось загрузить финансы"

    lines = ["💰 *Финансовый отчёт*\n"]

    # Expenses by category
    expense_cats = data.get("expense_by_category", data.get("expenses_by_category", []))
    if expense_cats:
        lines.append("📊 *Расходы по категориям:*")
        for cat in expense_cats[:10]:
            name = cat.get("name", cat.get("category_name", cat.get("category", "")))
            total = cat.get("total", cat.get("amount", 0))
            lines.append(f"  • {name}: {format_money(total, currency)}")

    # Income by category
    income_cats = data.get("income_by_category", data.get("incomes_by_category", []))
    if income_cats:
        lines.append("\n📈 *Доходы по категориям:*")
        for cat in income_cats[:10]:
            name = cat.get("name", cat.get("category_name", cat.get("category", "")))
            total = cat.get("total", cat.get("amount", 0))
            lines.append(f"  • {name}: {format_money(total, currency)}")

    # Totals
    total_income = data.get("total_income", 0)
    total_expense = data.get("total_expenses", data.get("total_expense", 0))
    if total_income or total_expense:
        lines.append(f"\n💰 Доходы: {format_money(total_income, currency)}")
        lines.append(f"💸 Расходы: {format_money(total_expense, currency)}")
        net = total_income - total_expense
        icon = "📈" if net >= 0 else "📉"
        lines.append(f"{icon} Нетто: {format_money(net, currency)}")

    # Budgets
    budgets = data.get("budgets", [])
    if budgets:
        lines.append("\n📋 *Бюджеты:*")
        for b in budgets[:5]:
            name = b.get("name", b.get("category_name", ""))
            spent = b.get("spent", 0)
            amount = b.get("amount", b.get("limit", 0))
            pct = (spent / amount * 100) if amount > 0 else 0
            icon = "🔴" if pct > 85 else "🟡" if pct > 60 else "🟢"
            lines.append(f"  {icon} {name}: {format_money(spent, currency)}/{format_money(amount, currency)} ({pct:.0f}%)")

    return "\n".join(lines)


def format_goals_report(goals: list | None, currency: str = "UZS") -> str:
    if not goals:
        return "🎯 Нет финансовых целей"

    lines = ["🎯 *Прогресс целей*\n"]
    for g in goals:
        current = float(g.get("current_amount", g.get("saved", 0)))
        target = float(g.get("target_amount", g.get("amount", 1)))
        pct = (current / target * 100) if target > 0 else 0
        icon = "✅" if pct >= 100 else "🔵"
        filled = int(pct / 10)
        bar = "█" * filled + "░" * (10 - filled)
        lines.append(f"{icon} {g.get('name', '')}")
        lines.append(f"   {bar} {pct:.0f}%")
        lines.append(f"   {format_money(current, currency)} / {format_money(target, currency)}")
        lines.append("")

    return "\n".join(lines)


def split_long_message(text: str, max_length: int = 4096) -> list[str]:
    """Split message if it exceeds Telegram's limit."""
    if len(text) <= max_length:
        return [text]
    parts = []
    while text:
        if len(text) <= max_length:
            parts.append(text)
            break
        idx = text.rfind("\n", 0, max_length)
        if idx == -1:
            idx = max_length
        parts.append(text[:idx])
        text = text[idx:].lstrip("\n")
    return parts
