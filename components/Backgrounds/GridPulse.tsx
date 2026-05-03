import React, { useEffect, useRef } from 'react';

const GRID = 5;
const SAFE_COLORS = ['#3b82f6','#22c55e','#f97316','#eab308','#06b6d4','#ec4899'];
const PURPLE = '#c026d3';

interface GridCell {
  color: string;
  opacity: number;
  phase: 'appearing' | 'hold' | 'disappearing' | 'empty';
  timer: number;
  size: number; // scale 0–1
}

export default function GridPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const cells: GridCell[] = Array.from({ length: GRID * GRID }, () => ({
      color: Math.random() > 0.15 ? SAFE_COLORS[Math.floor(Math.random() * SAFE_COLORS.length)] : PURPLE,
      opacity: 0,
      phase: 'empty' as const,
      timer: Math.floor(Math.random() * 80),
      size: 0,
    }));

    let raf: number;
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cellW = Math.min(w, h) * 0.14;
      const gap = cellW * 0.18;
      const totalW = GRID * cellW + (GRID - 1) * gap;
      const totalH = totalW;
      const startX = (w - totalW) / 2;
      const startY = (h - totalH) / 2;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const col = i % GRID;
        const row = Math.floor(i / GRID);
        const x = startX + col * (cellW + gap) + cellW / 2;
        const y = startY + row * (cellW + gap) + cellW / 2;

        c.timer--;
        if (c.timer <= 0) {
          if (c.phase === 'empty') {
            c.phase = 'appearing';
            c.color = Math.random() > 0.15 ? SAFE_COLORS[Math.floor(Math.random() * SAFE_COLORS.length)] : PURPLE;
            c.timer = 18;
            c.size = 0;
          } else if (c.phase === 'appearing') {
            c.phase = 'hold';
            c.timer = 30 + Math.floor(Math.random() * 50);
            c.size = 1;
          } else if (c.phase === 'hold') {
            c.phase = 'disappearing';
            c.timer = 14;
          } else {
            c.phase = 'empty';
            c.timer = 20 + Math.floor(Math.random() * 60);
            c.size = 0;
          }
        }

        // Animate size/opacity
        if (c.phase === 'appearing') c.size = Math.min(1, c.size + 0.06);
        if (c.phase === 'disappearing') c.size = Math.max(0, c.size - 0.07);
        c.opacity = c.size;

        if (c.opacity < 0.02) continue;

        const s = cellW * c.size * 0.88;
        ctx.globalAlpha = c.opacity * 0.55;
        ctx.fillStyle = c.color;

        // Rounded rect
        const r = s * 0.2;
        ctx.beginPath();
        ctx.moveTo(x - s/2 + r, y - s/2);
        ctx.lineTo(x + s/2 - r, y - s/2);
        ctx.arcTo(x + s/2, y - s/2, x + s/2, y - s/2 + r, r);
        ctx.lineTo(x + s/2, y + s/2 - r);
        ctx.arcTo(x + s/2, y + s/2, x + s/2 - r, y + s/2, r);
        ctx.lineTo(x - s/2 + r, y + s/2);
        ctx.arcTo(x - s/2, y + s/2, x - s/2, y + s/2 - r, r);
        ctx.lineTo(x - s/2, y - s/2 + r);
        ctx.arcTo(x - s/2, y - s/2, x - s/2 + r, y - s/2, r);
        ctx.closePath();
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
               pointerEvents: 'none', zIndex: -1 }} />
  );
}
