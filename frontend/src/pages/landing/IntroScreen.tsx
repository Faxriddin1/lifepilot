import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

/**
 * Intro / Splash Screen — логотип-reveal с clip-path circle transition.
 * Показывается только при первом визите (sessionStorage).
 * Длительность: ~2.5 секунды, кнопка "Пропустить" в углу.
 */
export function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'reveal' | 'done'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('reveal'), 1800);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const skip = () => {
    setPhase('done');
    onComplete();
  };

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #4f46e5 100%)',
        clipPath: phase === 'reveal' ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
        transition: phase === 'reveal' ? 'clip-path 0.8s cubic-bezier(0.77, 0, 0.175, 1)' : 'none',
        pointerEvents: phase === 'reveal' ? 'none' : 'auto',
      }}
    >
      {/* Skip button */}
      <button
        onClick={skip}
        className="absolute top-6 right-6 text-white/40 text-xs font-medium hover:text-white/70 transition-colors z-10"
      >
        Skip →
      </button>

      <div className="text-center">
        {/* Logo icon */}
        <div
          className="mx-auto mb-6"
          style={{
            opacity: phase === 'logo' || phase === 'text' ? 1 : 0,
            transform: phase === 'logo' ? 'scale(0.5) rotate(-180deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl mx-auto">
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
        </div>

        {/* Brand name — letter by letter */}
        <div
          className="overflow-hidden"
          style={{
            opacity: phase !== 'logo' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
            {'LifePilot'.split('').map((char, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  opacity: phase !== 'logo' ? 1 : 0,
                  transform: phase !== 'logo' ? 'translateY(0) rotate(0deg)' : 'translateY(40px) rotate(10deg)',
                  transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms`,
                }}
              >
                {char}
              </span>
            ))}
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="text-white/50 text-sm sm:text-lg font-medium mt-3 sm:mt-4 tracking-wide px-4"
          style={{
            opacity: phase === 'text' ? 1 : 0,
            transform: phase === 'text' ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          }}
        >
          Your Life. Your Goals. One Platform.
        </p>

        {/* Loading dots */}
        <div className="flex gap-1.5 justify-center mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/30"
              style={{
                animation: 'intro-dot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes intro-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
