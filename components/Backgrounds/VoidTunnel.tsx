import React, { useEffect, useRef } from 'react';

type Shape = 'square' | 'triangle' | 'diamond';

interface SpiralBlock {
  angle: number;       // current angle in radians
  radius: number;      // distance from center
  size: number;        // px
  shape: Shape;
  color: string;
  speed: number;       // radians per frame
  radiusSpeed: number; // px per frame (shrinking toward center)
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
  } else { // diamond
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const BLOCK_COUNT = 48;
    const blocks: SpiralBlock[] = Array.from({ length: BLOCK_COUNT }, () =>
      makeBlock(canvas.width, canvas.height)
    );

    let raf: number;
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      for (const b of blocks) {
        b.angle += b.speed;
        b.radius -= b.radiusSpeed;

        // Reset when reaches center
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
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
               pointerEvents: 'none', zIndex: -1, opacity: 0.45 }}
    />
  );
}
