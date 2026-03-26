import json
from pathlib import Path
from typing import Callable

_translations: dict[str, dict] = {}
_i18n_dir = Path(__file__).parent


def _load_locale(locale: str) -> dict:
    path = _i18n_dir / f"{locale}.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def get_translator(locale: str) -> Callable:
    if locale not in _translations:
        _translations[locale] = _load_locale(locale)
    strings = _translations[locale]
    fallback = _translations.get("ru") or _load_locale("ru")

    def t(key: str, **kwargs) -> str:
        text = strings.get(key) or fallback.get(key) or key
        if kwargs:
            try:
                return text.format(**kwargs)
            except (KeyError, IndexError):
                return text
        return text

    return t
