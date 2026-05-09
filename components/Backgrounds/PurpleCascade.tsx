import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from '../../utils/cleanup-pattern';

const COLORS = ['#c026d3','#a21caf','#7c3aed','#9333ea','#db2777'];
type Shape = 'square'|'circle'|'diamond';
const SHAPES: Shape[] = ['square','circle','diamond'];

interface Drop { x:number; y:number; speed:number; size:number; color:string; shape:Shape; opacity:number; }

function makeDrop(w:number, h:number): Drop {
  return { x: Math.random()*w, y: -20 - Math.random()*h, speed: 1+Math.random()*2,
    size: 8+Math.random()*14, color: COLORS[Math.floor(Math.random()*COLORS.length)],
    shape: SHAPES[Math.floor(Math.random()*SHAPES.length)], opacity: 0.3+Math.random()*0.5 };
}

function drawShape(ctx:CanvasRenderingContext2D, shape:Shape, x:number, y:number, s:number) {
  ctx.beginPath();
  if (shape==='square') ctx.rect(x-s/2,y-s/2,s,s);
  else if (shape==='circle') ctx.arc(x,y,s/2,0,Math.PI*2);
  else { ctx.moveTo(x,y-s/2); ctx.lineTo(x+s/2,y); ctx.lineTo(x,y+s/2); ctx.lineTo(x-s/2,y); ctx.closePath(); }
  ctx.fill();
}

export default function PurpleCascade() {
  const ref = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dropsRef.current) {
      d.y += d.speed;
      if (d.y > canvas.height + 20) Object.assign(d, makeDrop(canvas.width, canvas.height));
      ctx.globalAlpha = d.opacity; ctx.fillStyle = d.color;
      drawShape(ctx, d.shape, d.x, d.y, d.size);
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
    resize(); window.addEventListener('resize', resize);
    dropsRef.current = Array.from({length:70}, ()=>makeDrop(c.width, c.height));
    return () => {
      window.removeEventListener('resize',resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={ref} className="background-canvas" style={{opacity:0.45}} />;
}
