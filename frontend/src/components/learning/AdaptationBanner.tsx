import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface AdaptationBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Banner shown when AI adapts the learning plan.
 * Uses bg-info-bg/text-accent/border-accent/20 semantic tokens.
 */
export function AdaptationBanner({ message, onDismiss }: AdaptationBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 bg-info-bg text-accent border border-accent/20 rounded-lg p-3">
      <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">🤖</span>
      <p className="flex-1 text-sm leading-snug">
        <span className="font-medium">{t('learning.adaptation.prefix')}</span>{' '}
        {message}
      </p>
      <button
        onClick={onDismiss}
        aria-label={t('common.dismiss')}
        className="p-0.5 rounded text-accent/70 hover:text-accent hover:bg-accent/10 transition-colors duration-fast flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
