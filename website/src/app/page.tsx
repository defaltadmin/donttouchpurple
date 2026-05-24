'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

const PLAY_URL = 'https://donttouchpurple.pages.dev';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 3 + Math.random() * 5,
  color: ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'][Math.floor(Math.random() * 4)],
}));

const CELLS = [
  { color: '#4488ff', label: 'Shield', delay: 0.2 },
  { color: '#f9bd22', label: '2x', delay: 0.4 },
  { color: '#44ddff', label: 'Freeze', delay: 0.6 },
  { color: '#ff4444', label: 'Bomb', delay: 0.8 },
  { color: '#44ff88', label: 'Slide', delay: 1.0 },
  { color: '#ff44aa', label: 'Portal', delay: 1.2 },
];

export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title entrance
      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'back.out(1.4)',
      });

      // Subtitle
      gsap.from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: 'power2.out',
      });

      // Play button
      gsap.from(btnRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        delay: 0.6,
        ease: 'back.out(2)',
      });

      // Cell previews stagger
      cellsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          scale: 0,
          rotation: -15 + Math.random() * 30,
          opacity: 0,
          duration: 0.5,
          delay: 0.8 + i * 0.1,
          ease: 'back.out(2.5)',
        });
        // Float animation
        gsap.to(el, {
          y: -8,
          duration: 2 + Math.random() * 2,
          delay: 1.5 + i * 0.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      // Features fade in
      if (featuresRef.current) {
        gsap.from(featuresRef.current.children, {
          y: 20,
          opacity: 0,
          duration: 0.5,
          delay: 1.4,
          stagger: 0.1,
          ease: 'power2.out',
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="h-screen w-screen bg-mesh grid-lines relative flex flex-col items-center justify-center overflow-hidden">
      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}

      {/* Cell previews floating around */}
      <div className="absolute inset-0 pointer-events-none">
        {CELLS.map((cell, i) => (
          <div
            key={cell.label}
            ref={(el) => { cellsRef.current[i] = el; }}
            className="absolute"
            style={{
              left: `${15 + (i % 3) * 30}%`,
              top: `${20 + Math.floor(i / 3) * 45}%`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white/90"
              style={{
                background: `linear-gradient(135deg, ${cell.color}, ${cell.color}88)`,
                boxShadow: `0 0 20px ${cell.color}40, 0 4px 0 ${cell.color}60`,
              }}
            >
              {cell.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Logo / Title */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-7xl font-black tracking-tight mb-2"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          <span className="text-foreground">Don&apos;t Touch</span>
          <br />
          <span className="glow-text text-primary">Purple</span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-base sm:text-lg text-foreground/60 mb-8 max-w-sm"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Tap every color. Avoid purple. Survive the boss.
        </p>

        {/* Play button */}
        <Link
          href={PLAY_URL}
          ref={btnRef}
          className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center play-btn"
          style={{
            background: 'linear-gradient(135deg, #fda9ff, #c026d3)',
            boxShadow: '0 0 30px rgba(253, 169, 255, 0.4), 0 8px 0 #a400b7',
          }}
        >
          <div className="absolute inset-0 rounded-full shimmer overflow-hidden" />
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1 group-hover:scale-110 transition-transform"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </Link>

        {/* Features */}
        <div
          ref={featuresRef}
          className="mt-10 flex flex-wrap justify-center gap-3 text-xs"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          {['Boss Events', '12 Cell Types', '37 Achievements', 'Daily Challenge'].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 rounded-full border border-outline-variant/40 text-foreground/50 bg-surface-container/50 backdrop-blur-sm"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-foreground/30">
          Free. No ads. No accounts. Just tap.
        </p>
      </div>
    </div>
  );
}
