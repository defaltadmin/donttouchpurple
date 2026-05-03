import React, { useEffect, useRef } from 'react';

const SAFE = ['#3b82f6','#22c55e','#f97316','#eab308','#06b6d4','#ec4899','#c026d3'];

export default function CellBreath() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight; };
    resize(); window.addEventListener('resize',resize);

    const GRID=5;
    const colors = Array.from({length:GRID*GRID}, ()=>SAFE[Math.floor(Math.random()*SAFE.length)]);
    let t=0, raf: number;

    const draw = () => {
      t += 0.018;
      const w=c.width, h=c.height;
      ctx.clearRect(0,0,w,h);
      const cellW = Math.min(w,h)*0.14;
      const gap = cellW*0.2;
      const total = GRID*cellW+(GRID-1)*gap;
      const sx=(w-total)/2, sy=(h-total)/2;

      for (let row=0;row<GRID;row++) for (let col=0;col<GRID;col++) {
        const wave = Math.sin(t + row*0.7 + col*0.5) * 0.5 + 0.5; // 0–1
        const scale = 0.55 + wave*0.45;
        const s = cellW*scale;
        const x = sx+col*(cellW+gap)+cellW/2;
        const y = sy+row*(cellW+gap)+cellW/2;
        ctx.globalAlpha = 0.25 + wave*0.35;
        ctx.fillStyle = colors[row*GRID+col];
        const r = s*0.2;
        ctx.beginPath();
        ctx.moveTo(x-s/2+r,y-s/2); ctx.lineTo(x+s/2-r,y-s/2);
        ctx.arcTo(x+s/2,y-s/2,x+s/2,y-s/2+r,r); ctx.lineTo(x+s/2,y+s/2-r);
        ctx.arcTo(x+s/2,y+s/2,x+s/2-r,y+s/2,r); ctx.lineTo(x-s/2+r,y+s/2);
        ctx.arcTo(x-s/2,y+s/2,x-s/2,y+s/2-r,r); ctx.lineTo(x-s/2,y-s/2+r);
        ctx.arcTo(x-s/2,y-s/2,x-s/2+r,y-s/2,r); ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:-1}} />;
}
