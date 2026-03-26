import { AxiosError } from 'axios';
import { toast } from 'sonner';
import i18n from '@/i18n';

interface ApiErrorResponse {
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

const t = (key: string) => i18n.t(key);

/**
 * Извлекает человекочитаемое сообщение об ошибке из ответа API.
 * Обрабатывает ошибки сети, валидации, стандартные HTTP-статусы.
 * @param error - Ошибка (AxiosError, Error или unknown)
 * @returns Локализованное сообщение об ошибке
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;

    // Network error (no response)
    if (!error.response) {
      return t('errors.network');
    }

    // Validation errors — join field messages
    if (data?.errors && typeof data.errors === 'object') {
      const messages = Object.entries(data.errors)
        .map(([field, msgs]) => {
          const fieldMsgs = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${fieldMsgs}`;
        })
        .join('; ');
      return messages || t('errors.validationError');
    }

    // Standard detail message from backend
    if (data?.detail) {
      return data.detail;
    }

    // Fallback by status code
    switch (status) {
      case 401:
        return t('errors.unauthorized');
      case 403:
        return t('errors.forbidden');
      case 404:
        return t('errors.notFound');
      case 429:
        return t('errors.tooManyRequests');
      case 500:
      case 502:
      case 503:
        return t('errors.serverError');
      default:
        return t('errors.unknownError');
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return t('errors.unknownError');
}

/**
 * Показывает toast-уведомление с сообщением об ошибке API.
 * @param error - Ошибка для отображения
 */
export function showApiError(error: unknown): void {
  const message = getApiErrorMessage(error);
  toast.error(message);
}

/**
 * Показывает toast-уведомление об успешной операции.
 * @param messageKey - Ключ i18n для сообщения
 */
export function showSuccess(messageKey: string): void {
  toast.success(t(messageKey));
}
