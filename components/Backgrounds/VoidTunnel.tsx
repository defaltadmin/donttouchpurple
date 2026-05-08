import { useEffect, useRef, useCallback } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';

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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const BLOCK_COUNT = 48;
    const blocks: SpiralBlock[] = Array.from({ length: BLOCK_COUNT }, () =>
      makeBlock(canvas.width, canvas.height)
    );

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      for (const b of blocks) {
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
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas" style={{ opacity: 0.45 }}
    />
  );
}
