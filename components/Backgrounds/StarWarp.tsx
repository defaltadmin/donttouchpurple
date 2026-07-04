import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const STAR_COUNT = 120;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#fff'];

interface Star { x: number; y: number; z: number; speed: number; }

export default function StarWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const starsRef = useRef<Star[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = 'rgba(21,16,40,0.15)';
    ctx.fillRect(0, 0, w, h);

    starsRef.current.forEach((s, i) => {
      s.z -= s.speed;
      if (s.z <= 0) { s.z = 1; s.x = (Math.random() - 0.5) * w * 2; s.y = (Math.random() - 0.5) * h * 2; }

      const sx = cx + (s.x / s.z) * 100;
      const sy = cy + (s.y / s.z) * 100;
      if (sx < 0 || sx > w || sy < 0 || sy > h) { s.z = 1; s.x = (Math.random() - 0.5) * w * 2; s.y = (Math.random() - 0.5) * h * 2; }

      const size = Math.max(0.5, (1 - s.z / 800) * 3);
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = Math.min(1, (1 - s.z / 600) * 0.8);
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
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
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * 800, speed: 1.5 + Math.random() * 3,
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
