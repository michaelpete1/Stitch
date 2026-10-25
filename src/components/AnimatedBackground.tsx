'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export interface AnimatedBackgroundProps {
  /** CSS color used for the ambient glow. */
  color?: string;
  /** Duration of one drift cycle, in seconds. */
  speed?: number;
  /** Glow opacity from 0 (off) to 1 (full). */
  intensity?: number;
}

type BackgroundStyle = CSSProperties & {
  '--animated-bg-accent': string;
  '--animated-bg-speed': string;
  '--animated-bg-intensity': number;
};

export default function AnimatedBackground({
  color = '#6D5EF5',
  speed = 48,
  intensity = 0.72,
}: AnimatedBackgroundProps) {
  const [paused, setPaused] = useState(false);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia(
      '(max-width: 640px), (pointer: coarse) and (max-width: 900px)',
    );

    const nav = navigator as Navigator & {
      deviceMemory?: number;
    };

    const lowPower =
      (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) ||
      (typeof nav.hardwareConcurrency === 'number' &&
        nav.hardwareConcurrency <= 4);

    const updateStaticMode = () => {
      setStaticMode(
        reducedMotion.matches || smallScreen.matches || lowPower,
      );
    };

    const updateVisibility = () => {
      setPaused(document.visibilityState !== 'visible');
    };

    updateStaticMode();
    updateVisibility();

    reducedMotion.addEventListener?.('change', updateStaticMode);
    smallScreen.addEventListener?.('change', updateStaticMode);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      reducedMotion.removeEventListener?.('change', updateStaticMode);
      smallScreen.removeEventListener?.('change', updateStaticMode);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const safeSpeed = Number.isFinite(speed)
    ? Math.min(120, Math.max(24, speed))
    : 48;
  const safeIntensity = Number.isFinite(intensity)
    ? Math.min(1, Math.max(0, intensity))
    : 0.72;

  const style: BackgroundStyle = {
    '--animated-bg-accent': color,
    '--animated-bg-speed': `${safeSpeed}s`,
    '--animated-bg-intensity': safeIntensity,
  };

  return (
    <div
      className="animated-background"
      data-paused={paused ? 'true' : 'false'}
      data-static={staticMode ? 'true' : 'false'}
      style={style}
      aria-hidden="true"
    >
      <div className="animated-background__glow animated-background__glow--primary" />
      <div className="animated-background__glow animated-background__glow--secondary" />
      <div className="animated-background__veil" />
    </div>
  );
}
