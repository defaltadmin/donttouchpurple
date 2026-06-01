# MSCArabia.com Security & Correctness Review — v1.0

**Project**: MSCArabia.com — corporate landing page for MSC Arabia / Don't Touch Purple
**Stack**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, OGL/WebGL, GSAP
**Date**: 2026-06-01
**Reviewer**: DeepSeek

## Review Focus

This review focuses on **security and correctness** for the corporate website. Evaluate:

1. **WebGL Canvas Safety** — Is the OGL canvas safe? Context loss handlers? GPU memory management?
2. **OGL Setup Correctness** — Memory leaks? Proper cleanup? Geometry/program disposal?
3. **SSR/Hydration Mismatches** — Any client/server state divergence? `'use client'` boundaries?
4. **Client-Side Data Leaks** — Any sensitive data in client bundles? Exposed API keys?
5. **Animation Performance** — RAF loops, GSAP timers, IntersectionObserver cleanup? Battery drain?
6. **DOM Manipulation Safety** — `querySelector` in effects? Stale refs? Race conditions?
7. **Event Listener Leaks** — Proper cleanup in useEffect returns?
8. **CSS Injection** — User-controllable CSS custom properties? `style.setProperty` with user data?
9. **Build Configuration** — Source maps in production? Dependency pinning? Override gaps?
10. **Third-Party Dependencies** — OGL, GSAP attack surface? Version pinning?

For each finding:
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: Security/Correctness/Performance/Leak
- **File + Line**: exact location
- **Description**: what's wrong
- **Exploit Scenario**: how this could be triggered in production
- **Fix**: specific code change

---

## File: website/package.json (39 lines)

```json
{
  "name": "website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "cd .. && pnpm install --frozen-lockfile && pnpm build && cd website && rm -rf out && cp -r ../dist out",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "gsap": "^3.15.0",
    "next": "16.2.6",
    "ogl": "^1.0.11",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@cloudflare/next-on-pages": "^1.13.16",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "tailwindcss": "^4",
    "typescript": "^5",
    "wrangler": "^4.94.0"
  },
  "pnpm": {
    "overrides": {
      "undici": ">=6.24.0",
      "esbuild": ">=0.25.0",
      "postcss": ">=8.5.10",
      "ws": ">=8.20.1",
      "cookie": ">=0.7.0"
    }
  }
}
```

---

## File: website/tsconfig.json (34 lines)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

---

## File: website/next.config.ts (10 lines)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

---

## File: website/postcss.config.mjs (7 lines)

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## File: website/src/app/layout.tsx (62 lines)

```typescript
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "Don't Touch Purple - Free Reflex Game",
  description:
    'Tap every color. Avoid purple. Survive the boss. A free reflex game with boss events, 12 special cell types, and daily challenges.',
  keywords: [
    'reflex game',
    'reaction time',
    'grid tapping',
    'boss events',
    'daily challenge',
    'free game',
    'browser game',
  ],
  openGraph: {
    title: "Don't Touch Purple",
    description: 'Tap every color. Avoid purple. Survive the boss.',
    url: 'https://game.mscarabia.com',
    siteName: "Don't Touch Purple",
    type: 'website',
    images: [{ url: 'https://game.mscarabia.com/og.png', width: 1200, height: 630, alt: "Don't Touch Purple" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Don't Touch Purple",
    description: 'Tap every color. Avoid purple. Survive the boss.',
    images: ['https://game.mscarabia.com/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

---

## File: website/src/app/page.tsx (421 lines)

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { GlassOrb } from '@/components/GlassOrb';
import { CrescentRing } from '@/components/CrescentRing';
import { NebulaCanvas } from '@/components/NebulaCanvas';

const PLAY_URL = '/play';
const GITHUB_URL = 'https://github.com/defaltadmin/donttouchpurple';

const GRID_SIZE = 4;
const COLORS = {
  safe: ['#4488ff', '#44ddff', '#f9bd22', '#44ff88', '#ff44aa', '#8844ff', '#ff8844', '#44aaff'],
  purple: '#9b59b6',
  bomb: '#ff4444',
  shield: '#4488ff',
  freeze: '#44ddff',
  multiplier: '#f9bd22',
};

interface Cell {
  id: number;
  color: string;
  type: 'safe' | 'purple' | 'special';
  label?: string;
}

function randomCell(id: number): Cell {
  const r = Math.random();
  if (r < 0.25) {
    return { id, color: COLORS.purple, type: 'purple' };
  } else if (r < 0.35) {
    const specials = [
      { color: COLORS.bomb, label: '!' },
      { color: COLORS.shield, label: '+' },
      { color: COLORS.freeze, label: '~' },
      { color: COLORS.multiplier, label: 'x' },
    ];
    const s = specials[Math.floor(Math.random() * specials.length)];
    return { id, color: s.color, type: 'special', label: s.label };
  }
  return {
    id,
    color: COLORS.safe[Math.floor(Math.random() * COLORS.safe.length)],
    type: 'safe',
  };
}

// Deterministic initial cards to avoid SSR/client hydration mismatch
const INITIAL_CARDS: Cell[] = [
  ...COLORS.safe.map((c, i) => ({ id: i, color: c, type: 'safe' as const })),
  { id: 8, color: COLORS.purple, type: 'purple' as const },
  ...COLORS.safe.slice(0, 7).map((c, i) => ({ id: i + 9, color: c, type: 'safe' as const })),
];

const BOSS_EVENTS = [
  {
    icon: '\u26A1',
    name: 'Storm',
    desc: 'Cells shuffle at lightning speed. Your muscle memory betrays you.',
    gradient: 'linear-gradient(135deg, #7c3aed, #dc2626)',
    glow: 'rgba(124,58,237,0.3)',
  },
  {
    icon: '\uD83D\uDD04',
    name: 'Inversion',
    desc: 'Safe and danger colors swap. Everything you learned is now wrong.',
    gradient: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    icon: '\uD83C\uDF11',
    name: 'Blackout',
    desc: 'The grid goes completely dark. You tap from memory alone.',
    gradient: 'linear-gradient(135deg, #1e1b4b, #000)',
    glow: 'rgba(30,27,75,0.3)',
  },
];

const FEATURES = [
  { icon: '\uD83C\uDFAE', title: 'Two Game Modes', desc: 'Classic for quick reflex training. Evolve for progressive difficulty with expanding grids.' },
  { icon: '\uD83C\uDFC6', title: '37 Achievements', desc: 'Unlock badges and earn dust currency as you master increasingly brutal challenges.' },
  { icon: '\u2728', title: '12 Animated Backgrounds', desc: 'GPU-accelerated WebGL effects \u2014 nebula, aurora, digital rain, and more.' },
  { icon: '\uD83E\uDD16', title: 'AI Bot Assist', desc: 'Activate a companion bot that costs dust to help you survive. Or play solo.' },
  { icon: '\uD83D\uDCC5', title: 'Daily Challenges', desc: 'New objectives every day. Compete on the global leaderboard.' },
  { icon: '\uD83D\uDCF1', title: 'Installable PWA', desc: 'Works on any device. Install as an app. Gamepad support included.' },
];

export default function Home() {
  const gridRef = useRef<Cell[]>(INITIAL_CARDS);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const gridElRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for glass orb
  const orbContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = orbContainerRef.current;
    if (!container) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      const orb = container.querySelector('.glass-orb') as HTMLElement;
      if (orb) {
        orb.style.transform = `translate(${x}px, ${y}px)`;
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Entrance animations
  useEffect(() => {
    const tl = gsap.timeline();
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      tl.fromTo(`.cell-${i}`,
        { scale: 0, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.25, ease: 'back.out(2.5)' },
        i * 0.04
      );
    }
    tl.from(titleRef.current, { y: -40, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0);
    tl.from(btnRef.current, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(3)' }, 0.6);
  }, []);

  // Scroll-triggered animations
  useEffect(() => {
    const sectionEls = document.querySelectorAll('.scroll-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from(entry.target, { y: 40, opacity: 0, duration: 0.6, ease: 'power2.out' });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Cursor glow for glass cards
  useEffect(() => {
    const cards = document.querySelectorAll('.glass-card');
    const handleMove = (e: MouseEvent) => {
      const card = (e.currentTarget as HTMLElement);
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    cards.forEach((card) => {
      card.addEventListener('mousemove', handleMove as EventListener, { passive: true });
    });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', handleMove as EventListener);
      });
    };
  }, []);

  // Bot gameplay loop -- taps cells automatically, loops forever
  useEffect(() => {
    const interval = setInterval(() => {
      const current = gridRef.current;
      // Pick a random cell to tap
      const idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      const cell = current[idx];
      if (!cell) return;

      if (cell.type === 'purple') {
        // Bot accidentally taps purple -- shake and replace
        gsap.to(`.cell-${idx}`, {
          scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut',
          onComplete: () => {
            const newCell = randomCell(idx);
            gridRef.current = gridRef.current.map((c, i) => i === idx ? newCell : c) as Cell[];
            const el = document.querySelector(`.cell-${idx}`) as HTMLElement;
            if (el) {
              el.style.background = `linear-gradient(135deg, ${newCell.color}, ${newCell.color}cc)`;
              el.style.boxShadow = newCell.type === 'purple'
                ? `0 0 15px ${newCell.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : `0 0 12px ${newCell.color}30, 0 4px 0 ${newCell.color}50`;
              el.style.border = newCell.type === 'purple'
                ? '2px solid rgba(255,255,255,0.15)'
                : '2px solid rgba(255,255,255,0.08)';
              const labelEl = el.querySelector('.cell-label, .cell-x') as HTMLElement;
              if (labelEl) labelEl.textContent = newCell.label || (newCell.type === 'purple' ? 'X' : '');
            }
          }
        });
      } else {
        // Bot taps a safe/special cell -- shrink out, replace, pop in
        gsap.to(`.cell-${idx}`, {
          scale: 0, rotation: 10, duration: 0.2, ease: 'power2.in',
          onComplete: () => {
            const newCell = randomCell(idx);
            gridRef.current = gridRef.current.map((c, i) => i === idx ? newCell : c) as Cell[];
            const el = document.querySelector(`.cell-${idx}`) as HTMLElement;
            if (el) {
              el.style.background = `linear-gradient(135deg, ${newCell.color}, ${newCell.color}cc)`;
              el.style.boxShadow = newCell.type === 'purple'
                ? `0 0 15px ${newCell.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : `0 0 12px ${newCell.color}30, 0 4px 0 ${newCell.color}50`;
              el.style.border = newCell.type === 'purple'
                ? '2px solid rgba(255,255,255,0.15)'
                : '2px solid rgba(255,255,255,0.08)';
              const labelEl = el.querySelector('.cell-label, .cell-x') as HTMLElement;
              if (labelEl) labelEl.textContent = newCell.label || (newCell.type === 'purple' ? 'X' : '');
            }
            gsap.fromTo(`.cell-${idx}`,
              { scale: 0, rotation: -10 },
              { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(3)' }
            );
          }
        });
      }

      // Also auto-replace 1-3 random cells to keep the grid changing
      const replaceCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < replaceCount; i++) {
        const rIdx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
        if (rIdx === idx) continue;
        const newCell = randomCell(rIdx);
        gridRef.current = gridRef.current.map((c, j) => j === rIdx ? newCell : c) as Cell[];
        gsap.to(`.cell-${rIdx}`, {
          scale: 1, duration: 0.3, ease: 'back.out(2.5)', delay: Math.random() * 0.1,
          onComplete: () => {
            const el = document.querySelector(`.cell-${rIdx}`) as HTMLElement;
            if (el) {
              el.style.background = `linear-gradient(135deg, ${newCell.color}, ${newCell.color}cc)`;
              el.style.boxShadow = newCell.type === 'purple'
                ? `0 0 15px ${newCell.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : `0 0 12px ${newCell.color}30, 0 4px 0 ${newCell.color}50`;
              el.style.border = newCell.type === 'purple'
                ? '2px solid rgba(255,255,255,0.15)'
                : '2px solid rgba(255,255,255,0.08)';
              const labelEl = el.querySelector('.cell-label, .cell-x') as HTMLElement;
              if (labelEl) labelEl.textContent = newCell.label || (newCell.type === 'purple' ? 'X' : '');
            }
          }
        });
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div ref={containerRef} className="landing-page">
      <main>

        {/* -- Hero with Glassmorphic Crescent + Orb -- */}
        <section className="hero">
          <div className="hero-bg" style={{ background: '#000' }}>
            {/* WebGL nebula background */}
            <NebulaCanvas />

            {/* Subtle grid lines */}
            <div className="hero-grid-lines" />

            {/* Glassmorphic hero composition */}
            <h1 ref={titleRef} className="hero-stage-title">
              Don&apos;t Touch <span style={{ color: '#fda9ff', textShadow: '0 0 30px rgba(253,169,255,0.5)' }}>Purple</span>
            </h1>

            <p className="hero-stage-subtitle">Tap fast. Survive longer. Free forever.</p>

            {/* Game grid -- bot plays automatically */}
            <div
              ref={gridElRef}
              className="game-grid"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                zIndex: 10,
                position: 'relative',
              }}
            >
              {INITIAL_CARDS.map((cell, i) => (
                <div
                  key={i}
                  className={`game-cell cell-${i}`}
                  style={{
                    background: `linear-gradient(135deg, ${cell.color}, ${cell.color}cc)`,
                    boxShadow: cell.type === 'purple'
                      ? `0 0 15px ${cell.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                      : `0 0 12px ${cell.color}30, 0 4px 0 ${cell.color}50`,
                    border: cell.type === 'purple'
                      ? '2px solid rgba(255,255,255,0.15)'
                      : '2px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {cell.label && <span className="cell-label">{cell.label}</span>}
                  {cell.type === 'purple' && <span className="cell-x">X</span>}
                </div>
              ))}
            </div>

            {/* Play button */}
            <a ref={btnRef} href={PLAY_URL} className="play-btn" style={{ zIndex: 10, position: 'relative' }}>
              <svg className="play-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              PLAY
              <div className="play-shimmer" />
            </a>

            {/* Crescent + Orb at the bottom */}
            <div ref={orbContainerRef} className="hero-crescent-area">
              <CrescentRing />
              <GlassOrb size={180}>
                <span style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '1.3rem',
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}>DTP</span>
              </GlassOrb>
            </div>

            {/* Scroll indicator */}
            <div className="scroll-indicator">
              <span className="scroll-chevron">&#8964;</span>
            </div>
          </div>
        </section>

        {/* -- Boss Events -- */}
        <section className="scroll-section section-boss">
          <h2 className="section-heading">Boss Events</h2>
          <p className="section-subtext">Just when you think you&apos;ve got it figured out, the rules change.</p>
          <div className="boss-cards">
            {BOSS_EVENTS.map((boss) => (
              <div key={boss.name} className="glass-card boss-card" style={{ '--boss-glow': boss.glow } as React.CSSProperties}>
                <div className="boss-card-icon">{boss.icon}</div>
                <div className="boss-card-name" style={{ background: boss.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {boss.name}
                </div>
                <p className="boss-card-desc">{boss.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -- Features -- */}
        <section className="scroll-section section-features">
          <h2 className="section-heading">Everything You Get</h2>
          <p className="section-subtext">More depth than you&apos;d expect from a &quot;don&apos;t touch the color&quot; game.</p>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -- Open Source / Tech -- */}
        <section className="scroll-section section-tech">
          <h2 className="section-heading">Open Source</h2>
          <p className="section-subtext">
            Built with React 19, TypeScript, Vite, and WebGL. Fully transparent.
          </p>
          <div className="tech-badges">
            <span className="tech-badge">React 19</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">WebGL</span>
            <span className="tech-badge">Firebase</span>
          </div>
          <div className="tech-stats">
            <div className="tech-stat">
              <span className="stat-number">232</span>
              <span className="stat-label">Tests</span>
            </div>
            <div className="tech-stat">
              <span className="stat-number">MIT</span>
              <span className="stat-label">License</span>
            </div>
            <div className="tech-stat">
              <span className="stat-number">5</span>
              <span className="stat-label">Languages</span>
            </div>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="github-link">
            <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </section>

        {/* -- Final CTA -- */}
        <section className="scroll-section section-cta">
          <h2 className="cta-heading">Ready?</h2>
          <p className="cta-subtext">No signup. No ads. Just tap.</p>
          <a href={PLAY_URL} className="play-btn play-btn-large">
            <svg className="play-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            PLAY NOW
            <div className="play-shimmer" />
          </a>
        </section>
        </main>

        <footer className="landing-footer">
          <span>&copy; {new Date().getFullYear()} Don&apos;t Touch Purple &middot; Open Source (MIT)</span>
        </footer>
      </div>
    </>
  );
}
```

---

## File: website/src/app/globals.css (768 lines)

```css
@import "tailwindcss";

@theme inline {
  --color-surface: #151028;
  --color-surface-dim: #0f0a22;
  --color-surface-container: #211c35;
  --color-surface-container-high: #2c2640;
  --color-primary: #fda9ff;
  --color-secondary: #f3aeff;
  --color-tertiary: #f9bd22;
  --color-foreground: #e7deff;
  --color-outline-variant: #524151;
  --color-error: #ffb4ab;
  --font-display: 'Fredoka One', cursive;
  --font-body: 'Nunito', sans-serif;
}

:root {
  --neon-glow: #bf39ff;
  --neon-bright: #e2a3ff;
  --neon-edge: #ff56ff;
  --glass-white-3: rgba(255, 255, 255, 0.03);
  --glass-white-6: rgba(255, 255, 255, 0.06);
  --glass-white-10: rgba(255, 255, 255, 0.1);
  --glass-white-18: rgba(255, 255, 255, 0.18);
  --glass-white-35: rgba(255, 255, 255, 0.35);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

html, body {
  background: #000000;
  color: #e7deff;
  font-family: 'Nunito', sans-serif;
}

/* GLASSMORPHIC COMPONENTS */

.glass-orb {
  position: relative;
  background: radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 60%),
              rgba(255, 255, 255, 0.01);
  border: 1px solid var(--glass-white-18);
  border-top: 1.5px solid var(--glass-white-35);
  border-radius: 50%;
  backdrop-filter: blur(25px) saturate(200%);
  -webkit-backdrop-filter: blur(25px) saturate(200%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0px 30px 60px rgba(0, 0, 0, 0.6),
    inset 0px 2px 4px rgba(255, 255, 255, 0.2),
    inset 0px -10px 20px rgba(191, 57, 255, 0.2);
  z-index: 2;
  overflow: hidden;
}

.glass-orb-highlight {
  position: absolute;
  top: 8%;
  left: 20%;
  width: 60%;
  height: 30%;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.crescent-ring {
  position: absolute;
  bottom: 120px;
  width: 850px;
  height: 400px;
  background: #030307;
  border-bottom: 2px solid var(--neon-bright);
  border-radius: 50%;
  box-shadow:
    inset 0px -15px 40px rgba(191, 57, 255, 0.35),
    inset 0px -4px 12px rgba(226, 163, 255, 0.6),
    0px 20px 80px rgba(191, 57, 255, 0.15);
  z-index: 1;
}

.crescent-backlight {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(191,57,255,0.4) 0%, rgba(0,0,0,0) 70%);
  filter: blur(60px);
  z-index: 0;
}

.hero-stage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #000000;
  border: 1px solid #12121a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 80px;
  overflow: hidden;
}

.hero-badge {
  background: var(--glass-white-6);
  border: 1px solid var(--glass-white-10);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 24px;
  letter-spacing: 0.02em;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.hero-stage-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.15;
  margin: 0 0 16px 0;
  letter-spacing: -0.03em;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #a1a1a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Fredoka One', cursive;
  z-index: 10;
}

.hero-stage-subtitle {
  color: #86868b;
  font-size: 0.95rem;
  max-width: 440px;
  text-align: center;
  line-height: 1.6;
  margin: 0;
  z-index: 10;
}

.hero-crescent-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 500px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  bottom: 20px;
}

.glass-card {
  position: relative;
  overflow: hidden;
  background: rgba(33, 28, 53, 0.5);
  border: 1px solid var(--glass-white-10);
  border-radius: 16px;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s, border-color 0.3s;
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(191,57,255,0.15), transparent 40%, transparent 60%, rgba(255,86,255,0.1));
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  z-index: 0;
}

.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle 350px at var(--mx, 50%) var(--my, 50%), rgba(191,57,255,0.15) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 0;
}

.glass-card:hover::before { opacity: 1; }
.glass-card:hover::after { opacity: 1; }

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 0 40px rgba(191, 57, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.4);
  border-color: rgba(226, 163, 255, 0.25);
}

.landing-page {
  width: 100%;
  min-height: 100vh;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-bg {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px 60px;
  overflow: hidden;
}

.hero-grid-lines {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image:
    linear-gradient(rgba(253,169,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(253,169,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.hero-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  font-family: 'Fredoka One', cursive;
  z-index: 20;
}

.title-dont { color: #e7deff; }

.title-purple {
  color: #fda9ff;
  text-shadow: 0 0 20px rgba(253,169,255,0.5), 0 0 40px rgba(253,169,255,0.2);
}

.game-grid {
  position: relative;
  z-index: 10;
  display: grid;
  gap: 8px;
  width: min(80vw, 300px);
  height: min(80vw, 300px);
}

.game-cell {
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: box-shadow 0.2s;
}

.cell-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 900;
  color: rgba(255,255,255,0.8);
  font-family: 'Fredoka One', cursive;
}

.cell-x {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
}

.play-btn {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 32px;
  border-radius: 999px;
  color: #fff;
  font-weight: 900;
  font-size: 1.1rem;
  font-family: 'Fredoka One', cursive;
  background: linear-gradient(135deg, #fda9ff, #c026d3);
  box-shadow:
    0 0 60px rgba(253,169,255,0.35),
    0 0 120px rgba(192,38,211,0.2),
    0 6px 0 #a400b7,
    0 8px 30px rgba(0,0,0,0.3);
  text-shadow: 0 2px 8px rgba(124,58,237,0.5);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
  animation: play-pulse 2s ease-in-out infinite;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(253,169,255,0.5), 0 8px 0 #a400b7, 0 12px 40px rgba(0,0,0,0.4);
}

.play-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 20px rgba(253,169,255,0.3), 0 2px 0 #a400b7;
}

.play-icon {
  width: 22px;
  height: 22px;
  transition: transform 0.2s;
}

.play-btn:hover .play-icon {
  transform: scale(1.15);
}

.play-shimmer {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  overflow: hidden;
  pointer-events: none;
}

.play-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: shimmer 2.5s ease-in-out infinite;
}

.hero-subtitle {
  position: relative;
  z-index: 20;
  font-size: 0.8rem;
  color: #958a9e;
  text-align: center;
}

.scroll-indicator {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  animation: bounce-down 2s ease-in-out infinite;
  opacity: 0.5;
}

.scroll-chevron {
  font-size: 2rem;
  color: #fda9ff;
}

@keyframes bounce-down {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.5; }
  50% { transform: translateX(-50%) translateY(8px); opacity: 0.8; }
}

.scroll-section {
  max-width: 880px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
}

.section-heading {
  font-family: 'Fredoka One', cursive;
  font-size: 2rem;
  font-weight: 900;
  color: #e7deff;
  margin-bottom: 8px;
}

.section-subtext {
  font-size: 1rem;
  color: #9f8a9d;
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.section-boss { border-top: 1px solid rgba(253,169,255,0.06); }

.boss-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.boss-card {
  background: rgba(33,28,53,0.6);
  border: 1px solid rgba(253,169,255,0.1);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.boss-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px var(--boss-glow, rgba(253,169,255,0.1));
  border-color: rgba(253,169,255,0.2);
}

.boss-card-icon { font-size: 2.5rem; margin-bottom: 12px; }

.boss-card-name {
  font-family: 'Fredoka One', cursive;
  font-size: 1.3rem;
  font-weight: 900;
  margin-bottom: 8px;
}

.boss-card-desc { font-size: 0.85rem; color: #9f8a9d; line-height: 1.5; }

.section-features { border-top: 1px solid rgba(253,169,255,0.06); }

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-card {
  background: rgba(33,28,53,0.4);
  border: 1px solid rgba(253,169,255,0.06);
  border-radius: 14px;
  padding: 24px 16px;
  text-align: left;
  transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover { transform: translateY(-2px); border-color: rgba(253,169,255,0.15); }

.feature-icon { font-size: 1.8rem; margin-bottom: 10px; }

.feature-title {
  font-family: 'Fredoka One', cursive;
  font-size: 1rem;
  font-weight: 700;
  color: #e7deff;
  margin-bottom: 6px;
}

.feature-desc { font-size: 0.8rem; color: #9f8a9d; line-height: 1.5; }

.section-tech { border-top: 1px solid rgba(253,169,255,0.06); }

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.tech-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(33,28,53,0.8);
  border: 1px solid rgba(253,169,255,0.12);
  color: #fda9ff;
  letter-spacing: 0.02em;
}

.tech-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 32px;
}

.tech-stat { display: flex; flex-direction: column; align-items: center; }

.stat-number {
  font-family: 'Fredoka One', cursive;
  font-size: 1.8rem;
  font-weight: 900;
  color: #f9bd22;
  text-shadow: 0 0 10px rgba(249,189,34,0.3);
}

.stat-label { font-size: 0.75rem; color: #9f8a9d; font-weight: 600; }

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #e7deff;
  text-decoration: none;
  background: rgba(33,28,53,0.8);
  border: 1px solid rgba(253,169,255,0.12);
  transition: border-color 0.2s, transform 0.15s;
}

.github-link:hover { border-color: rgba(253,169,255,0.3); transform: translateY(-2px); }

.github-icon { width: 20px; height: 20px; }

.section-cta {
  padding: 100px 24px;
  border-top: 1px solid rgba(253,169,255,0.06);
}

.cta-heading {
  font-family: 'Fredoka One', cursive;
  font-size: 2.5rem;
  font-weight: 900;
  color: #fda9ff;
  text-shadow: 0 0 30px rgba(253,169,255,0.4);
  margin-bottom: 8px;
}

.cta-subtext { font-size: 1rem; color: #9f8a9d; margin-bottom: 32px; }

.play-btn-large { font-size: 1.25rem; padding: 16px 40px; }

.landing-footer {
  text-align: center;
  padding: 24px;
  font-size: 0.75rem;
  color: #958a9e;
  border-top: 1px solid rgba(253,169,255,0.04);
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

@keyframes play-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(253, 169, 255, 0.4), 0 0 30px rgba(253,169,255,0.4), 0 6px 0 #a400b7; }
  50% { box-shadow: 0 0 0 12px rgba(253, 169, 255, 0), 0 0 30px rgba(253,169,255,0.4), 0 6px 0 #a400b7; }
}

@media (max-width: 640px) {
  .hero-title { font-size: 1.6rem; }
  .hero-stage-title { font-size: clamp(1.5rem, 6vw, 2rem); }
  .hero-stage { padding-top: 60px; }
  .game-grid { width: min(85vw, 260px); height: min(85vw, 260px); gap: 6px; }
  .boss-cards { grid-template-columns: 1fr; gap: 12px; }
  .feature-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .feature-card { padding: 18px 12px; }
  .tech-stats { gap: 32px; }
  .stat-number { font-size: 1.4rem; }
  .section-heading { font-size: 1.6rem; }
  .play-btn { padding: 12px 24px; font-size: 1rem; }
  .play-btn-large { font-size: 1.1rem; padding: 14px 32px; }
  .scroll-section { padding: 60px 20px; }
  .crescent-ring { width: 350px; height: 180px; border-radius: 50%; }
  .glass-orb { width: 120px !important; height: 120px !important; }
  .hero-crescent-area { height: 280px; }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .crescent-ring { width: 600px; height: 300px; border-radius: 50%; }
  .glass-orb { width: 160px !important; height: 160px !important; }
  .hero-crescent-area { height: 400px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## File: website/src/components/GlassOrb.tsx (43 lines)

```typescript
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
      <div className="glass-orb-highlight" />
      {children}
    </div>
  );
}
```

---

## File: website/src/components/CrescentRing.tsx (24 lines)

```typescript
'use client';

interface CrescentRingProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CrescentRing({ width = 850, height = 400, className = '' }: CrescentRingProps) {
  return (
    <>
      <div
        className="crescent-backlight"
        style={{ width: width * 0.7, height: height * 0.6 }}
      />
      <div
        className={`crescent-ring ${className}`}
        style={{ width, height }}
      />
    </>
  );
}
```

---

## File: website/src/components/HeroStage.tsx (70 lines)

```typescript
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
```

---

## File: website/src/components/NebulaCanvas.tsx (183 lines)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Geometry, Vec2 } from 'ogl';

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * aspect;

  vec2 mouse = uMouse * aspect;
  float mouseDist = length(p - mouse);
  float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;

  float t = uTime * 0.08;

  float n1 = fbm(p * 2.0 + vec2(t * 0.3, t * 0.2) + mouseInfluence);
  float n2 = fbm(p * 3.0 - vec2(t * 0.2, t * 0.4) - mouseInfluence * 0.5);
  float n3 = fbm(p * 1.5 + vec2(t * 0.15, -t * 0.1));

  vec3 col1 = vec3(0.75, 0.15, 1.0);
  vec3 col2 = vec3(1.0, 0.4, 0.67);
  vec3 col3 = vec3(0.27, 0.55, 1.0);

  vec3 color = mix(col1, col2, n1);
  color = mix(color, col3, n2 * 0.5);

  float centerGlow = smoothstep(0.8, 0.0, length(uv - vec2(0.5, 0.4))) * 0.4;
  color += vec3(0.75, 0.06, 0.78) * centerGlow;

  float stars = 0.0;
  for (float i = 1.0; i < 4.0; i++) {
    vec2 starUV = uv * (200.0 * i);
    vec2 starCell = floor(starUV);
    float starHash = hash(starCell + i * 100.0);
    if (starHash > 0.97) {
      vec2 starPos = fract(starUV) - 0.5;
      float starDist = length(starPos);
      float twinkle = sin(uTime * (2.0 + starHash * 3.0) + starHash * 6.28) * 0.5 + 0.5;
      stars += smoothstep(0.05, 0.0, starDist) * twinkle * (1.0 / i);
    }
  }
  color += stars * vec3(0.9, 0.8, 1.0);

  float intensity = n3 * 0.3 + 0.15 + centerGlow * 0.5;
  color *= intensity;

  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
  color *= vignette * 0.8 + 0.2;

  float edgeFade = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
  color *= edgeFade;

  gl_FragColor = vec4(color, 1.0);
}`;

export function NebulaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderer = new Renderer({ canvas, alpha: true, antialias: false });
    const gl = renderer.gl;

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    });

    const mouse = new Vec2(0.5, 0.5);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uResolution: { value: new Vec2(canvas.width, canvas.height) },
        uTime: { value: 0 },
        uMouse: { value: mouse },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      renderer.setSize(w * dpr, h * dpr);
      program.uniforms.uResolution.value.set(w * dpr, h * dpr);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
    }

    let rafId: number;
    const start = performance.now();

    function loop() {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    resize();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="nebula-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
```

---

## Security & Correctness Checklist

Please evaluate each of these specific concerns:

### WebGL / OGL
- [ ] Is `WEBGL_lose_context` cleanup sufficient? Does the renderer need `renderer.destroy()`?
- [ ] Is the geometry/program/mesh properly disposed on unmount?
- [ ] Can a WebGL context loss crash the page? Is there a `webglcontextlost` event handler?
- [ ] The `canvas` ref is accessed via `canvas!` (non-null assertion) inside closures -- could this NPE after unmount?
- [ ] Is `renderer.setSize()` correct? Does it set inline styles that conflict with CSS?

### GSAP / Animation
- [ ] Bot loop `setInterval(600ms)` never pauses when tab is hidden -- battery drain?
- [ ] `document.querySelector('.cell-${idx}')` inside GSAP callbacks -- stale after React re-render?
- [ ] GSAP `timeline()` in entrance animation has no cleanup (`tl.kill()` or `tl.revert()`)
- [ ] IntersectionObserver callback uses `gsap.from()` on already-animated elements -- re-trigger on fast scroll?
- [ ] `useCallback` import is unused -- dead import

### SSR / Hydration
- [ ] All components are `'use client'` -- is this intentional? Could any be server components?
- [ ] `INITIAL_CARDS` uses `as const` assertions -- is the array stable across server/client?
- [ ] `new Date().getFullYear()` in footer renders differently per build -- hydration mismatch?
- [ ] `window.matchMedia` called in `useEffect` (client-only) -- safe from SSR mismatch?

### Build / Config
- [ ] `output: "export"` generates static HTML -- no CSP headers from Next.js server
- [ ] `images: { unoptimized: true }` -- no image optimization at all
- [ ] No `X-Frame-Options`, `X-Content-Type-Options`, or `Content-Security-Policy` in config
- [ ] `eslint-config-next` at `16.2.6` but `eslint` is `^9` -- version compatibility?
- [ ] `@cloudflare/next-on-pages` in devDependencies but `output: "export"` -- unused dependency?

### Event Listeners
- [ ] Mouse parallax listener on `window` -- does it fire when cursor is outside the hero section?
- [ ] Cursor glow effect uses `document.querySelectorAll('.glass-card')` at mount -- misses dynamically added cards?
- [ ] `passive: true` on mousemove listeners -- correct for all cases?

### DOM Manipulation
- [ ] GSAP cell animations use `document.querySelector` with class selectors -- could match wrong elements if multiple instances?
- [ ] Bot loop modifies `el.style` directly -- bypasses React's virtual DOM reconciliation
- [ ] `card.style.setProperty('--mx', ...)` -- safe from CSS injection if values come from `e.clientX`?
