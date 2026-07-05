import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const GRID = 5;
// Brand palette (DESIGN.md / HANDOFF background constants) — NOT a generic rainbow.
const SAFE_COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3']; // magenta / pink / gold family
const PURPLE = '#c026d3';                                          // forbidden accent
const MOUSE_RADIUS = 140;

interface GridCell {
  color: string; opacity: number;
  phase: 'appearing' | 'hold' | 'disappearing' | 'empty';
  timer: number; size: number; x: number; y: number;
}

export default function GridPulse({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<GridCell[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    if (document.hidden) return; // idle-skip (double-guard alongside controller pause)

    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cellW = Math.min(w, h) * 0.14;
    const gap = cellW * 0.18;
    const total = GRID * cellW + (GRID - 1) * gap;
    const startX = (w - total) / 2, startY = (h - total) / 2;

    for (let i = 0; i < cellsRef.current.length; i++) {
      const c = cellsRef.current[i];
      const col = i % GRID, row = Math.floor(i / GRID);
      c.x = startX + col * (cellW + gap) + cellW / 2;
      c.y = startY + row * (cellW + gap) + cellW / 2;

      c.timer--;
      if (c.timer <= 0) {
        if (c.phase === 'empty') {
          c.phase = 'appearing';
          c.color = Math.random() > 0.15 ? SAFE_COLORS[(Math.random() * SAFE_COLORS.length) | 0] : PURPLE;
          c.timer = 18; c.size = 0;
        } else if (c.phase === 'appearing') { c.phase = 'hold'; c.timer = 30 + (Math.random() * 50 | 0); c.size = 1; }
        else if (c.phase === 'hold') { c.phase = 'disappearing'; c.timer = 14; }
        else { c.phase = 'empty'; c.timer = 20 + (Math.random() * 60 | 0); c.size = 0; }
      }
      if (c.phase === 'appearing') c.size = Math.min(1, c.size + 0.06);
      if (c.phase === 'disappearing') c.size = Math.max(0, c.size - 0.07);
      c.opacity = c.size;
      if (c.opacity < 0.02) continue;

      const dx = mouseRef.current.x - c.x, dy = mouseRef.current.y - c.y;
      const dist = Math.hypot(dx, dy);
      const mouseScale = dist < MOUSE_RADIUS ? 1 + (1 - dist / MOUSE_RADIUS) * 0.6 : 1;
      const s = cellW * c.size * 0.88 * mouseScale;

      // Premium touch: soft brand bloom behind each cell (skipped in Lite Mode).
      if (!lowQ) { ctx.shadowColor = c.color; ctx.shadowBlur = 18 * c.size; }
      ctx.globalAlpha = c.opacity * (lowQ ? 0.5 : 0.6);
      ctx.fillStyle = c.color;
      const r = s * 0.22, x = c.x, y = c.y;
      ctx.beginPath();
      ctx.moveTo(x - s/2 + r, y - s/2);
      ctx.lineTo(x + s/2 - r, y - s/2); ctx.arcTo(x + s/2, y - s/2, x + s/2, y - s/2 + r, r);
      ctx.lineTo(x + s/2, y + s/2 - r); ctx.arcTo(x + s/2, y + s/2, x + s/2 - r, y + s/2, r);
      ctx.lineTo(x - s/2 + r, y + s/2); ctx.arcTo(x - s/2, y + s/2, x - s/2, y + s/2 - r, r);
      ctx.lineTo(x - s/2, y - s/2 + r); ctx.arcTo(x - s/2, y - s/2, x - s/2 + r, y - s/2, r);
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);

    cellsRef.current = Array.from({ length: GRID * GRID }, () => ({
      color: SAFE_COLORS[(Math.random() * SAFE_COLORS.length) | 0],
      opacity: 0, phase: 'empty' as const,
      timer: Math.random() * 80 | 0, size: 0, x: 0, y: 0,
    }));

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; } // static single frame, no loop
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
     
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
