import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from '../../utils/cleanup-pattern';

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
  const shapesRef = useRef<WarpShape[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    // FPS cap handled by useSafeRaf (reduced motion, low battery, background)
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (const s of shapesRef.current) {
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
  });

  useEffect(() => {
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => {
      unregister?.();
      stop();
    };
  }, [register, start, stop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctxRef.current?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 60;
    shapesRef.current = Array.from({ length: COUNT }, () =>
      makeWarpShape(canvas.width, canvas.height)
    );

    return () => {
      window.removeEventListener('resize', resize);
      ctxRef.current = null;
    };
  }, []);

  return (
    <canvas ref={canvasRef}
      className="background-canvas" style={{ opacity: 0.5 }} />
  );
}
