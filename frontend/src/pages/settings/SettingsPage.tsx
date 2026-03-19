import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Palette, Moon, Sun, Globe, DollarSign, Clock,
  Lock, Shield, Trash2, Download, Calendar, Hash, Bell,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { SUPPORTED_CURRENCIES, TIMEZONES } from '@/utils/constants';
import { authApi } from '@/api/auth';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { showApiError, showSuccess } from '@/utils/errorHandler';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';

type Tab = 'profile' | 'preferences' | 'security';

/** Страница настроек пользователя с 3 вкладками. */
export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, locale, setLocale } = useUiStore();
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t('settings.profile'), icon: <User className="w-4 h-4" /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Palette className="w-4 h-4" /> },
    { id: 'security', label: t('settingsNew.security'), icon: <Shield className="w-4 h-4" /> },
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

  const handleChangePassword = async () => {
    const passErr = validatePassword(newPassword);
    if (passErr) {
      showApiError({ response: { data: { detail: passErr } } });
      return;
    }
    const matchErr = validatePasswordMatch(newPassword, confirmPassword);
    if (matchErr) {
      showApiError({ response: { data: { detail: matchErr } } });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      showSuccess(t('settingsNew.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showApiError(err);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount(deletePassword);
      logout();
      navigate('/welcome');
    } catch (err) {
      showApiError(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: user,
      exported_at: new Date().toISOString(),
      note: 'Export from LifePilot',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifepilot-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess(t('settingsNew.dataExported'));
  };


  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
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

      {/* ═══ PROFILE TAB ═══ */}
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
              <p className="text-xs text-gray-500">{t('settingsNew.memberSince')}: {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}</p>
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

      {/* ═══ PREFERENCES TAB ═══ */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          {/* Appearance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.appearance')}</h3>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-warning-500" />}
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
                <div className={clsx(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  theme === 'dark' ? 'left-6' : 'left-1'
                )} />
              </button>
            </div>
          </Card>

          {/* Regional */}
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
                    { value: 'uz', label: "O'zbekcha (lotin)" },
                    { value: 'uz-cyr', label: 'Ўзбекча (кирилл)' },
                  ]}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as 'en' | 'ru' | 'uz' | 'uz-cyr')}
                />
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settings.currency')}
                  options={SUPPORTED_CURRENCIES.map((c) => ({
                    value: c.code,
                    label: `${c.symbol} ${c.name} (${c.code})`,
                  }))}
                  value={user?.base_currency || 'USD'}
                  onChange={(e) => updateProfile({ base_currency: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settings.timezone')}
                  options={TIMEZONES.map((tz) => ({ value: tz.value, label: tz.label }))}
                  value={user?.timezone || 'UTC'}
                  onChange={(e) => updateProfile({ timezone: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Formatting */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('settingsNew.formatting')}
            </h3>
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settingsNew.dateFormat')}
                  options={[
                    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2026)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
                  ]}
                  value={user?.date_format || 'DD.MM.YYYY'}
                  onChange={(e) => updateProfile({ date_format: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settingsNew.firstDayOfWeek')}
                  options={[
                    { value: 'mon', label: t('settingsNew.monday') },
                    { value: 'sun', label: t('settingsNew.sunday') },
                  ]}
                  value={user?.week_start || 'mon'}
                  onChange={(e) => updateProfile({ week_start: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Select
                  label={t('settingsNew.numberFormat')}
                  options={[
                    { value: '1 000,00', label: '1 000,00' },
                    { value: '1,000.00', label: '1,000.00' },
                    { value: '1.000,00', label: '1.000,00' },
                  ]}
                  value={user?.number_format || '1 000,00'}
                  onChange={(e) => updateProfile({ number_format: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Change Password */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('settingsNew.changePassword')}
              </h3>
            </div>
            <div className="space-y-4 max-w-md">
              <Input
                label={t('settingsNew.currentPassword')}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div>
                <Input
                  label={t('settingsNew.newPassword')}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settingsNew.minChars')}
                />
                <PasswordStrength password={newPassword} />
              </div>
              <Input
                label={t('settingsNew.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                onClick={handleChangePassword}
                loading={changingPassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                {t('settingsNew.changePasswordBtn')}
              </Button>
            </div>
          </Card>

          {/* Export Data */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('settingsNew.exportData')}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {t('settingsNew.exportDesc')}
            </p>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportData}>
              {t('settingsNew.downloadData')}
            </Button>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200 dark:border-red-900">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                {t('settingsNew.deleteAccount')}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {t('settingsNew.deleteWarning')}
            </p>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              {t('settingsNew.deleteAccountBtn')}
            </Button>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletePassword(''); }}
        title={t('settingsNew.confirmDeletion')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('settingsNew.confirmDeletionDesc')}
            </p>
          </div>
          <Input
            label={t('settingsNew.enterPassword')}
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={!deletePassword}
            >
              {t('settingsNew.deleteForever')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
