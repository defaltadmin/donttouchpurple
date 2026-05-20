import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from '../../utils/cleanup-pattern';

type Shape = 'square' | 'triangle' | 'diamond';

interface SpiralBlock {
  angle: number;
  radius: number;
  size: number;
  shape: Shape;
  color: string;
  speed: number;
  radiusSpeed: number;
  opacity: number;
}

const COLORS = ['#c026d3', '#a21caf', '#7c3aed', '#db2777', '#9333ea'];
const SHAPES: Shape[] = ['square', 'triangle', 'diamond'];

function randomShape(): Shape { return SHAPES[Math.floor(Math.random() * SHAPES.length)]; }
function randomColor(): string { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(-size / 2, -size / 2, size, size);
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

function makeBlock(w: number, h: number): SpiralBlock {
  const maxRadius = Math.max(w, h) * 0.6;
  return {
    angle: Math.random() * Math.PI * 2,
    radius: maxRadius * (0.4 + Math.random() * 0.6),
    size: 14 + Math.random() * 22,
    shape: randomShape(),
    color: randomColor(),
    speed: (0.004 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
    radiusSpeed: 0.4 + Math.random() * 0.5,
    opacity: 0.5 + Math.random() * 0.4,
  };
}

export default function VoidTunnel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<SpiralBlock[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameSkipRef = useRef(0);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    // Cap at 30fps when reduced motion is preferred
    frameSkipRef.current++;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion && frameSkipRef.current % 2 !== 0) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    for (const b of blocksRef.current) {
      b.angle += b.speed;
      b.radius -= b.radiusSpeed;

      if (b.radius < 8) {
        Object.assign(b, makeBlock(w, h));
        b.radius = Math.max(w, h) * (0.5 + Math.random() * 0.15);
      }

      const x = cx + Math.cos(b.angle) * b.radius;
      const y = cy + Math.sin(b.angle) * b.radius;

      ctx.globalAlpha = b.opacity * (b.radius / (Math.max(w, h) * 0.6));
      ctx.fillStyle = b.color;
      drawShape(ctx, b.shape, x, y, b.size, b.angle);
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
      ctxRef.current?.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const BLOCK_COUNT = 48;
    blocksRef.current = Array.from({ length: BLOCK_COUNT }, () =>
      makeBlock(canvas.width, canvas.height)
    );

    return () => {
      window.removeEventListener('resize', resize);
      ctxRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas" style={{ opacity: 0.45 }}
    />
  );
}
