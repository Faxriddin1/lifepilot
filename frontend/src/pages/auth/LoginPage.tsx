import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { showApiError } from '@/utils/errorHandler';
import { validateLoginForm } from '@/utils/validation';
import { toast } from 'sonner';

/** Страница входа в систему с валидацией email и пароля. */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [googleLoading, setGoogleLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    try {
      const tokens = await authApi.googleAuth(response.credential);
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      const profile = await authApi.getProfile();
      useAuthStore.setState({
        user: profile,
        token: tokens.access,
        refreshToken: tokens.refresh,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success(t('auth.welcomeBack') + '!');
      navigate('/dashboard');
    } catch (err) {
      showApiError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await login({ email, password });
      toast.success(t('auth.welcomeBack') + '!');
      navigate('/dashboard');
    } catch (err: unknown) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LifePilot</span>
          </div>
          <p className="text-primary-100 mt-1 text-lg">{t('auth.tagline')}</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('auth.heroTitle')}
            </h2>
            <p className="text-primary-200 text-lg">
              {t('auth.heroSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[t('auth.featureTasks'), t('auth.featureFocus'), t('auth.featureFinance')].map((feature) => (
              <div
                key={feature}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center"
              >
                <p className="text-white text-sm font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300 text-sm">
          {t('auth.trustedBy')}
        </p>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">LifePilot</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">{t('auth.welcomeBack')}</h1>
          <p className="text-foreground-secondary mb-8">{t('auth.signInSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-foreground-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                <input type="checkbox" className="rounded border-border text-accent focus:ring-border-focus" />
                {t('auth.rememberMe')}
              </label>
              <button
                type="button"
                onClick={() => toast.error(t('auth.forgotPasswordComingSoon', { defaultValue: 'Password reset coming soon' }))}
                className="text-sm text-accent hover:text-accent font-medium"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.signIn')}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground-secondary uppercase font-medium">
              {t('auth.orContinueWith', { defaultValue: 'or' })}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            {googleLoading ? (
              <Button loading className="w-full" variant="secondary" size="lg">
                Google...
              </Button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t('auth.googleError', { defaultValue: 'Google sign-in failed' }))}
                width="400"
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            )}
          </div>

          <p className="mt-8 text-center text-sm text-foreground-secondary">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-accent hover:text-accent font-medium">
              {t('auth.signUpFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
