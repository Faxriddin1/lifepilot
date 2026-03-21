import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { showApiError } from '@/utils/errorHandler';
import { validateRegisterForm } from '@/utils/validation';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import toast from 'react-hot-toast';

/** Страница регистрации нового пользователя с валидацией имени, email и пароля. */
export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (err) {
      showApiError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(email, password, confirmPassword, name);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register({
        email,
        password,
        password_confirm: confirmPassword,
        name: name.trim(),
      });
      toast.success(t('auth.registerSuccess'));
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-600 via-primary-700 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LifePilot</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">{t('register.brandTitle')}</h2>
          <div className="space-y-4">
            {(t('register.brandFeatures', { returnObjects: true }) as string[]).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-primary-100">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300 text-sm">{t('auth.trustedBy')}</p>
      </div>

      {/* Right: Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">LifePilot</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('register.title')}</h1>
          <p className="text-gray-500 mb-8">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('register.name')}
              placeholder={t('register.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              icon={<User className="w-4 h-4" />}
            />

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
              placeholder={t('register.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <PasswordStrength password={password} />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              placeholder={t('register.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t('register.createBtn')}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 uppercase font-medium">
              {t('auth.orContinueWith', { defaultValue: 'or' })}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
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
                text="signup_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            {t('register.termsPrefix')}{' '}
            <span className="text-primary-600">{t('register.termsLink')}</span>{' '}
            {t('register.termsAnd')}{' '}
            <span className="text-primary-600">{t('register.privacyLink')}</span>.
          </p>

          <p className="mt-8 text-center text-sm text-gray-500">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.signInLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
