import { useState } from 'react';
import { User, Palette, Moon, Sun, Globe, DollarSign, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { SUPPORTED_CURRENCIES } from '@/utils/constants';
import { showApiError, showSuccess } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'preferences';

/** Страница настроек пользователя с вкладками профиля, внешнего вида и тарифного плана. */
export function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, locale, setLocale } = useUiStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t('settings.profile'), icon: <User className="w-4 h-4" /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Palette className="w-4 h-4" /> },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      showSuccess('errors.profileUpdated');
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('settings.profileInfo')}</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <Button variant="secondary" size="sm" onClick={() => toast.error('Avatar upload coming soon')}>
                {t('settings.changeAvatar')}
              </Button>
              <p className="text-xs text-gray-500 mt-1">{t('settings.avatarHint')}</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <Input
              label={t('settings.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input label={t('auth.email')} value={user?.email || ''} disabled />
            <div className="pt-2">
              <Button onClick={handleSaveProfile} loading={saving}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Preferences tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.appearance')}</h3>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-warning-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('settings.darkMode')}</p>
                  <p className="text-xs text-gray-500">{t('settings.darkModeDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={clsx(
                  'relative w-11 h-6 rounded-full transition-colors',
                  theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <div
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    theme === 'dark' ? 'left-6' : 'left-1'
                  )}
                />
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.regional')}</h3>
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settings.language')}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'ru', label: 'Русский' },
                  ]}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as 'en' | 'ru')}
                />
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settings.currency')}
                  options={SUPPORTED_CURRENCIES.map((c) => ({
                    value: c.code,
                    label: `${c.symbol} ${c.name}`,
                  }))}
                  value={user?.base_currency || 'USD'}
                  onChange={(e) => updateProfile({ base_currency: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settings.timezone')}
                  options={[
                    { value: 'UTC', label: t('settings.timezoneUTC') },
                    { value: 'America/New_York', label: t('settings.timezoneEastern') },
                    { value: 'America/Chicago', label: t('settings.timezoneCentral') },
                    { value: 'America/Denver', label: t('settings.timezoneMountain') },
                    { value: 'America/Los_Angeles', label: t('settings.timezonePacific') },
                    { value: 'Europe/London', label: t('settings.timezoneLondon') },
                    { value: 'Europe/Moscow', label: t('settings.timezoneMoscow') },
                    { value: 'Asia/Tokyo', label: t('settings.timezoneTokyo') },
                  ]}
                  value={user?.timezone || 'UTC'}
                  onChange={(e) => updateProfile({ timezone: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
