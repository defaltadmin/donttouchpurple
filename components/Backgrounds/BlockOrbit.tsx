import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#c026d3','#7c3aed','#db2777','#9333ea','#a21caf','#e879f9'];
type Shape = 'square'|'triangle'|'diamond'|'circle';
const SHAPES: Shape[] = ['square','triangle','diamond','circle'];

interface OrbBlock { angle:number; radius:number; size:number; shape:Shape; color:string; speed:number; }

function drawShape(ctx:CanvasRenderingContext2D, shape:Shape, x:number, y:number, s:number, a:number) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.beginPath();
  if (shape==='square') ctx.rect(-s/2,-s/2,s,s);
  else if (shape==='circle') ctx.arc(0,0,s/2,0,Math.PI*2);
  else if (shape==='triangle') { ctx.moveTo(0,-s/2); ctx.lineTo(s/2,s/2); ctx.lineTo(-s/2,s/2); ctx.closePath(); }
  else { ctx.moveTo(0,-s/2); ctx.lineTo(s/2,0); ctx.lineTo(0,s/2); ctx.lineTo(-s/2,0); ctx.closePath(); }
  ctx.fill(); ctx.restore();
}

export default function BlockOrbit() {
  const ref = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<OrbBlock[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;

    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const b of blocksRef.current) {
      b.angle += b.speed;
      const x = w/2 + Math.cos(b.angle)*b.radius;
      const y = h/2 + Math.sin(b.angle)*b.radius;
      ctx.globalAlpha = 0.5; ctx.fillStyle = b.color;
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
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    ctxRef.current = ctx;
    const resize = () => { c.width=window.innerWidth; c.height=window.innerHeight; };
    resize(); window.addEventListener('resize',resize);

    const rings = [
      { radius: 60,  count: 5,  speed: 0.008,  size: 10 },
      { radius: 110, count: 8,  speed: -0.005, size: 13 },
      { radius: 165, count: 11, speed: 0.004,  size: 10 },
      { radius: 220, count: 14, speed: -0.003, size: 8  },
    ];
    blocksRef.current = rings.flatMap(ring =>
      Array.from({length: ring.count}, (_, i) => ({
        angle: (i / ring.count) * Math.PI * 2,
        radius: ring.radius,
        size: ring.size,
        shape: SHAPES[Math.floor(Math.random()*SHAPES.length)],
        color: COLORS[Math.floor(Math.random()*COLORS.length)],
        speed: ring.speed,
      }))
    );

    return () => {
      window.removeEventListener('resize',resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={ref} className="background-canvas" style={{opacity:0.5}} />;
}
