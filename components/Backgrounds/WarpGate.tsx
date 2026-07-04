import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const SEGMENTS = 24;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

export default function WarpGate({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.01;

    const maxR = Math.max(w, h) * 0.6;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2 + timeRef.current;
      const pulse = Math.sin(timeRef.current * 2 + i) * 0.3 + 0.7;
      const r = maxR * pulse;
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.08;
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
      ctx.strokeStyle = color;
      ctx.lineWidth = lowQ ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
