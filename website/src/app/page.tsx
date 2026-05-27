'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

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

const INITIAL_CARDS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => randomCell(i));

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
  { icon: '\u2728', title: '12 Animated Backgrounds', desc: 'GPU-accelerated WebGL effects — nebula, aurora, digital rain, and more.' },
  { icon: '\uD83E\uDD16', title: 'AI Bot Assist', desc: 'Activate a companion bot that costs dust to help you survive. Or play solo.' },
  { icon: '\uD83D\uDCC5', title: 'Daily Challenges', desc: 'New objectives every day. Compete on the global leaderboard.' },
  { icon: '\uD83D\uDCF1', title: 'Installable PWA', desc: 'Works on any device. Install as an app. Gamepad support included.' },
];

export default function Home() {
  const [grid, setGrid] = useState<Cell[]>(INITIAL_CARDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossType, setBossType] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const bossRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

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
    tl.from(scoreRef.current, { x: 30, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.4);
  }, []);

  // Scroll-triggered animations for sections below the fold
  useEffect(() => {
    const sectionEls = document.querySelectorAll('.scroll-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from(entry.target, {
              y: 40,
              opacity: 0,
              duration: 0.6,
              ease: 'power2.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Game simulation loop
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const replaceCount = 2 + Math.floor(Math.random() * 3);
      setGrid((prev) => {
        const next = [...prev];
        for (let i = 0; i < replaceCount; i++) {
          const idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
          next[idx] = randomCell(idx);
          gsap.to(`.cell-${idx}`, {
            scale: 1,
            duration: 0.3,
            ease: 'back.out(2.5)',
            delay: Math.random() * 0.1,
          });
        }
        return next;
      });
      setScore((prev) => prev + Math.floor(Math.random() * 8) + 1);
      setStreak((prev) => Math.min(prev + 1, 15));
      if (tick % 30 === 0) {
        setBossActive(true);
        setBossType(Math.random() > 0.5 ? 'INVERSION' : 'STORM');
        setFlash('#fda9ff');
        setTimeout(() => setFlash(null), 200);
        if (bossRef.current) {
          gsap.fromTo(bossRef.current,
            { y: -60, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }
          );
        }
        setTimeout(() => {
          setBossActive(false);
          if (bossRef.current) {
            gsap.to(bossRef.current, { y: -60, opacity: 0, duration: 0.3, ease: 'power2.in' });
          }
        }, 3000);
      }
      if (tick % 12 === 0) setStreak(0);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleCellClick = useCallback((idx: number) => {
    const cell = grid[idx];
    if (!cell) return;
    if (cell.type === 'purple') {
      setFlash('#ff4444');
      setTimeout(() => setFlash(null), 150);
      setStreak(0);
      gsap.to(`.cell-${idx}`, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    } else {
      gsap.to(`.cell-${idx}`, {
        scale: 0, rotation: 10, duration: 0.2, ease: 'power2.in',
        onComplete: () => {
          setGrid((prev) => {
            const next = [...prev];
            next[idx] = randomCell(idx);
            return next;
          });
          gsap.fromTo(`.cell-${idx}`,
            { scale: 0, rotation: -10 },
            { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(3)' }
          );
        },
      });
      setScore((prev) => prev + (cell.type === 'special' ? 5 : 1));
      setStreak((prev) => prev + 1);
      const el = document.querySelector(`.cell-${idx}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const float = document.createElement('div');
        float.textContent = `+${cell.type === 'special' ? 5 : 1}`;
        float.className = 'score-float';
        float.style.left = `${rect.left + rect.width / 2}px`;
        float.style.top = `${rect.top}px`;
        document.body.appendChild(float);
        gsap.to(float, { y: -40, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => float.remove() });
      }
    }
  }, [grid]);

  return (
    <>
      <style jsx global>{`
        .score-float {
          position: fixed;
          pointer-events: none;
          font-family: 'Fredoka One', cursive;
          font-size: 18px;
          color: #f9bd22;
          text-shadow: 0 0 10px rgba(249, 189, 34, 0.6);
          z-index: 1000;
          transform: translateX(-50%);
        }
      `}</style>

      <div ref={containerRef} className="landing-page">

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-bg" style={{
            background: flash
              ? `radial-gradient(circle, ${flash}20 0%, #151028 70%)`
              : 'radial-gradient(ellipse at 30% 20%, rgba(253,169,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(192,38,211,0.06) 0%, transparent 50%), #151028',
            transition: flash ? 'background 0.1s' : 'background 0.5s',
          }}>
            {/* Grid lines overlay */}
            <div className="hero-grid-lines" />

            {/* Boss overlay */}
            <div ref={bossRef} className="boss-overlay">
              <div className="boss-banner-hero">
                <span className="boss-banner-text">{bossType}</span>
              </div>
            </div>

            {/* Score */}
            <div ref={scoreRef} className="score-display">
              <div className="score-value">{score.toLocaleString()}</div>
              {streak > 2 && <div className="score-streak">{streak}x streak</div>}
            </div>

            {/* Title */}
            <h1 ref={titleRef} className="hero-title">
              <span className="title-dont">Don&apos;t Touch</span>{' '}
              <span className="title-purple">Purple</span>
            </h1>

            {/* Grid */}
            <div
              ref={gridRef}
              className="game-grid"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {grid.map((cell, i) => (
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
                  onClick={() => handleCellClick(i)}
                >
                  {cell.label && <span className="cell-label">{cell.label}</span>}
                  {cell.type === 'purple' && <span className="cell-x">X</span>}
                </div>
              ))}
            </div>

            {/* Play button */}
            <a ref={btnRef} href={PLAY_URL} className="play-btn">
              <svg className="play-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              PLAY
              <div className="play-shimmer" />
            </a>

            <p className="hero-subtitle">Free. No ads. No accounts. Just tap.</p>

            {/* Scroll indicator */}
            <div className="scroll-indicator">
              <span className="scroll-chevron">&#8964;</span>
            </div>
          </div>
        </section>

        {/* ── Boss Events ── */}
        <section className="scroll-section section-boss">
          <h2 className="section-heading">Boss Events</h2>
          <p className="section-subtext">Just when you think you&apos;ve got it figured out, the rules change.</p>
          <div className="boss-cards">
            {BOSS_EVENTS.map((boss) => (
              <div key={boss.name} className="boss-card" style={{ '--boss-glow': boss.glow } as React.CSSProperties}>
                <div className="boss-card-icon">{boss.icon}</div>
                <div className="boss-card-name" style={{ background: boss.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {boss.name}
                </div>
                <p className="boss-card-desc">{boss.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="scroll-section section-features">
          <h2 className="section-heading">Everything You Get</h2>
          <p className="section-subtext">More depth than you&apos;d expect from a &quot;don&apos;t touch the color&quot; game.</p>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Open Source / Tech ── */}
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
              <span className="stat-number">212</span>
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

        {/* ── Final CTA ── */}
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

        <footer className="landing-footer">
          <span>&copy; {new Date().getFullYear()} Don&apos;t Touch Purple &middot; Open Source (MIT)</span>
        </footer>
      </div>
    </>
  );
}
