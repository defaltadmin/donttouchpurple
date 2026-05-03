import React, { useEffect, useRef } from 'react';

const RING_COLORS = ['#c026d3','#7c3aed','#db2777','#9333ea','#a21caf'];

export default function WarpGate() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight; };
    resize(); window.addEventListener('resize',resize);

    const RING_COUNT = 7;
    const rings = Array.from({length:RING_COUNT},(_,i)=>({
      r: (i/RING_COUNT)*Math.max(c.width,c.height)*0.6,
      color: RING_COLORS[i%RING_COLORS.length],
    }));
    const SPEED = 1.2;
    const MAX_R = Math.max(c.width,c.height)*0.75;
    let raf: number;

    const draw = () => {
      const w=c.width, h=c.height;
      ctx.clearRect(0,0,w,h);
      for (const ring of rings) {
        ring.r += SPEED;
        if (ring.r > MAX_R) ring.r = 0;
        const progress = ring.r/MAX_R;
        ctx.globalAlpha = (1-progress)*0.5;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 3*(1-progress*0.6);
        ctx.beginPath();
        ctx.arc(w/2,h/2,ring.r,0,Math.PI*2);
        ctx.stroke();
      }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:-1,opacity:0.6}} />;
}
