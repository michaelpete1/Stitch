'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function BrandIntro({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => setVisible(false), reducedMotion ? 250 : 1_750);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      <div className="app-content" inert={visible}>
        {children}
      </div>
      {visible && (
        <div className="brand-intro" role="status" aria-label="Stitch is opening">
          <div className="brand-intro-glow brand-intro-glow-one" />
          <div className="brand-intro-glow brand-intro-glow-two" />
          <div className="brand-intro-lockup">
            <div className="brand-intro-mark-wrap">
              <span className="brand-intro-orbit" />
              <Image className="brand-intro-mark" src="/stitch-mark.png" alt="" width={112} height={112} priority />
            </div>
            <span className="brand-intro-name">Stitch</span>
            <span className="brand-intro-caption">A little more clarity, every day</span>
          </div>
          <div className="brand-intro-progress" aria-hidden="true"><span /></div>
        </div>
      )}
    </>
  );
}
