"""
Currency conversion using CBU.uz official exchange rates.
API: https://cbu.uz/ru/arkhiv-kursov-valyut/json/
Rates cached in Redis for 4 hours.
"""

import logging
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.core.cache import cache

logger = logging.getLogger("finance")

CBU_API_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/"
CACHE_KEY = "cbu_exchange_rates"
CACHE_TTL = 60 * 60 * 4  # 4 hours


def get_cbu_rates() -> dict[str, Decimal]:
    """
    Fetch exchange rates from CBU.uz.
    Returns dict: {"USD": Decimal("12171.61"), "EUR": Decimal("14117.85"), ...}
    All rates are per 1 unit of foreign currency in UZS.
    """
    cached = cache.get(CACHE_KEY)
    if cached:
        return cached

    try:
        resp = requests.get(CBU_API_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        rates = {}
        for item in data:
            ccy = item.get("Ccy", "")
            rate = item.get("Rate", "0")
            nominal = int(item.get("Nominal", "1"))

            if ccy and rate:
                # Rate is per Nominal units, normalize to per 1 unit
                rate_per_unit = Decimal(rate) / Decimal(nominal)
                rates[ccy] = rate_per_unit

        # UZS to UZS = 1
        rates["UZS"] = Decimal("1")

        cache.set(CACHE_KEY, rates, CACHE_TTL)
        logger.info(f"CBU rates updated: {len(rates)} currencies")
        return rates

    except Exception as e:
        logger.error(f"Failed to fetch CBU rates: {e}")
        # Fallback hardcoded rates
        return {
            "USD": Decimal("12800"),
            "EUR": Decimal("14000"),
            "RUB": Decimal("145"),
            "GBP": Decimal("16000"),
            "UZS": Decimal("1"),
        }


CURRENCY_ALIASES = {
    "SO'M": "UZS", "SOM": "UZS", "SUM": "UZS", "СУМ": "UZS", "СЎМ": "UZS",
    "SO`M": "UZS", "SÓM": "UZS", "UZS": "UZS",
    "ДОЛЛАР": "USD", "DOLLAR": "USD", "$": "USD",
    "ЕВРО": "EUR", "EURO": "EUR", "€": "EUR",
    "РУБЛЬ": "RUB", "РУБЛ": "RUB", "RUB": "RUB", "₽": "RUB",
    "ФУНТ": "GBP", "POUND": "GBP", "£": "GBP",
}


def _normalize_currency(code: str) -> str:
    """Normalize currency code: SO'M → UZS, сум → UZS, $ → USD, etc."""
    if not code:
        return "UZS"
    upper = code.strip().upper()
    return CURRENCY_ALIASES.get(upper, upper)


def convert_currency(
    amount: Decimal,
    from_currency: str,
    to_currency: str,
) -> tuple[Decimal, Decimal]:
    """
    Convert amount between currencies using CBU rates.

    Args:
        amount: Amount in source currency
        from_currency: Source currency code (e.g. "UZS", "SO'M", "сум")
        to_currency: Target currency code (e.g. "USD")

    Returns:
        (converted_amount, exchange_rate)
    """
    from_currency = _normalize_currency(from_currency)
    to_currency = _normalize_currency(to_currency)

    if from_currency == to_currency:
        return amount, Decimal("1")

    rates = get_cbu_rates()

    from_rate = rates.get(from_currency)
    to_rate = rates.get(to_currency)

    if not from_rate or not to_rate:
        logger.warning(f"Rate not found: {from_currency} or {to_currency}")
        return amount, Decimal("1")

    # Convert via UZS as intermediate
    # amount in from_currency → UZS → to_currency
    amount_in_uzs = amount * from_rate
    converted = amount_in_uzs / to_rate

    # Round to 2 decimal places
    converted = converted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Exchange rate: 1 from_currency = X to_currency
    rate = from_rate / to_rate

    return converted, rate


def format_conversion(
    original_amount: Decimal,
    original_currency: str,
    converted_amount: Decimal,
    account_currency: str,
    rate: Decimal,
) -> str:
    """Format conversion info for display."""
    # Normalize currency names for display
    from_ccy = _normalize_currency(original_currency)
    to_ccy = _normalize_currency(account_currency)

    orig_fmt = f"{original_amount:,.0f}".replace(",", " ")
    conv_fmt = f"{converted_amount:,.2f}".replace(",", " ")

    # Show rate in human-readable direction (1 USD = X UZS, not 1 UZS = 0.00 USD)
    if rate < Decimal("0.01"):
        # Invert: show how much 1 target = X source
        inverse_rate = (Decimal("1") / rate).quantize(Decimal("0.01"))
        return (
            f"{orig_fmt} {from_ccy} → {conv_fmt} {to_ccy}\n"
            f"📊 Курс: 1 {to_ccy} = {inverse_rate:,.2f} {from_ccy}"
        )
    else:
        return (
            f"{orig_fmt} {from_ccy} → {conv_fmt} {to_ccy}\n"
            f"📊 Курс: 1 {from_ccy} = {rate:.2f} {to_ccy}"
        )
