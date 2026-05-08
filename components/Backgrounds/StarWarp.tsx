import { useEffect, useRef, useCallback } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';

type Shape = 'square' | 'circle' | 'triangle' | 'diamond';
const SHAPES: Shape[] = ['square', 'circle', 'triangle', 'diamond'];
const COLORS = ['#c026d3', '#a21caf', '#7c3aed', '#9333ea', '#db2777', '#e879f9'];

interface WarpShape {
  x: number; y: number;
  angle: number;
  speed: number;
  dist: number;
  maxDist: number;
  size: number;
  shape: Shape;
  color: string;
  opacity: number;
}

function makeWarpShape(w: number, h: number): WarpShape {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: w / 2, y: h / 2,
    angle,
    speed: 1.5 + Math.random() * 2.5,
    dist: Math.random() * 40,
    maxDist: Math.max(w, h) * 0.7,
    size: 6 + Math.random() * 12,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: 0.6 + Math.random() * 0.4,
  };
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(-size / 2, -size / 2, size, size);
  } else if (shape === 'circle') {
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
  } else {
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 2, 0);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

export default function StarWarp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef<(() => void) | null>(null);
  const { register } = useBackgroundController(true);

  const pause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const resume = useCallback(() => {
    if (!rafRef.current && drawRef.current) {
      rafRef.current = requestAnimationFrame(drawRef.current);
    }
  }, []);

  useEffect(() => {
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 60;
    const shapes: WarpShape[] = Array.from({ length: COUNT }, () =>
      makeWarpShape(canvas.width, canvas.height)
    );

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const s of shapes) {
        s.dist += s.speed * (1 + s.dist / 80);
        if (s.dist > s.maxDist) { Object.assign(s, makeWarpShape(w, h)); continue; }

        const x = w / 2 + Math.cos(s.angle) * s.dist;
        const y = h / 2 + Math.sin(s.angle) * s.dist;
        const progress = s.dist / s.maxDist;

        ctx.globalAlpha = s.opacity * (0.2 + progress * 0.8);
        ctx.fillStyle = s.color;
        drawShape(ctx, s.shape, x, y, s.size * (0.4 + progress * 0.6), s.angle + progress * Math.PI);
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef}
      className="background-canvas" style={{ opacity: 0.5 }} />
  );
}
