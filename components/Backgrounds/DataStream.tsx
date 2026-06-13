import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

// Brand-cohesive palette (dropped the off-brand bright blue #3b82f6).
const COLORS = ['#c026d3','#a21caf','#7c3aed','#9333ea','#db2777','#e879f9'];
const LEAD_COLOR = '#fde6ff';
const CELL = 14; const GAP = 3;

interface Column { x:number; cells:{y:number; color:string; opacity:number}[]; speed:number; }

export default function DataStream() {
  const ref = useRef<HTMLCanvasElement>(null);
  const colsRef = useRef<Column[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const col of colsRef.current) {
      // The lowest cell (max y) is the bright "lead" of the stream.
      let leadIdx = 0;
      for (let i = 1; i < col.cells.length; i++) {
        if (col.cells[i].y > col.cells[leadIdx].y) leadIdx = i;
      }
      col.cells.forEach((cell, i) => {
        cell.y += col.speed;
        if (cell.y > canvas.height + CELL) cell.y = -CELL - Math.random() * canvas.height * 0.5;
        if (i === leadIdx) {
          ctx.globalAlpha = Math.min(1, cell.opacity + 0.4);
          ctx.fillStyle = LEAD_COLOR;
          ctx.shadowColor = '#c026d3';
          ctx.shadowBlur = 10;
          ctx.fillRect(col.x, cell.y, CELL, CELL);
          ctx.shadowBlur = 0;
        } else {
          ctx.globalAlpha = cell.opacity * 0.5;
          ctx.fillStyle = cell.color;
          ctx.fillRect(col.x, cell.y, CELL, CELL);
        }
      });
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

    const buildCols = () => {
      const cols: Column[] = [];
      for (let x = 0; x < c.width; x += CELL + GAP) {
        const len = 3 + Math.floor(Math.random() * 6);
        cols.push({
          x,
          cells: Array.from({length: len}, (_, i) => ({
            y: -i * (CELL + GAP) - Math.random() * c.height,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            opacity: (len - i) / len,
          })),
          speed: 1 + Math.random() * 1.5,
        });
      }
      colsRef.current = cols;
    };

    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; buildCols(); };
    resize(); window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={ref} className="background-canvas" style={{opacity:0.45}} />;
}
