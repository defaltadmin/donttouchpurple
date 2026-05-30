'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface GlassOrbProps {
  children?: React.ReactNode;
  size?: number;
  className?: string;
  float?: boolean;
}

export function GlassOrb({ children, size = 200, className = '', float = true }: GlassOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!float || !orbRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const el = orbRef.current;
    gsap.to(el, {
      y: -8,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    return () => { gsap.killTweensOf(el); };
  }, [float]);

  return (
    <div
      ref={orbRef}
      className={`glass-orb ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Highlight reflection */}
      <div className="glass-orb-highlight" />
      {children}
    </div>
  );
}
