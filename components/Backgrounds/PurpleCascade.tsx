import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#c026d3', '#f9bd22'];
const PARTICLE_COUNT = 80;

interface Particle { x: number; y: number; speed: number; size: number; color: string; wave: number; waveSpeed: number; }

export default function PurpleCascade({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.06)';
    ctx.fillRect(0, 0, w, h);

    particlesRef.current.forEach(p => {
      p.y += p.speed;
      p.wave += p.waveSpeed;
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }

      const xPos = p.x + Math.sin(p.wave) * 20;
      ctx.globalAlpha = 0.4;
      if (!lowQ) { ctx.shadowColor = p.color; ctx.shadowBlur = 6; }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(xPos, p.y, p.size, 0, Math.PI * 2);
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
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2, size: 1 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        wave: Math.random() * Math.PI * 2, waveSpeed: 0.02 + Math.random() * 0.03,
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
