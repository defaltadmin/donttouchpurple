import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLS = 25;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%';
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

interface Col { x: number; speed: number; y: number; len: number; chars: string[]; }

export default function DigitalRain({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const colsRef = useRef<Col[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.1)';
    ctx.fillRect(0, 0, w, h);

    const fontSize = lowQ ? 11 : 13;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    colsRef.current.forEach((col, ci) => {
      col.y += col.speed;
      if (col.y > h + 200) { col.y = -200; col.chars = Array.from({ length: col.len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]); }

      const color = COLORS[ci % COLORS.length];
      col.chars.forEach((ch, j) => {
        const yPos = col.y - j * fontSize;
        if (yPos < 0 || yPos > h) return;
        ctx.globalAlpha = j === 0 ? 0.9 : Math.max(0.05, 0.6 - j / col.len * 0.6);
        ctx.fillStyle = j === 0 ? '#fff' : color;
        ctx.fillText(ch, col.x, yPos);
      });
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
      const colW = canvas.width / COLS;
      colsRef.current = Array.from({ length: COLS }, (_, i) => ({
        x: i * colW + colW / 2, speed: 1 + Math.random() * 3,
        y: Math.random() * canvas.height,
        len: 8 + Math.floor(Math.random() * 8),
        chars: Array.from({ length: 16 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
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
