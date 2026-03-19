import { useEffect, useRef, useCallback } from 'react';

interface Vec2 { x: number; y: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Проверяет, мобильное ли устройство или prefers-reduced-motion. */
function shouldDisable(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return true;
  if (window.innerWidth < 768) return true;
  return false;
}

/**
 * Spotlight / Glow эффект — мягкое свечение следует за курсором.
 * Создаёт radial-gradient overlay, подсвечивающий контент под мышкой.
 */
export function useSpotlight() {
  const mouseRef = useRef<Vec2>({ x: 0, y: 0 });
  const currentRef = useRef<Vec2>({ x: 0, y: 0 });
  const spotRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (shouldDisable()) return;

    // Create spotlight element
    const spot = document.createElement('div');
    spot.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9998; opacity: 0;
      transition: opacity 0.3s;
      background: radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%),
        rgba(99, 102, 241, 0.06) 0%, rgba(59, 130, 246, 0.03) 25%, transparent 60%);
    `;
    document.body.appendChild(spot);
    spotRef.current = spot;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      spot.style.opacity = '1';
    };

    const onMouseLeave = () => {
      spot.style.opacity = '0';
    };

    const animate = () => {
      currentRef.current.x = lerp(currentRef.current.x, mouseRef.current.x, 0.08);
      currentRef.current.y = lerp(currentRef.current.y, mouseRef.current.y, 0.08);
      spot.style.setProperty('--spot-x', `${currentRef.current.x}px`);
      spot.style.setProperty('--spot-y', `${currentRef.current.y}px`);
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
      spot.remove();
    };
  }, []);
}

/**
 * 3D Parallax Tilt для карточек.
 * Карточка поворачивается в сторону курсора (max ±10°) + блик.
 */
export function useCardTilt() {
  useEffect(() => {
    if (shouldDisable()) return;

    const cards = document.querySelectorAll<HTMLElement>('.tilt-card');
    if (!cards.length) return;

    const handlers = new Map<HTMLElement, { move: (e: MouseEvent) => void; leave: () => void }>();

    cards.forEach((card) => {
      // Create glare element
      const glare = document.createElement('div');
      glare.style.cssText = `
        position: absolute; inset: 0; border-radius: inherit;
        pointer-events: none; opacity: 0; z-index: 2;
        background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%),
          rgba(255, 255, 255, 0.15) 0%, transparent 60%);
        transition: opacity 0.3s;
      `;
      card.style.position = 'relative';
      card.style.overflow = 'hidden';
      card.appendChild(glare);

      const move = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * -10; // ±5°
        const rotateY = (x - 0.5) * 10;  // ±5°

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        card.style.transition = 'transform 0.1s ease-out';

        glare.style.setProperty('--glare-x', `${x * 100}%`);
        glare.style.setProperty('--glare-y', `${y * 100}%`);
        glare.style.opacity = '1';
      };

      const leave = () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        glare.style.opacity = '0';
      };

      card.addEventListener('mousemove', move, { passive: true });
      card.addEventListener('mouseleave', leave);
      handlers.set(card, { move, leave });
    });

    return () => {
      handlers.forEach(({ move, leave }, card) => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
        // Remove glare elements
        const glare = card.querySelector('div[style*="--glare"]');
        glare?.remove();
      });
    };
  }, []);
}

/**
 * Magnetic effect для CTA кнопок.
 * Когда курсор в радиусе 120px, кнопка притягивается на 6-8px.
 */
export function useMagnetic() {
  useEffect(() => {
    if (shouldDisable()) return;

    const buttons = document.querySelectorAll<HTMLElement>('.magnetic-btn');
    if (!buttons.length) return;

    const RADIUS = 120;
    const STRENGTH = 8;

    const onMouseMove = (e: MouseEvent) => {
      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const pull = (1 - dist / RADIUS) * STRENGTH;
          const moveX = (dx / dist) * pull;
          const moveY = (dy / dist) * pull;
          btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
          btn.style.transition = 'transform 0.15s ease-out';
        } else {
          btn.style.transform = 'translate(0, 0)';
          btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        }
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);
}

/**
 * Hero parallax — фоновые элементы сдвигаются в противоположную сторону от курсора.
 */
export function useHeroParallax() {
  const mouseRef = useRef<Vec2>({ x: 0, y: 0 });
  const currentRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (shouldDisable()) return;

    const layers = document.querySelectorAll<HTMLElement>('.parallax-layer');
    if (!layers.length) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const animate = () => {
      currentRef.current.x = lerp(currentRef.current.x, mouseRef.current.x, 0.04);
      currentRef.current.y = lerp(currentRef.current.y, mouseRef.current.y, 0.04);

      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth || '1');
        const moveX = currentRef.current.x * depth * -20;
        const moveY = currentRef.current.y * depth * -15;
        layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
