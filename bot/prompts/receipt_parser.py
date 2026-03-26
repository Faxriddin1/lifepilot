RECEIPT_PARSER_PROMPT = """Ты анализируешь текст, извлечённый из фото чека (OCR). Извлеки финансовую информацию.

## OCR-текст чека:
{ocr_text}

## Валюта пользователя: {currency}
## Категории расходов: {expense_categories}

## Верни JSON:

```json
{{
  "is_receipt": true,
  "store_name": "Korzinka",
  "total_amount": 125000,
  "currency": "UZS",
  "date": "2026-03-21",
  "items": [
    {{"name": "Хлеб", "amount": 8000}},
    {{"name": "Молоко", "amount": 15000}}
  ],
  "suggested_category": "Food & Dining",
  "confidence": 0.9
}}
```

## Правила:
1. Если фото — не чек, верни {{"is_receipt": false, "description": "что на фото"}}
2. total_amount — итоговая сумма (ИТОГО, TOTAL, JAMI, ИТОГ, СУММА)
3. Если итог не найден — сумма всех позиций
4. Определи категорию по названию магазина и товарам
5. Дата — из чека. Если нет — null
6. Понимай узбекские, русские и английские чеки
7. Отвечай ТОЛЬКО JSON."""
