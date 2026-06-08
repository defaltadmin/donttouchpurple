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
      data-amount={amount >= 3 ? 'high' : amount >= 2 ? 'medium' : 'low'}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, 0)',
        pointerEvents: 'none',
        zIndex: 100,
        fontSize: amount >= 3 ? '1.375rem' : '1.125rem',
      }}
    >
      +{amount}
    </div>
  );
}
