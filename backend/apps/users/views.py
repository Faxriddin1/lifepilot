import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

from .serializers import (
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
