import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Timer, Wallet, ChevronRight, Check, Globe,
  Target, Zap, Shield, ArrowRight, Users, TrendingUp, Menu, X,
} from 'lucide-react';
import clsx from 'clsx';
import { landing, LANG_LABELS, type LandingLang } from './landingTranslations';
import { useScrollReveal, useNavScroll } from './useScrollReveal';
import { useSpotlight, useCardTilt, useMagnetic, useHeroParallax } from './useCursorEffects';
import { IntroScreen } from './IntroScreen';
import './landing.css';

/** Лендинг LifePilot — главная страница с анимациями, intro и cursor effects. */
export function LandingPage() {
  const [lang, setLang] = useState<LandingLang>(() => {
    const saved = localStorage.getItem('landing-lang');
    if (saved && saved in landing) return saved as LandingLang;
    const bl = navigator.language.toLowerCase();
    if (bl.startsWith('ru')) return 'ru';
    if (bl.startsWith('uz')) return 'uz';
    return 'en';
  });
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('intro-seen');
  });
  const navigate = useNavigate();
  const t = landing[lang];

  useScrollReveal();
  useNavScroll();
  useSpotlight();
  useCardTilt();
  useMagnetic();
  useHeroParallax();

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  const onIntroComplete = useCallback(() => {
    sessionStorage.setItem('intro-seen', '1');
    setShowIntro(false);
  }, []);

  const changeLang = (l: LandingLang) => {
    setLang(l);
    setLangOpen(false);
    localStorage.setItem('landing-lang', l);
  };

  return (
    <>
      {/* ═══ INTRO SCREEN ═══ */}
      {showIntro && <IntroScreen onComplete={onIntroComplete} />}

      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden landing-grain">

        {/* ═══ NAVBAR ═══ */}
        <nav className="landing-nav fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold landing-gradient-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                LifePilot
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors duration-200">{t.navFeatures}</a>
              <a href="#how" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors duration-200">{t.navAbout}</a>
            </div>

            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all duration-200"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{LANG_LABELS[lang]}</span>
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-48 overflow-hidden" style={{ animation: 'landing-scale-in 0.2s ease-out' }}>
                      {(Object.keys(LANG_LABELS) as LandingLang[]).map((l) => (
                        <button
                          key={l}
                          onClick={() => changeLang(l)}
                          className={clsx(
                            'w-full text-left px-5 py-3 text-sm transition-all duration-150',
                            lang === l ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-50 text-gray-700',
                          )}
                        >
                          {LANG_LABELS[l]}
                          {lang === l && <Check className="w-4 h-4 inline ml-2" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button onClick={goLogin} className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">
                {t.navLogin}
              </button>
              <button
                onClick={goRegister}
                className="landing-btn-primary px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hidden sm:block"
              >
                {t.navRegister}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3" style={{ animation: 'landing-fade-up 0.2s ease-out' }}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2">{t.navFeatures}</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2">{t.navAbout}</a>
              <hr className="border-gray-100" />
              <button onClick={() => { goLogin(); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-semibold text-gray-600 py-2">{t.navLogin}</button>
              <button
                onClick={() => { goRegister(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl"
              >
                {t.navRegister}
              </button>
            </div>
          )}
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="pt-24 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 relative overflow-hidden">
          {/* Animated mesh blobs — parallax layers */}
          <div className="parallax-layer mesh-blob-1 absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-200/50 via-indigo-200/30 to-purple-200/40 rounded-full blur-3xl -z-10" data-depth="1.5" />
          <div className="parallax-layer mesh-blob-2 absolute top-[200px] right-[-200px] w-[500px] h-[500px] bg-gradient-to-br from-cyan-200/30 to-blue-200/20 rounded-full blur-3xl -z-10" data-depth="2" />
          <div className="parallax-layer mesh-blob-1 absolute bottom-[-100px] left-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl -z-10" data-depth="1" />

          {/* Floating geometric shapes — parallax layers */}
          <div className="parallax-layer landing-float-1 absolute top-32 left-[10%] w-14 h-14 border-2 border-blue-300/30 rounded-2xl -z-10 hidden lg:block" data-depth="3" />
          <div className="parallax-layer landing-float-2 absolute top-48 right-[15%] w-10 h-10 bg-indigo-300/20 rounded-full -z-10 hidden lg:block" data-depth="2.5" />
          <div className="parallax-layer landing-float-3 absolute bottom-32 left-[20%] w-8 h-8 bg-purple-300/25 rounded-xl rotate-45 -z-10 hidden lg:block" data-depth="2" />
          <div className="parallax-layer landing-float-2 absolute top-64 left-[5%] w-5 h-5 bg-cyan-400/20 rounded-full -z-10 hidden lg:block" data-depth="3.5" />
          <div className="parallax-layer landing-float-1 absolute bottom-48 right-[8%] w-12 h-12 border-2 border-purple-300/20 rounded-full -z-10 hidden lg:block" data-depth="1.5" />
          <div className="parallax-layer landing-float-3 absolute top-80 right-[25%] w-6 h-6 bg-blue-400/15 rounded-lg -z-10 hidden lg:block" data-depth="4" />

          <div className="max-w-4xl mx-auto text-center hero-stagger">
            {/* Badge */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs sm:text-sm font-bold border border-blue-100/50 shadow-sm">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                LifePilot — All-in-One Productivity
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.12] sm:leading-[1.08] tracking-tight mt-6 sm:mt-8 mb-4 sm:mb-6 px-2 sm:px-0">
              {t.heroTitle.split('\n').map((line, i) => (
                <span key={i}>
                  {i === 0 ? (
                    <span className="landing-gradient-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">{line}</span>
                  ) : (
                    <span className="text-gray-900">{line}</span>
                  )}
                  {i === 0 && <br />}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed font-medium px-2 sm:px-0">
              {t.heroSubtitle}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <div className="magnetic-btn inline-flex w-full sm:w-auto">
                <button
                  onClick={goRegister}
                  className="landing-btn-primary landing-btn-glow group w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-base sm:text-lg font-bold rounded-2xl flex items-center justify-center gap-2"
                >
                  {t.heroCta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
                </button>
              </div>
              <a
                href="#how"
                className="landing-btn-primary w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-gray-50 border-2 border-gray-200 text-gray-700 text-base sm:text-lg font-bold rounded-2xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-2"
              >
                {t.heroSecondary}
              </a>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-50/80 to-white relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20 landing-reveal">
              <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-full text-xs sm:text-sm font-bold border border-blue-100/50 mb-4 sm:mb-5">
                {t.featuresTag}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-5 tracking-tight px-2 sm:px-0">{t.featuresTitle}</h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-medium px-2 sm:px-0">{t.featuresSubtitle}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Tasks card */}
              <div className="landing-reveal landing-reveal-delay-1 tilt-card bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 border border-gray-100 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-7 shadow-lg shadow-blue-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <CheckSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.featureTasksTitle}</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">{t.featureTasksDesc}</p>
                <ul className="space-y-3">
                  {[t.featureTasksBullet1, t.featureTasksBullet2, t.featureTasksBullet3].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Focus card */}
              <div className="landing-reveal landing-reveal-delay-2 tilt-card bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 border border-gray-100 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-7 shadow-lg shadow-emerald-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Timer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.featureFocusTitle}</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">{t.featureFocusDesc}</p>
                <ul className="space-y-3">
                  {[t.featureFocusBullet1, t.featureFocusBullet2, t.featureFocusBullet3].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Finance card */}
              <div className="landing-reveal landing-reveal-delay-3 tilt-card bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 border border-gray-100 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-7 shadow-lg shadow-amber-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.featureFinanceTitle}</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">{t.featureFinanceDesc}</p>
                <ul className="space-y-3">
                  {[t.featureFinanceBullet1, t.featureFinanceBullet2, t.featureFinanceBullet3].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-amber-600" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20 landing-reveal">
              <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-xs sm:text-sm font-bold border border-indigo-100/50 mb-4 sm:mb-5">
                {t.howTag}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">{t.howTitle}</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 relative">
              {/* Animated connector */}
              <div className="hidden md:block absolute top-12 left-[22%] right-[22%] h-1 step-connector rounded-full" />

              {[
                { icon: Users, title: t.howStep1Title, desc: t.howStep1Desc, num: '1', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
                { icon: Target, title: t.howStep2Title, desc: t.howStep2Desc, num: '2', gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-200' },
                { icon: TrendingUp, title: t.howStep3Title, desc: t.howStep3Desc, num: '3', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-200' },
              ].map((step, i) => (
                <div key={step.num} className={`landing-reveal landing-reveal-delay-${i + 1} text-center relative`}>
                  <div className={clsx(
                    'w-[72px] h-[72px] rounded-2xl mx-auto mb-7 flex items-center justify-center relative z-10 shadow-lg bg-gradient-to-br',
                    step.gradient, step.shadow,
                  )}>
                    <step.icon className="w-8 h-8 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-md border border-gray-100">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 relative overflow-hidden">
          <div className="parallax-layer mesh-blob-2 absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-blue-100/40 via-indigo-100/30 to-purple-100/40 rounded-full blur-3xl -z-10" data-depth="1" />

          <div className="max-w-3xl mx-auto text-center landing-reveal px-2 sm:px-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">{t.ctaTitle}</h2>
            <p className="text-base sm:text-lg text-gray-500 mb-8 sm:mb-12 font-medium">{t.ctaSubtitle}</p>
            <div className="magnetic-btn inline-flex w-full sm:w-auto">
              <button
                onClick={goRegister}
                className="landing-btn-primary landing-btn-glow group w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-lg sm:text-xl font-bold rounded-2xl inline-flex items-center justify-center gap-2 sm:gap-3"
              >
                {t.ctaButton}
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-4 sm:mt-6 flex items-center justify-center gap-2 font-medium">
              <Shield className="w-4 h-4" />
              {t.ctaNoCard}
            </p>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-gray-950 text-gray-400 py-10 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-extrabold text-white">LifePilot</span>
                </div>
                <p className="text-sm leading-relaxed">{t.footerDesc}</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{t.footerProduct}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors duration-200">{t.navFeatures}</a></li>
                  <li><a href="#how" className="hover:text-white transition-colors duration-200">{t.navAbout}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{t.footerCompany}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/about" className="hover:text-white transition-colors duration-200">{t.footerAbout}</a></li>
                  <li><a href="mailto:iamfakhriddin@gmail.com" className="hover:text-white transition-colors duration-200">{t.footerContact}</a></li>
                  <li><a href="https://t.me/lifepilot_uz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">Telegram</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{t.footerLegal}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/legal/privacy" className="hover:text-white transition-colors duration-200">{t.footerPrivacy}</a></li>
                  <li><a href="/legal/terms" className="hover:text-white transition-colors duration-200">{t.footerTerms}</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              &copy; {new Date().getFullYear()} LifePilot. {t.footerRights}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
