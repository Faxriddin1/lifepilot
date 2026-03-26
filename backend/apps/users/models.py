import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Менеджер пользователей с email в качестве уникального идентификатора."""

    def create_user(self, email, name, password=None, **extra_fields):
        """Создать и вернуть обычного пользователя с email и паролем."""
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """Создать и вернуть суперпользователя с правами администратора."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractUser):
    """Пользователь системы.

    Авторизация по email. Поддерживает валюту и локаль.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Убрано — используется email
    email = models.EmailField('email address', unique=True)
    name = models.CharField('full name', max_length=255)
    avatar_url = models.URLField('avatar URL', max_length=500, blank=True, default='')
    base_currency = models.CharField(max_length=3, default='USD')  # Основная валюта пользователя
    locale = models.CharField(max_length=10, default='ru')
    timezone = models.CharField(max_length=50, default='Europe/Moscow')
    date_format = models.CharField(max_length=10, default='DD.MM.YYYY')  # DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD
    week_start = models.CharField(max_length=3, default='mon')  # mon, sun
    number_format = models.CharField(max_length=10, default='1 000,00')  # 1,000.00, 1.000,00, 1 000,00
    last_seen_at = models.DateTimeField(null=True, blank=True)  # Время последней активности
    telegram_id = models.BigIntegerField(null=True, blank=True, unique=True, db_index=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        """Мета-настройки модели пользователя."""
        ordering = ['-date_joined']
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.email
