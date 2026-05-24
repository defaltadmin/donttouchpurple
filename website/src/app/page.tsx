'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

const PLAY_URL = 'https://defaltadmin.github.io/donttouchpurple';

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
  scale: number;
  opacity: number;
  label?: string;
}

function randomCell(id: number): Cell {
  const r = Math.random();
  if (r < 0.25) {
    return { id, color: COLORS.purple, type: 'purple', scale: 1, opacity: 1 };
  } else if (r < 0.35) {
    const specials = [
      { color: COLORS.bomb, label: '!' },
      { color: COLORS.shield, label: '+' },
      { color: COLORS.freeze, label: '~' },
      { color: COLORS.multiplier, label: 'x' },
    ];
    const s = specials[Math.floor(Math.random() * specials.length)];
    return { id, color: s.color, type: 'special', scale: 1, opacity: 1, label: s.label };
  }
  return {
    id,
    color: COLORS.safe[Math.floor(Math.random() * COLORS.safe.length)],
    type: 'safe',
    scale: 1,
    opacity: 1,
  };
}

const INITIAL_CARDS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => randomCell(i));

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

  // Entrance animations
  useEffect(() => {
    const tl = gsap.timeline();
    // Stagger cells in
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      tl.fromTo(`.cell-${i}`,
        { scale: 0, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.25, ease: 'back.out(2.5)' },
        i * 0.04
      );
    }

    // Title entrance
    tl.from(titleRef.current, {
      y: -40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, 0);

    // Button entrance
    tl.from(btnRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(3)',
    }, 0.6);

    // Score entrance
    tl.from(scoreRef.current, {
      x: 30,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, 0.4);
  }, []);

  // Game simulation loop
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;

      // Replace 2-4 random cells each tick
      const replaceCount = 2 + Math.floor(Math.random() * 3);
      setGrid(prev => {
        const next = [...prev];
        for (let i = 0; i < replaceCount; i++) {
          const idx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
          const newCell = randomCell(idx);
          newCell.scale = 0;
          next[idx] = newCell;

          // Animate pop-in
          gsap.to(`.cell-${idx}`, {
            scale: 1,
            duration: 0.3,
            ease: 'back.out(2.5)',
            delay: Math.random() * 0.1,
          });
        }
        return next;
      });

      // Simulate score
      setScore(prev => prev + Math.floor(Math.random() * 8) + 1);
      setStreak(prev => Math.min(prev + 1, 15));

      // Boss event every ~30 ticks
      if (tick % 30 === 0) {
        setBossActive(true);
        setBossType(Math.random() > 0.5 ? 'INVERSION' : 'BOMB SURGE');
        setFlash('#fda9ff');
        setTimeout(() => setFlash(null), 200);

        // Boss banner animation
        if (bossRef.current) {
          gsap.fromTo(bossRef.current,
            { y: -60, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }
          );
        }

        setTimeout(() => {
          setBossActive(false);
          if (bossRef.current) {
            gsap.to(bossRef.current, {
              y: -60, opacity: 0, duration: 0.3, ease: 'power2.in',
            });
          }
        }, 3000);
      }

      // Reset streak occasionally
      if (tick % 12 === 0) setStreak(0);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Click handler for cells
  const handleCellClick = useCallback((idx: number) => {
    const cell = grid[idx];
    if (!cell) return;

    if (cell.type === 'purple') {
      // Wrong! Flash red
      setFlash('#ff4444');
      setTimeout(() => setFlash(null), 150);
      setStreak(0);
      gsap.to(`.cell-${idx}`, {
        scale: 0.8,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    } else {
      // Correct! Pop and replace
      gsap.to(`.cell-${idx}`, {
        scale: 0,
        rotation: 10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setGrid(prev => {
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
      setScore(prev => prev + (cell.type === 'special' ? 5 : 1));
      setStreak(prev => prev + 1);

      // Float score text
      const el = document.querySelector(`.cell-${idx}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const float = document.createElement('div');
        float.textContent = `+${cell.type === 'special' ? 5 : 1}`;
        float.className = 'score-float';
        float.style.left = `${rect.left + rect.width / 2}px`;
        float.style.top = `${rect.top}px`;
        document.body.appendChild(float);
        gsap.to(float, {
          y: -40,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => float.remove(),
        });
      }
    }
  }, [grid]);

  return (
    <>
      {/* Score float CSS */}
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

      <div
        ref={containerRef}
        className="h-screen w-screen relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: flash
            ? `radial-gradient(circle, ${flash}20 0%, #151028 70%)`
            : 'radial-gradient(ellipse at 30% 20%, rgba(253,169,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(192,38,211,0.06) 0%, transparent 50%), #151028',
          transition: flash ? 'background 0.1s' : 'background 0.5s',
        }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(253,169,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,169,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Boss overlay */}
        <div
          ref={bossRef}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            className="px-6 py-3 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,68,68,0.9), rgba(192,38,211,0.9))',
              boxShadow: '0 0 40px rgba(255,68,68,0.4), 0 0 80px rgba(192,38,211,0.2)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <div
              className="text-xl font-black text-white tracking-wider"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              {bossType}
            </div>
          </div>
        </div>

        {/* Score display */}
        <div
          ref={scoreRef}
          className="absolute top-6 right-6 z-20"
        >
          <div className="text-right">
            <div
              className="text-3xl font-black tabular-nums"
              style={{
                fontFamily: "'Fredoka One', cursive",
                color: '#f9bd22',
                textShadow: '0 0 15px rgba(249,189,34,0.5)',
              }}
            >
              {score.toLocaleString()}
            </div>
            {streak > 2 && (
              <div
                className="text-sm font-bold"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: '#fda9ff',
                  opacity: 0.8,
                }}
              >
                {streak}x streak
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="absolute top-6 left-6 z-20"
        >
          <div
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            <span style={{ color: '#e7deff' }}>Don&apos;t Touch</span>{' '}
            <span
              style={{
                color: '#fda9ff',
                textShadow: '0 0 20px rgba(253,169,255,0.5), 0 0 40px rgba(253,169,255,0.2)',
              }}
            >
              Purple
            </span>
          </div>
          <p
            className="text-xs mt-1"
            style={{ fontFamily: "'Nunito', sans-serif", color: '#9f8a9d' }}
          >
            tap the colors — avoid purple
          </p>
        </h1>

        {/* Game grid */}
        <div
          ref={gridRef}
          className="relative z-10 grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(85vw, 320px)',
            height: 'min(85vw, 320px)',
          }}
        >
          {grid.map((cell, i) => (
            <div
              key={i}
              className={`cell-${i} rounded-xl cursor-pointer relative`}
              style={{
                background: `linear-gradient(135deg, ${cell.color}, ${cell.color}cc)`,
                boxShadow: cell.type === 'purple'
                  ? `0 0 15px ${cell.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                  : `0 0 12px ${cell.color}30, 0 4px 0 ${cell.color}50`,
                transform: `scale(${cell.scale})`,
                opacity: cell.opacity,
                border: cell.type === 'purple'
                  ? '2px solid rgba(255,255,255,0.15)'
                  : '2px solid rgba(255,255,255,0.08)',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => handleCellClick(i)}
            >
              {cell.label && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-lg font-black text-white/80"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                >
                  {cell.label}
                </span>
              )}
              {cell.type === 'purple' && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/40"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  X
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Play button */}
        <div className="relative z-20 mt-8">
          <a
            ref={btnRef}
            href={PLAY_URL}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg"
            style={{
              fontFamily: "'Fredoka One', cursive",
              background: 'linear-gradient(135deg, #fda9ff, #c026d3)',
              boxShadow: '0 0 30px rgba(253,169,255,0.4), 0 6px 0 #a400b7, 0 8px 30px rgba(0,0,0,0.3)',
            }}
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            PLAY
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  animation: 'shimmer 2.5s ease-in-out infinite',
                }}
              />
            </div>
          </a>
        </div>

        {/* Bottom text */}
        <p
          className="relative z-20 mt-4 text-xs"
          style={{ fontFamily: "'Nunito', sans-serif", color: '#524151' }}
        >
          Free. No ads. No accounts. Just tap.
        </p>
      </div>
    </>
  );
}
