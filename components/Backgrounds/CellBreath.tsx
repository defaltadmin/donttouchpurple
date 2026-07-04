import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const CELL_COUNT = 12;

interface Cell {
  x: number; y: number; baseRadius: number; phase: number; speed: number; color: string;
}

export default function CellBreath({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<Cell[]>([]);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    timeRef.current += 0.015;
    const t = timeRef.current;

    cellsRef.current.forEach(c => {
      const breathe = Math.sin(t * c.speed + c.phase) * 0.3 + 0.7;
      const r = c.baseRadius * breathe;
      ctx.globalAlpha = 0.15 * breathe;
      if (!lowQ) { ctx.shadowColor = c.color; ctx.shadowBlur = 20; }
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      cellsRef.current = Array.from({ length: CELL_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseRadius: 40 + Math.random() * 80,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
