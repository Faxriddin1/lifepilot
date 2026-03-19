import i18n from '@/i18n';

const t = (key: string) => i18n.t(key);

export type ValidationErrors = Record<string, string>;

/**
 * Проверяет, что значение не пустое.
 * @param value - Строковое значение для проверки
 * @param _fieldName - Имя поля (не используется)
 * @returns Сообщение об ошибке или null
 */
export function validateRequired(value: string, _fieldName?: string): string | null {
  if (!value || !value.trim()) {
    return t('errors.fieldRequired');
  }
  return null;
}

/**
 * Валидация email-адреса.
 * @param email - Email для проверки
 * @returns Сообщение об ошибке или null
 */
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return t('errors.fieldRequired');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return t('errors.invalidEmail');
  }
  return null;
}

/**
 * Валидация пароля с требованиями безопасности.
 * Требования: минимум 8 символов, заглавная буква, строчная, цифра, спецсимвол.
 * @param password - Пароль для проверки
 * @returns Сообщение об ошибке или null
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return t('errors.fieldRequired');
  }
  if (password.length < 8) {
    return t('errors.passwordTooShort');
  }
  if (!/[A-Z]/.test(password)) {
    return t('errors.passwordNoUppercase');
  }
  if (!/[a-z]/.test(password)) {
    return t('errors.passwordNoLowercase');
  }
  if (!/[0-9]/.test(password)) {
    return t('errors.passwordNoNumber');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return t('errors.passwordNoSpecial');
  }
  return null;
}

/**
 * Проверяет отдельные требования к паролю для визуального индикатора.
 * @param password - Пароль для проверки
 * @returns Объект с результатами проверок
 */
export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Вычисляет силу пароля (0-5).
 * @param password - Пароль
 * @returns Число от 0 до 5
 */
export function getPasswordStrength(password: string): number {
  const reqs = getPasswordRequirements(password);
  return Object.values(reqs).filter(Boolean).length;
}

/**
 * Проверка совпадения пароля и подтверждения.
 * @param password - Пароль
 * @param confirmPassword - Подтверждение пароля
 * @returns Сообщение об ошибке или null
 */
export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return t('errors.passwordsDoNotMatch');
  }
  return null;
}

/**
 * Проверка минимальной длины строки.
 * @param value - Строковое значение
 * @param min - Минимальная длина
 * @returns Сообщение об ошибке или null
 */
export function validateMinLength(value: string, min: number): string | null {
  if (!value || !value.trim()) {
    return t('errors.fieldRequired');
  }
  if (value.trim().length < min) {
    return t('errors.nameTooShort');
  }
  return null;
}

/**
 * Валидация суммы (должна быть положительным числом).
 * @param value - Сумма в виде строки или числа
 * @returns Сообщение об ошибке или null
 */
export function validateAmount(value: string | number): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num <= 0) {
    return t('errors.invalidAmount');
  }
  return null;
}

/**
 * Валидация формы входа.
 * @param email - Email пользователя
 * @param password - Пароль
 * @returns Объект с ошибками по полям (пустой при успехе)
 */
export function validateLoginForm(email: string, password: string): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passErr = validateRequired(password, 'password');
  if (passErr) errors.password = passErr;
  return errors;
}

/**
 * Валидация формы регистрации.
 * @param email - Email
 * @param password - Пароль
 * @param confirmPassword - Подтверждение пароля
 * @param firstName - Имя пользователя
 * @returns Объект с ошибками по полям (пустой при успехе)
 */
export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string,
  firstName: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;
  const matchErr = validatePasswordMatch(password, confirmPassword);
  if (matchErr) errors.confirmPassword = matchErr;
  const nameErr = validateMinLength(firstName, 2);
  if (nameErr) errors.firstName = nameErr;
  return errors;
}

/**
 * Валидация формы создания транзакции.
 * @param amount - Сумма транзакции
 * @param description - Описание
 * @param accountId - UUID счёта
 * @returns Объект с ошибками по полям (пустой при успехе)
 */
export function validateTransactionForm(
  amount: string,
  description: string,
  accountId: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const amountErr = validateAmount(amount);
  if (amountErr) errors.amount = amountErr;
  if (!description.trim()) errors.description = t('errors.fieldRequired');
  if (!accountId) errors.accountId = t('errors.accountRequired');
  return errors;
}
