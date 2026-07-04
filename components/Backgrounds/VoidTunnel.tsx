import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const RINGS = 6;

export default function VoidTunnel({ reducedMotion }: { reducedMotion?: boolean }) {
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

    timeRef.current += 0.008;
    const t = timeRef.current;

    for (let i = RINGS; i >= 0; i--) {
      const progress = (i + t * 0.5) % (RINGS + 1) / (RINGS + 1);
      const radius = progress * Math.max(w, h) * 0.5;
      const alpha = (1 - progress) * 0.4;
      const color = COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lowQ ? 1 : 2;
      ctx.globalAlpha = alpha;
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
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
