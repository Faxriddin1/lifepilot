import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

type LegalType = 'privacy' | 'terms';

const content: Record<LegalType, { ru: { title: string; body: string }; en: { title: string; body: string } }> = {
  privacy: {
    ru: {
      title: 'Политика конфиденциальности',
      body: `Последнее обновление: март 2026

1. ОБЩИЕ ПОЛОЖЕНИЯ

LifePilot («мы», «наш», «платформа») — бесплатный стартап-проект для управления задачами, продуктивностью и личными финансами. Настоящая Политика описывает, какие данные мы собираем и как их используем.

2. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ

Мы собираем следующие данные:
• Данные аккаунта: email-адрес и имя (при регистрации)
• Данные использования: созданные задачи, проекты, финансовые записи, фокус-сессии, привычки, дневниковые записи
• Технические данные: тип браузера, разрешение экрана, язык, часовой пояс, IP-адрес
• Google OAuth: при входе через Google мы получаем имя, email и аватар из вашего Google-профиля

3. КАК МЫ ИСПОЛЬЗУЕМ ДАННЫЕ

3.1 Для работы сервиса:
Ваши задачи, финансы и другие данные хранятся для обеспечения работы платформы.

3.2 Для улучшения продукта:
Мы используем обезличенные (анонимизированные) данные для анализа и улучшения платформы:
• Статистика использования функций (какие модули популярнее)
• Паттерны продуктивности (в какое время пользователи наиболее активны)
• Финансовые тренды (средние суммы бюджетов, популярные категории)

ВАЖНО: В анонимизированных данных НЕ содержатся имена, email-адреса и другие персональные идентификаторы.

3.3 Для коммерческих целей поддержки проекта:
Мы можем использовать обезличенные агрегированные данные:
• Продажа аналитических отчётов (без персональных данных)
• Исследования рынка продуктивности и финансового поведения
• Статистические данные для партнёров

4. ЗАЩИТА ДАННЫХ

• Все данные передаются по зашифрованному каналу (HTTPS/TLS)
• Пароли хранятся в виде хешей (PBKDF2)
• JWT-токены с ротацией и blacklist
• Разграничение доступа — каждый пользователь видит только свои данные

5. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ

Мы НЕ продаём и НЕ передаём персональные данные (имя, email) третьим лицам.
Мы можем передавать только обезличенные агрегированные данные.

6. ХРАНЕНИЕ ДАННЫХ

Ваши данные хранятся на серверах Google Cloud (регион: US). Данные хранятся до момента удаления аккаунта.

7. ВАШИ ПРАВА

Вы имеете право:
• Запросить копию своих данных
• Удалить свой аккаунт и все связанные данные
• Отказаться от сбора анонимной статистики (напишите нам)

8. КОНТАКТЫ

По вопросам конфиденциальности: iamfakhriddin@gmail.com`,
    },
    en: {
      title: 'Privacy Policy',
      body: `Last updated: March 2026

1. GENERAL

LifePilot ("we", "our", "platform") is a free startup project for task management, productivity, and personal finance. This Policy describes what data we collect and how we use it.

2. DATA WE COLLECT

We collect the following data:
• Account data: email address and name (upon registration)
• Usage data: tasks, projects, financial records, focus sessions, habits, journal entries
• Technical data: browser type, screen resolution, language, timezone, IP address
• Google OAuth: when signing in via Google, we receive your name, email, and avatar

3. HOW WE USE DATA

3.1 To operate the service:
Your tasks, finances, and other data are stored to ensure the platform functions properly.

3.2 To improve the product:
We use anonymized data for analysis and product improvement:
• Feature usage statistics (which modules are most popular)
• Productivity patterns (peak activity times)
• Financial trends (average budgets, popular categories)

IMPORTANT: Anonymized data does NOT contain names, email addresses, or other personal identifiers.

3.3 For commercial purposes to support the project:
We may use anonymized aggregated data:
• Selling analytical reports (without personal data)
• Productivity and financial behavior market research
• Statistical data for partners

4. DATA PROTECTION

• All data is transmitted over encrypted channels (HTTPS/TLS)
• Passwords are stored as hashes (PBKDF2)
• JWT tokens with rotation and blacklist
• Access control — each user can only see their own data

5. THIRD-PARTY SHARING

We do NOT sell or share personal data (name, email) with third parties.
We may only share anonymized aggregated data.

6. DATA STORAGE

Your data is stored on Google Cloud servers (region: US). Data is kept until account deletion.

7. YOUR RIGHTS

You have the right to:
• Request a copy of your data
• Delete your account and all associated data
• Opt out of anonymous statistics collection (contact us)

8. CONTACT

Privacy inquiries: iamfakhriddin@gmail.com`,
    },
  },
  terms: {
    ru: {
      title: 'Условия использования',
      body: `Последнее обновление: март 2026

1. ПРИНЯТИЕ УСЛОВИЙ

Используя платформу LifePilot, вы соглашаетесь с настоящими Условиями. Если вы не согласны — не используйте сервис.

2. ОПИСАНИЕ СЕРВИСА

LifePilot — бесплатная платформа для управления задачами, продуктивностью и личными финансами. Проект является стартапом и предоставляется «как есть».

3. РЕГИСТРАЦИЯ

• Для использования сервиса необходима регистрация
• Вы обязаны предоставить достоверный email-адрес
• Вы несёте ответственность за сохранность пароля
• Один человек — один аккаунт

4. ДОПУСТИМОЕ ИСПОЛЬЗОВАНИЕ

Вы НЕ имеете права:
• Копировать, воспроизводить или распространять код или дизайн платформы
• Использовать платформу в коммерческих целях без письменного разрешения
• Делать реверс-инжиниринг, декомпилировать или разбирать программное обеспечение
• Создавать производные продукты на основе LifePilot
• Использовать автоматизированные средства для массового сбора данных (scraping)
• Нарушать работоспособность сервиса или пытаться получить несанкционированный доступ

5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ

Весь исходный код, дизайн, логотипы и контент платформы LifePilot являются интеллектуальной собственностью проекта. Копирование и использование в коммерческих целях запрещено без письменного согласия.

6. ДАННЫЕ ПОЛЬЗОВАТЕЛЯ

• Ваши данные (задачи, финансы, привычки) принадлежат вам
• Мы используем обезличенные данные для улучшения продукта и поддержки проекта (см. Политику конфиденциальности)
• Вы можете удалить свой аккаунт и все данные в любое время

7. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ

• Сервис предоставляется бесплатно и «как есть» (as-is)
• Мы не гарантируем бесперебойную работу 24/7
• Мы не несём ответственности за потерю данных
• Мы рекомендуем регулярно экспортировать важные данные

8. БЕСПЛАТНОСТЬ

• LifePilot является бесплатным сервисом
• Мы не взимаем плату за использование
• В будущем могут появиться платные функции, но базовый функционал останется бесплатным

9. ИЗМЕНЕНИЕ УСЛОВИЙ

Мы можем обновить эти Условия. Об изменениях мы уведомим через email или уведомление в приложении. Продолжая использовать сервис, вы принимаете обновлённые Условия.

10. КОНТАКТЫ

По вопросам: iamfakhriddin@gmail.com`,
    },
    en: {
      title: 'Terms of Service',
      body: `Last updated: March 2026

1. ACCEPTANCE OF TERMS

By using LifePilot, you agree to these Terms. If you disagree, do not use the service.

2. SERVICE DESCRIPTION

LifePilot is a free platform for task management, productivity, and personal finance. The project is a startup and is provided "as is."

3. REGISTRATION

• Registration is required to use the service
• You must provide a valid email address
• You are responsible for keeping your password secure
• One person — one account

4. ACCEPTABLE USE

You may NOT:
• Copy, reproduce, or distribute the platform's code or design
• Use the platform for commercial purposes without written permission
• Reverse-engineer, decompile, or disassemble the software
• Create derivative products based on LifePilot
• Use automated tools for mass data collection (scraping)
• Disrupt service operations or attempt unauthorized access

5. INTELLECTUAL PROPERTY

All source code, design, logos, and content of LifePilot are the intellectual property of the project. Copying and commercial use are prohibited without written consent.

6. USER DATA

• Your data (tasks, finances, habits) belongs to you
• We use anonymized data to improve the product and support the project (see Privacy Policy)
• You can delete your account and all data at any time

7. LIMITATION OF LIABILITY

• The service is provided free of charge and "as is"
• We do not guarantee 24/7 uninterrupted operation
• We are not liable for data loss
• We recommend regularly exporting important data

8. FREE SERVICE

• LifePilot is a free service
• We do not charge for use
• Paid features may appear in the future, but core functionality will remain free

9. CHANGES TO TERMS

We may update these Terms. We will notify you via email or in-app notification. Continued use constitutes acceptance of updated Terms.

10. CONTACT

Questions: iamfakhriddin@gmail.com`,
    },
  },
};

export function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const legalType = (type === 'privacy' || type === 'terms') ? type : 'privacy';
  const savedLang = localStorage.getItem('locale') || localStorage.getItem('landing-lang') || 'en';
  const lang = savedLang.startsWith('ru') || savedLang === 'uz-cyr' ? 'ru' : 'en';
  const data = content[legalType][lang];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            LifePilot
          </button>
          <h1 className="text-2xl sm:text-4xl font-black">{data.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="prose prose-gray max-w-none">
          {data.body.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            if (/^\d+\.\s[A-ZА-Я]/.test(line)) {
              return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{line}</h2>;
            }
            if (/^\d+\.\d+\s/.test(line)) {
              return <h3 key={i} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line}</h3>;
            }
            if (line.startsWith('•')) {
              return <p key={i} className="text-gray-600 pl-4 mb-1">{line}</p>;
            }
            if (line.startsWith('ВАЖНО:') || line.startsWith('IMPORTANT:')) {
              return <p key={i} className="text-blue-700 font-semibold bg-blue-50 p-3 rounded-lg my-3">{line}</p>;
            }
            return <p key={i} className="text-gray-600 mb-2 leading-relaxed">{line}</p>;
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-600">LifePilot</span>
        </div>
        &copy; {new Date().getFullYear()} LifePilot
      </div>
    </div>
  );
}
