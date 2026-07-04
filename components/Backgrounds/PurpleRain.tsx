import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const DROP_COUNT = 60;
const COLORS = ['#fda9ff', '#f3aeff', '#c026d3'];

interface Drop { xFrac: number; y: number; speed: number; length: number; color: string; alpha: number; }

export default function PurpleRain({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.08)';
    ctx.fillRect(0, 0, w, h);

    dropsRef.current.forEach(d => {
      d.y += d.speed;
      if (d.y > h) { d.y = -d.length; d.speed = 1 + Math.random() * 4; }

      const grad = ctx.createLinearGradient(0, d.y - d.length, 0, d.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, d.color);
      ctx.globalAlpha = d.alpha * (lowQ ? 0.4 : 0.6);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lowQ ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(w * d.xFrac, d.y - d.length);
      ctx.lineTo(w * d.xFrac, d.y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      dropsRef.current = Array.from({ length: DROP_COUNT }, () => ({
        xFrac: Math.random(),
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 4,
        length: 30 + Math.random() * 80,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.3 + Math.random() * 0.7,
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
