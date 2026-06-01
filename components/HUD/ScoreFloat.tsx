import React, { useLayoutEffect, useRef, useState } from 'react';

interface ScoreFloatProps {
  player: 1 | 2;
  idx: number;
  amount: number;
  cols: number;
  rows: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function ScoreFloat({ player: _player, idx, amount, cols, rows, gridRef }: ScoreFloatProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const grid = gridRef.current;
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    setPos({
      x: rect.left + col * cellW + cellW / 2,
      y: rect.top + row * cellH,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- gridRef is a stable ref, not a reactive dep
  }, [idx, cols, rows]);

  if (!pos) return null;

  return (
    <div
      ref={ref}
      className="score-float"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, 0)',
        pointerEvents: 'none',
        zIndex: 100,
        fontFamily: 'var(--font-ui)',
        fontWeight: 800,
        fontSize: amount >= 3 ? 22 : 18,
        color: amount >= 3 ? '#ff6b6b' : amount >= 2 ? '#ffd93d' : '#ffffff',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        animation: 'score-float-up 0.8s ease-out forwards',
      }}
    >
      +{amount}
    </div>
  );
}
