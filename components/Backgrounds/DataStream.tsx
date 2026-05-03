import React, { useEffect, useRef } from 'react';

const COLORS = ['#c026d3','#a21caf','#7c3aed','#9333ea','#3b82f6','#db2777'];
const CELL = 14; const GAP = 3;

interface Column { x:number; cells:{y:number; color:string; opacity:number}[]; speed:number; }

export default function DataStream() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width=c.offsetWidth; c.height=c.offsetHeight; };
    resize(); window.addEventListener('resize',resize);

    const cols: Column[] = [];
    for (let x=0; x<c.width; x+=CELL+GAP) {
      const len = 3+Math.floor(Math.random()*6);
      cols.push({
        x,
        cells: Array.from({length:len},(_,i)=>({
          y: -i*(CELL+GAP)-Math.random()*c.height,
          color: COLORS[Math.floor(Math.random()*COLORS.length)],
          opacity: (len-i)/len,
        })),
        speed: 1+Math.random()*1.5,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      for (const col of cols) {
        for (const cell of col.cells) {
          cell.y += col.speed;
          if (cell.y > c.height+CELL) cell.y = -CELL - Math.random()*c.height*0.5;
          ctx.globalAlpha = cell.opacity * 0.5;
          ctx.fillStyle = cell.color;
          ctx.fillRect(col.x, cell.y, CELL, CELL);
        }
      }
      ctx.globalAlpha=1; raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:-1,opacity:0.45}} />;
}
