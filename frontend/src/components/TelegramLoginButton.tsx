import { useEffect, useRef } from 'react';

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
 * Telegram Login Widget button.
 * Loads the official Telegram widget script and renders the login button.
 * On successful auth, calls onAuth with verified user data.
 *
 * Prerequisites:
 * 1. Bot must be created via @BotFather
 * 2. Domain must be set via /setdomain command in @BotFather
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up global callback
    const callbackName = `__telegram_login_${Date.now()}`;
    (window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user);
    };

    // Clean container
    containerRef.current.innerHTML = '';

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-lang', lang);
    if (cornerRadius) {
      script.setAttribute('data-radius', String(cornerRadius));
    }
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, lang]);

  return <div ref={containerRef} className="flex justify-center" />;
}
