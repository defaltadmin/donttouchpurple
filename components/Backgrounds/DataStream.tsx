import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLS = 30;
const CHARS = '01アイウエオカキクケコ∞∑∂∫√';
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

interface Stream { x: number; speed: number; chars: string[]; y: number; }

export default function DataStream({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const streamsRef = useRef<Stream[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.12)';
    ctx.fillRect(0, 0, w, h);

    const fontSize = lowQ ? 12 : 14;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    streamsRef.current.forEach((s, i) => {
      s.y += s.speed;
      if (s.y > h + 200) { s.y = -200; s.chars = Array.from({ length: 15 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]); }

      const color = COLORS[i % COLORS.length];
      s.chars.forEach((ch, j) => {
        const yPos = s.y - j * fontSize;
        if (yPos < 0 || yPos > h) return;
        const alpha = j === 0 ? 1 : Math.max(0.1, 1 - j / s.chars.length);
        ctx.globalAlpha = alpha * (lowQ ? 0.3 : 0.5);
        ctx.fillStyle = j === 0 ? '#fff' : color;
        ctx.fillText(ch, s.x, yPos);
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
      streamsRef.current = Array.from({ length: COLS }, (_, i) => ({
        x: i * colW + colW / 2,
        speed: 1.5 + Math.random() * 3,
        y: Math.random() * canvas.height,
        chars: Array.from({ length: 15 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
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
