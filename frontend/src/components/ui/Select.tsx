import { forwardRef, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/** Выпадающий список с поддержкой лейбла, placeholder и валидации ошибок. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'block w-full rounded-input border bg-white px-3 py-2 pr-10 text-sm appearance-none transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:text-gray-100',
              error
                ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500'
                : 'border-gray-300 dark:border-gray-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
