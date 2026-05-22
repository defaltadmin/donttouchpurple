// components/Screens/BounceCards.tsx — Animated card fan (adapted from React Bits)
import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';

interface BounceCardsProps {
  cards: ReactNode[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  transformStyles?: string[];
  enableHover?: boolean;
  className?: string;
}

export function BounceCards({
  cards,
  containerWidth = 400,
  containerHeight = 300,
  animationDelay = 0.3,
  animationStagger = 0.06,
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ],
  enableHover = true,
  className = '',
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bounce-card',
        { scale: 0 },
        { scale: 1, stagger: animationStagger, ease: 'elastic.out(1, 0.8)', delay: animationDelay },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [animationStagger, animationDelay]);

  const getNoRotationTransform = (t: string) => t.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');

  const getPushedTransform = (base: string, offsetX: number) => {
    const match = base.match(/translate\(([-0-9.]+)px\)/);
    if (match) {
      const newX = parseFloat(match[1]) + offsetX;
      return base.replace(/translate\([\s\S]*?\)/, `translate(${newX}px)`);
    }
    return `${base} translate(${offsetX}px)`;
  };

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    cards.forEach((_, i) => {
      const target = q(`.bounce-card-${i}`);
      gsap.killTweensOf(target);
      const base = transformStyles[i] || 'none';
      if (i === hoveredIdx) {
        gsap.to(target, { transform: getNoRotationTransform(base), duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
      } else {
        const offsetX = i < hoveredIdx ? -160 : 160;
        gsap.to(target, { transform: getPushedTransform(base, offsetX), duration: 0.4, ease: 'back.out(1.4)', delay: Math.abs(hoveredIdx - i) * 0.05, overwrite: 'auto' });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    cards.forEach((_, i) => {
      const target = q(`.bounce-card-${i}`);
      gsap.killTweensOf(target);
      gsap.to(target, { transform: transformStyles[i] || 'none', duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
    });
  };

  return (
    <div
      ref={containerRef}
      className={`bounce-cards-container ${className}`}
      style={{ position: 'relative', width: containerWidth, height: containerHeight }}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bounce-card bounce-card-${idx}`}
          style={{ transform: transformStyles[idx] ?? 'none', position: 'absolute', top: '50%', left: '50%', marginLeft: -60, marginTop: -80 }}
          onMouseEnter={() => pushSiblings(idx)}
          onMouseLeave={resetSiblings}
        >
          {card}
        </div>
      ))}
    </div>
  );
}
