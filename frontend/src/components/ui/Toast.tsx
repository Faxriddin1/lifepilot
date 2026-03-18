import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';
import { useToastStore, type ToastType } from '@/store/toastStore';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
};

/** Контейнер всплывающих уведомлений с поддержкой типов success, error, warning и info. */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-start gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right',
              colorMap[toast.type]
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
