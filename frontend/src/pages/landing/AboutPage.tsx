import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Zap, Target, Heart, Globe, Mail, Send } from 'lucide-react';

export function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            LifePilot
          </button>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">
            {t('about.title')}
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Mission */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('about.missionTitle')}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            {t('about.missionText')}
          </p>
        </div>

        {/* Why Free */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('about.whyFreeTitle')}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            {t('about.whyFreeText')}
          </p>
        </div>

        {/* Stack */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('about.techTitle')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Frontend', value: 'React 18 + TypeScript + TailwindCSS' },
              { label: 'Backend', value: 'Django 5 + Django REST Framework' },
              { label: 'Database', value: 'PostgreSQL 16 + Redis 7' },
              { label: 'Auth', value: 'JWT + Google OAuth 2.0' },
              { label: 'Hosting', value: 'Google Cloud Platform' },
              { label: t('about.languagesLabel'), value: t('about.languagesValue') },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('about.contactTitle')}
            </h2>
          </div>
          <div className="space-y-3">
            <a href="mailto:iamfakhriddin@gmail.com" className="flex items-center gap-3 text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Mail className="w-5 h-5" />
              iamfakhriddin@gmail.com
            </a>
            <a href="https://t.me/lifepilot_uz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Send className="w-5 h-5" />
              @lifepilot_uz (Telegram)
            </a>
          </div>
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
