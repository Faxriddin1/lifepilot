import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | '';
  lang?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Telegram Login Widget with loading placeholder.
 * Shows a styled placeholder button while the widget loads,
 * then swaps to the real Telegram iframe.
 */
export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  lang = 'ru',
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Global callback
    const callbackName = `__tg_auth_${Date.now()}`;
    (window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user);
    };

    // Create script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-radius', String(cornerRadius));
    script.async = true;
    script.onload = () => {
      // Widget iframe appears after script loads
      setTimeout(() => setLoaded(true), 500);
    };

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, lang]);

  const labels: Record<string, string> = {
    ru: 'Войти через Telegram',
    en: 'Sign in with Telegram',
    uz: 'Telegram orqali kirish',
  };

  return (
    <div className="relative w-full flex justify-center min-h-[44px]">
      {/* Placeholder shown while widget loads */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-3 h-11 px-6 bg-[#54a9eb] text-white font-semibold rounded-lg text-base">
            <Loader2 className="w-5 h-5 animate-spin" />
            {labels[lang] || labels.en}
          </div>
        </div>
      )}
      {/* Actual Telegram widget */}
      <div
        ref={containerRef}
        className={loaded ? 'flex justify-center' : 'opacity-0 absolute pointer-events-none'}
      />
    </div>
  );
}
