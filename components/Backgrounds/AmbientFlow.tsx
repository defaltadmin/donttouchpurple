import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const BLOB_COUNT = 5;

interface Blob {
  x: number; y: number; vx: number; vy: number; radius: number; color: string; phase: number;
}

export default function AmbientFlow({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.005;

    blobsRef.current.forEach(b => {
      b.x += b.vx + Math.sin(timeRef.current + b.phase) * 0.5;
      b.y += b.vy + Math.cos(timeRef.current + b.phase) * 0.5;
      if (b.x < -b.radius) b.x = w + b.radius;
      if (b.x > w + b.radius) b.x = -b.radius;
      if (b.y < -b.radius) b.y = h + b.radius;
      if (b.y > h + b.radius) b.y = -b.radius;

      const pulse = Math.sin(timeRef.current * 2 + b.phase) * 0.2 + 0.8;
      ctx.globalAlpha = 0.08 * pulse;
      if (!lowQ) { ctx.shadowColor = b.color; ctx.shadowBlur = 30; }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
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
      blobsRef.current = Array.from({ length: BLOB_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 100 + Math.random() * 150,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
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
