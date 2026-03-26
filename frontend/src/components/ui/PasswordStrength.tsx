import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import clsx from 'clsx';
import { getPasswordRequirements, getPasswordStrength } from '@/utils/validation';

interface PasswordStrengthProps {
  password: string;
}

const STRENGTH_COLORS = ['bg-danger', 'bg-danger', 'bg-expense', 'bg-warning', 'bg-success/80', 'bg-success'];
const STRENGTH_LABELS_EN = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_LABELS_RU = ['', 'Очень слабый', 'Слабый', 'Средний', 'Сильный', 'Очень сильный'];

/** Визуальный индикатор силы пароля с чеклистом требований. */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t, i18n } = useTranslation();
  const reqs = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);
  const isRu = i18n.language === 'ru' || i18n.language === 'uz-cyr';
  const labels = isRu ? STRENGTH_LABELS_RU : STRENGTH_LABELS_EN;

  if (!password) return null;

  const requirements = [
    { key: 'minLength', met: reqs.minLength, label: t('errors.passwordReqMinLength') },
    { key: 'hasUppercase', met: reqs.hasUppercase, label: t('errors.passwordReqUppercase') },
    { key: 'hasLowercase', met: reqs.hasLowercase, label: t('errors.passwordReqLowercase') },
    { key: 'hasNumber', met: reqs.hasNumber, label: t('errors.passwordReqNumber') },
    { key: 'hasSpecial', met: reqs.hasSpecial, label: t('errors.passwordReqSpecial') },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i <= strength ? STRENGTH_COLORS[strength] : 'bg-elevated',
              )}
            />
          ))}
        </div>
        <span className={clsx(
          'text-xs font-medium',
          strength <= 2 ? 'text-danger' : strength <= 3 ? 'text-warning' : 'text-success',
        )}>
          {labels[strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-1.5">
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-foreground-tertiary flex-shrink-0" />
            )}
            <span className={clsx(
              'text-xs transition-colors',
              req.met ? 'text-success' : 'text-foreground-tertiary',
            )}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
