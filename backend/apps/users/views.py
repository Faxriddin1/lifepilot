import hashlib
import hmac
import logging
import secrets
import string
import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя и выдача JWT-токенов."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """Создаёт пользователя и возвращает пару access/refresh токенов."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Аутентификация пользователя по email/паролю и выдача JWT-токенов."""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        """Проверяет учётные данные и возвращает токены при успешной аутентификации."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.last_seen_at = timezone.now()
        user.save(update_fields=['last_seen_at'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Получение и обновление профиля текущего пользователя."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Возвращает сериализатор профиля для записи, базовый — для чтения."""
        if self.request.method in ('PUT', 'PATCH'):
            return UserProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()


class LogoutView(APIView):
    """Выход из системы — добавление refresh-токена в чёрный список."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Инвалидирует переданный refresh-токен."""
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    """Аутентификация через Google OAuth 2.0.

    Принимает credential (ID token) от Google Sign-In на фронтенде,
    верифицирует его, создаёт или находит пользователя и возвращает JWT.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Верифицирует Google ID token и возвращает JWT-токены."""
        credential = request.data.get('credential')
        if not credential:
            return Response(
                {'detail': 'Google credential is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify the Google ID token
            id_info = google_id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            # Check issuer
            if id_info['iss'] not in ('accounts.google.com', 'https://accounts.google.com'):
                return Response(
                    {'detail': 'Invalid token issuer.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = id_info.get('email')
            if not email:
                return Response(
                    {'detail': 'Email not provided by Google.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find or create user
            user, created = User.objects.get_or_create(
                email__iexact=email,
                defaults={
                    'email': email,
                    'name': id_info.get('name', ''),
                    'avatar_url': id_info.get('picture', ''),
                },
            )

            if not created:
                # Update avatar and name if changed
                updated_fields = []
                if id_info.get('picture') and user.avatar_url != id_info['picture']:
                    user.avatar_url = id_info['picture']
                    updated_fields.append('avatar_url')
                if id_info.get('name') and not user.name:
                    user.name = id_info['name']
                    updated_fields.append('name')
                user.last_seen_at = timezone.now()
                updated_fields.append('last_seen_at')
                user.save(update_fields=updated_fields)

            # Generate JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'created': created,
            })

        except ValueError as e:
            logger.warning(f'Google auth failed: {e}')
            return Response(
                {'detail': 'Invalid Google token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ChangePasswordView(APIView):
    """Смена пароля текущего пользователя."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Проверяет текущий пароль и устанавливает новый."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})


class DeleteAccountView(APIView):
    """Удаление аккаунта текущего пользователя со всеми данными."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Удаляет аккаунт пользователя после проверки пароля."""
        password = request.data.get('password')
        if not password:
            return Response({'detail': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(password):
            return Response({'detail': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.delete()
        return Response({'detail': 'Account deleted.'}, status=status.HTTP_200_OK)


class TelegramGenerateCodeView(APIView):
    """Generate a 6-digit code for Telegram account linking."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        cache.set(f'telegram_link_code:{code}', str(request.user.id), 300)
        return Response({'code': code, 'expires_in': 300})


class TelegramVerifyCodeView(APIView):
    """Verify linking code from Telegram bot. Returns JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip()
        telegram_id = request.data.get('telegram_id')

        if not code or not telegram_id:
            return Response(
                {'detail': 'Code and telegram_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = f'telegram_link_code:{code}'
        user_id = cache.get(cache_key)

        if not user_id:
            return Response(
                {'detail': 'Invalid or expired code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        cache.delete(cache_key)

        # Link telegram_id to user
        user.telegram_id = telegram_id
        user.save(update_fields=['telegram_id'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


class TelegramLoginView(APIView):
    """Telegram login via email + password. Links telegram_id."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        telegram_id = request.data.get('telegram_id')

        if not email or not password or not telegram_id:
            return Response(
                {'detail': 'email, password, and telegram_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        user.telegram_id = telegram_id
        user.save(update_fields=['telegram_id'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


class TelegramStatusView(APIView):
    """Telegram linking status — uses User.telegram_id field."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.telegram_id:
            return Response({
                'linked': True,
                'telegram_id': user.telegram_id,
            })
        return Response({'linked': False})

    def post(self, request):
        """
        Link Telegram account via Telegram Login Widget data.
        Verifies hash, then sets telegram_id on the current authenticated user.
        """
        data = request.data
        telegram_id = data.get('id')
        auth_hash = data.get('hash')
        auth_date = data.get('auth_date')

        if not telegram_id or not auth_hash or not auth_date:
            return Response(
                {'detail': 'Missing Telegram auth data.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify hash
        bot_token = getattr(settings, 'BOT_TOKEN', '') or ''
        if not bot_token:
            return Response({'detail': 'Bot not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Convert all values to strings for hash verification (Telegram sends strings)
        hash_data = {}
        for k, v in data.items():
            if v is not None and v != '':
                hash_data[k] = str(v)

        logger.info(f"Telegram widget auth: keys={list(hash_data.keys())}, telegram_id={telegram_id}")

        if not TelegramWidgetAuthView._verify_hash(hash_data, bot_token):
            logger.warning(f"Telegram widget hash verification failed for id={telegram_id}")
            return Response({'detail': 'Invalid hash.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check freshness
        try:
            if time.time() - int(auth_date) > 86400:
                return Response({'detail': 'Auth data expired.'}, status=status.HTTP_401_UNAUTHORIZED)
        except (ValueError, TypeError):
            return Response({'detail': 'Invalid auth_date.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if telegram_id already used by another user
        telegram_id = int(telegram_id)
        existing = User.objects.filter(telegram_id=telegram_id).exclude(id=request.user.id).first()
        if existing:
            return Response({
                'detail': 'conflict',
                'conflict': True,
                'existing_email': existing.email,
                'existing_name': existing.name or existing.email,
                'telegram_id': telegram_id,
                'message': 'Этот Telegram аккаунт уже привязан к другому пользователю.',
            }, status=status.HTTP_409_CONFLICT)

        # Link
        user = request.user
        user.telegram_id = telegram_id
        user.save(update_fields=['telegram_id'])

        return Response({
            'linked': True,
            'telegram_id': telegram_id,
        })

    def delete(self, request):
        """Unlink Telegram."""
        user = request.user
        user.telegram_id = None
        user.save(update_fields=['telegram_id'])
        return Response({'detail': 'Telegram unlinked.'})


class TelegramMergeAccountsView(APIView):
    """
    Merge two accounts: transfer ALL data from the Telegram-linked account
    to the current authenticated user, then delete the old account.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        telegram_id = request.data.get('telegram_id')
        if not telegram_id:
            return Response({'detail': 'telegram_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        telegram_id = int(telegram_id)
        current_user = request.user

        # Find the other account
        try:
            other_user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if other_user.id == current_user.id:
            return Response({'detail': 'Cannot merge with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Merging accounts: {other_user.email} → {current_user.email}")

        from django.db import transaction
        with transaction.atomic():
            # Transfer ALL related data from other_user → current_user
            self._transfer_data(other_user, current_user)

            # Merge auth methods — keep ALL ways to login
            self._merge_auth(other_user, current_user, telegram_id)

            # Delete the old account
            other_email = other_user.email
            other_user.delete()

        logger.info(f"Merge complete: {other_email} deleted, telegram_id={telegram_id} → {current_user.email}")

        return Response({
            'merged': True,
            'deleted_account': other_email,
            'telegram_id': current_user.telegram_id,
            'auth_methods': self._get_auth_methods(current_user),
        })

    @staticmethod
    def _merge_auth(from_user, to_user, telegram_id):
        """
        Merge authentication methods from both accounts.
        After merge, user can login via ALL methods from both accounts:
        - Email/password (if either had a password)
        - Google OAuth (via email matching)
        - Telegram (via telegram_id)
        """
        update_fields = ['telegram_id']

        # 1. Always transfer telegram_id
        to_user.telegram_id = telegram_id

        # 2. If current user has no password but other does — copy it
        if not to_user.has_usable_password() and from_user.has_usable_password():
            to_user.password = from_user.password
            update_fields.append('password')
            logger.info(f"Merge: copied password from {from_user.email}")

        # 3. If current user has no name but other does — copy
        if not to_user.name and from_user.name:
            to_user.name = from_user.name
            update_fields.append('name')

        # 4. If current user has no avatar but other does — copy
        if not to_user.avatar_url and from_user.avatar_url:
            to_user.avatar_url = from_user.avatar_url
            update_fields.append('avatar_url')

        # 5. Merge locale/timezone preferences (keep current user's if set)
        if not to_user.locale and from_user.locale:
            to_user.locale = from_user.locale
            update_fields.append('locale')
        if not to_user.timezone and from_user.timezone:
            to_user.timezone = from_user.timezone
            update_fields.append('timezone')

        to_user.save(update_fields=update_fields)

    @staticmethod
    def _get_auth_methods(user):
        """Return list of available auth methods for the user."""
        methods = []
        if user.has_usable_password():
            methods.append('email_password')
        # Google OAuth works via email matching — always available if email is a real one
        if user.email and not user.email.startswith('tg') and '@telegram.' not in user.email:
            methods.append('google')
        if user.telegram_id:
            methods.append('telegram')
        return methods

    @staticmethod
    def _transfer_data(from_user, to_user):
        """Transfer all related objects from one user to another."""
        # Tasks
        from apps.tasks.models import Task, Project
        Task.objects.filter(user=from_user).update(user=to_user)
        Project.objects.filter(user=from_user).update(user=to_user)

        # Finance
        from apps.finance.models import Account, Transaction, Budget, Goal, Category
        Account.objects.filter(user=from_user).update(user=to_user)
        Transaction.objects.filter(user=from_user).update(user=to_user)
        Budget.objects.filter(user=from_user).update(user=to_user)
        Goal.objects.filter(user=from_user).update(user=to_user)
        Category.objects.filter(user=from_user).update(user=to_user)

        # Productivity
        from apps.productivity.models import FocusSession, Habit, HabitLog, DailyLog
        FocusSession.objects.filter(user=from_user).update(user=to_user)
        Habit.objects.filter(user=from_user).update(user=to_user)
        HabitLog.objects.filter(user=from_user).update(user=to_user)
        DailyLog.objects.filter(user=from_user).update(user=to_user)

        # Learning
        try:
            from apps.learning.models import LearningGoal, LearningProgress
            LearningGoal.objects.filter(user=from_user).update(user=to_user)
            LearningProgress.objects.filter(user=from_user).update(user=to_user)
        except Exception:
            pass

        # Notifications
        try:
            from apps.notifications.models import Notification, NotificationPreference
            Notification.objects.filter(user=from_user).update(user=to_user)
            NotificationPreference.objects.filter(user=from_user).delete()
        except Exception:
            pass

        # AI logs
        try:
            from apps.ai_core.models import AICallLog
            AICallLog.objects.filter(user=from_user).update(user=to_user)
        except Exception:
            pass


class TelegramWidgetAuthView(APIView):
    """
    Authenticate via Telegram Login Widget.
    Verifies hash using HMAC-SHA256 with bot token.
    Creates account if not exists, logs in if exists.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        telegram_id = data.get('id')
        auth_hash = data.get('hash')
        auth_date = data.get('auth_date')

        if not telegram_id or not auth_hash or not auth_date:
            return Response(
                {'detail': 'Missing required fields: id, hash, auth_date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify hash
        bot_token = getattr(settings, 'BOT_TOKEN', '') or ''
        if not bot_token:
            logger.error("BOT_TOKEN not configured for Telegram Widget auth")
            return Response(
                {'detail': 'Telegram auth not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Convert all values to strings for hash verification
        hash_data = {k: str(v) for k, v in data.items() if v is not None and v != ''}
        if not self._verify_hash(hash_data, bot_token):
            return Response(
                {'detail': 'Invalid authentication data.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check freshness (max 24 hours)
        try:
            if time.time() - int(auth_date) > 86400:
                return Response(
                    {'detail': 'Authentication data expired.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid auth_date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find or create user
        telegram_id = int(telegram_id)
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        username = data.get('username', '')
        photo_url = data.get('photo_url', '')

        try:
            user = User.objects.get(telegram_id=telegram_id)
            created = False
        except User.DoesNotExist:
            # Create new user
            name = f"{first_name} {last_name}".strip() or username or f"User {telegram_id}"
            email = f"tg{telegram_id}@telegram.lifepilot.uz"

            user = User.objects.create_user(
                email=email,
                name=name,
                telegram_id=telegram_id,
                password=None,  # No password — Telegram-only auth
            )
            created = True
            logger.info(f"New user created via Telegram Widget: {user.email} (tg:{telegram_id})")

        # Generate JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'created': created,
        })

    @staticmethod
    def _verify_hash(data: dict, bot_token: str) -> bool:
        """Verify Telegram Login Widget hash using HMAC-SHA256."""
        check_hash = data.get('hash', '')

        # Build data-check-string: all fields except 'hash', sorted, joined by \n
        data_check_pairs = sorted(
            f"{k}={v}" for k, v in data.items() if k != 'hash' and v is not None
        )
        data_check_string = '\n'.join(data_check_pairs)

        # Secret key = SHA256(bot_token)
        secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()

        # Calculate HMAC
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(calculated_hash, check_hash)
