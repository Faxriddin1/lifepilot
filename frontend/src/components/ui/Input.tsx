import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

/** Текстовое поле ввода с поддержкой лейбла, иконок, ошибок и подсказок. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full rounded-input border bg-white px-3 py-2 text-sm transition-colors duration-150',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
              error
                ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500'
                : 'border-gray-300 dark:border-gray-600',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
