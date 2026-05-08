import { useEffect, useRef, useCallback } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';

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
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width=window.innerWidth; c.height=window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const drops: Drop[] = Array.from({length:70}, ()=>makeDrop(c.width, c.height));
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      for (const d of drops) {
        d.y += d.speed;
        if (d.y > c.height+20) Object.assign(d, makeDrop(c.width, c.height));
        ctx.globalAlpha = d.opacity; ctx.fillStyle = d.color;
        drawShape(ctx, d.shape, d.x, d.y, d.size);
      }
      ctx.globalAlpha=1; rafRef.current=requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} className="background-canvas" style={{opacity:0.45}} />;
}
