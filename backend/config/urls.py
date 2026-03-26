from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # JWT auth
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Auth routes (aliased from users app for frontend compatibility)
    path('api/v1/auth/', include('apps.users.urls')),

    # App routes
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/productivity/', include('apps.productivity.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/admin-panel/', include('apps.admin_panel.urls')),
    path('api/v1/learning/', include('apps.learning.urls')),
    path('api/v1/ai/', include('apps.ai_core.urls')),
    path('bot/', include('apps.bot.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),

    # OpenAPI schema & docs
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
