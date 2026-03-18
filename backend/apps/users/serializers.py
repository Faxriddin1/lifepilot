from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор пользователя для чтения (профиль, ответы API)."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'avatar_url',
            'base_currency', 'locale', 'timezone', 'last_seen_at',
            'date_joined',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_seen_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор регистрации: валидация email, пароля и создание пользователя."""

    password = serializers.CharField(
        write_only=True, min_length=8, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm']

    def validate_email(self, value):
        """Проверяет уникальность email (без учёта регистра)."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate(self, attrs):
        """Проверяет совпадение пароля и подтверждения."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        """Создаёт пользователя, удаляя поле password_confirm."""
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Сериализатор входа: email и пароль."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор обновления профиля: имя, аватар, валюта, локаль, часовой пояс."""

    class Meta:
        model = User
        fields = [
            'name', 'avatar_url', 'base_currency', 'locale', 'timezone',
        ]

    def validate_base_currency(self, value):
        """Проверяет, что валюта — трёхбуквенный ISO-код."""
        if len(value) != 3:
            raise serializers.ValidationError('Currency must be a 3-letter ISO code.')
        return value.upper()
