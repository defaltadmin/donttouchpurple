'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { GlassOrb } from './GlassOrb';
import { CrescentRing } from './CrescentRing';

interface HeroStageProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  orbContent?: React.ReactNode;
  orbSize?: number;
  className?: string;
}

export function HeroStage({
  badge,
  title,
  subtitle,
  children,
  orbContent,
  orbSize = 200,
  className = '',
}: HeroStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (badgeRef.current) tl.from(badgeRef.current, { y: -20, opacity: 0, duration: 0.6 }, 0);
    if (titleRef.current) tl.from(titleRef.current, { y: 30, opacity: 0, duration: 0.8 }, 0.15);
    if (subRef.current) tl.from(subRef.current, { y: 20, opacity: 0, duration: 0.6 }, 0.4);

    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={stageRef} className={`hero-stage ${className}`}>
      {badge && (
        <div ref={badgeRef} className="hero-badge">
          {badge}
        </div>
      )}
      <h1 ref={titleRef} className="hero-stage-title">
        {title}
      </h1>
      {subtitle && (
        <p ref={subRef} className="hero-stage-subtitle">
          {subtitle}
        </p>
      )}

      {children}

      <div className="hero-crescent-area">
        <CrescentRing />
        <GlassOrb size={orbSize} className="hero-orb">
          {orbContent}
        </GlassOrb>
      </div>
    </div>
  );
}
