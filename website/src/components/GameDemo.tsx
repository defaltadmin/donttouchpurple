'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PLAY_URL = '/play';
const DEMO_SIZE = 3;
const DEMO_DURATION = 10; // seconds
const COLORS = {
  safe: ['#4488ff', '#44ddff', '#f9bd22', '#44ff88', '#ff44aa', '#8844ff', '#ff8844', '#44aaff'],
  purple: '#9b59b6',
};

interface DemoCell {
  id: number;
  color: string;
  type: 'safe' | 'purple';
  birth: number;
}

function randomDemoCell(id: number, now: number): DemoCell {
  const isPurple = Math.random() < 0.25;
  return {
    id,
    color: isPurple ? COLORS.purple : COLORS.safe[Math.floor(Math.random() * COLORS.safe.length)],
    type: isPurple ? 'purple' : 'safe',
    birth: now,
  };
}

export function GameDemo() {
  const [cells, setCells] = useState<DemoCell[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEMO_DURATION);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const tickRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const initGrid = useCallback(() => {
    const now = Date.now();
    setCells(Array.from({ length: DEMO_SIZE * DEMO_SIZE }, (_, i) => randomDemoCell(i, now)));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameActive(true);
    setTimeLeft(DEMO_DURATION);
    tickRef.current = 0;
    initGrid();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameActive(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initGrid]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-cycle cells
  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      tickRef.current++;
      const now = Date.now();
      // Replace 3-5 random cells each tick
      const count = 3 + Math.floor(Math.random() * 3);
      setCells(prev => {
        const next = [...prev];
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = randomDemoCell(idx, now);
        }
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [gameActive]);

  const handleTap = useCallback((cell: DemoCell) => {
    if (!gameActive) return;

    if (cell.type === 'purple') {
      setFlash('bad');
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setGameActive(false);
          setGameOver(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return Math.max(0, next);
      });
      // Shake animation handled by CSS
    } else {
      setFlash('good');
      setScore(prev => prev + 1);
      // Replace tapped cell
      setCells(prev => {
        const next = [...prev];
        next[cell.id] = randomDemoCell(cell.id, Date.now());
        return next;
      });
    }

    setTimeout(() => setFlash(null), 200);
  }, [gameActive]);

  return (
    <section className="scroll-section section-demo" id="try-it">
      <h2 className="section-heading">Try It Now</h2>
      <p className="section-subtext">
        Tap the colors. Avoid purple. How long can you survive?
      </p>

      <div className={`demo-container ${flash === 'bad' ? 'demo-shake' : ''}`}>
        {/* Score bar */}
        <div className="demo-hud">
          <div className="demo-score">
            <span className="demo-label">Score</span>
            <span className="demo-value">{score}</span>
          </div>
          <div className="demo-timer">
            <span className="demo-label">Time</span>
            <span className="demo-value">{timeLeft}s</span>
          </div>
          <div className="demo-lives">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`demo-heart ${i < lives ? '' : 'demo-heart--lost'}`}>
                {i < lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="demo-grid">
          {cells.map((cell, i) => (
            <button
              key={`${cell.id}-${i}`}
              className="demo-cell"
              style={{
                background: cell.color,
                boxShadow: cell.type === 'purple'
                  ? `0 0 20px ${COLORS.purple}66, inset 0 0 15px rgba(0,0,0,0.3)`
                  : `0 0 15px ${cell.color}44, inset 0 0 10px rgba(255,255,255,0.1)`,
                animation: gameActive ? 'cellPopIn 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
              }}
              onClick={() => handleTap(cell)}
              aria-label={cell.type === 'purple' ? 'Purple - do not tap' : 'Safe color - tap'}
            />
          ))}
        </div>

        {/* Flash overlay */}
        {flash && (
          <div
            className={`demo-flash demo-flash--${flash}`}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              pointerEvents: 'none',
              background: flash === 'good'
                ? 'radial-gradient(circle, rgba(68,255,136,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)',
              animation: 'flashFade 0.3s ease-out forwards',
            }}
          />
        )}

        {/* Start / Game Over overlay */}
        {(!gameActive && !gameOver) && (
          <div className="demo-overlay">
            <button className="demo-start-btn" onClick={startGame}>
              <span className="demo-start-icon">▶</span>
              <span>Tap to Play Demo</span>
            </button>
            <p className="demo-hint">10 seconds. Pure reflex.</p>
          </div>
        )}

        {gameOver && (
          <div className="demo-overlay">
            <div className="demo-result">
              <div className="demo-result-score">{score}</div>
              <div className="demo-result-label">{score > 15 ? 'Impressive!' : score > 8 ? 'Not bad!' : 'Try again!'}</div>
            </div>
            <button className="demo-start-btn" onClick={startGame}>
              Play Again
            </button>
            <a href={PLAY_URL} className="demo-cta-link">
              Play the Full Game →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
