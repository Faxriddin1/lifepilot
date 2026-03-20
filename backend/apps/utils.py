"""Общие утилиты для сериализаторов."""
import bleach


class SanitizeMixin:
    """Миксин для очистки текстовых полей от HTML-тегов в сериализаторах DRF."""

    def validate(self, attrs):
        for field_name, value in attrs.items():
            if isinstance(value, str):
                attrs[field_name] = bleach.clean(value, tags=[], strip=True)
        return super().validate(attrs)
