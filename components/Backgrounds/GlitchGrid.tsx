import { useRef, useEffect, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

const SYMBOLS = "■□◆◇▲△▼▽●○★☆✦✧";

export default function GlitchGrid() {
  const cvs = useRef<HTMLCanvasElement>(null);
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
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const FONT_SIZE = 16;

    interface Col { x: number; y: number; speed: number; chars: string[]; }
    let cols: Col[] = [];

    const buildCols = () => {
      const colCount = Math.floor(c.width / FONT_SIZE);
      cols = Array.from({ length: colCount }, (_, i) => ({
        x: i * FONT_SIZE,
        y: -Math.random() * c.height,
        speed: 0.8 + Math.random() * 1.6,
        chars: Array.from({ length: 20 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
      }));
    };

    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; buildCols(); };
    resize(); window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgba(13,13,26,0.15)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = `${FONT_SIZE}px monospace`;
      for (const col of cols) {
        col.chars.forEach((ch, i) => {
          const cy = col.y - i * FONT_SIZE;
          if (cy < -FONT_SIZE || cy > c.height) return;
          const brightness = 1 - i / col.chars.length;
          ctx.fillStyle = i === 0
            ? `rgba(200,255,200,${brightness * 0.9})`
            : `rgba(0,${Math.floor(180 * brightness + 40)},${Math.floor(60 * brightness)},${brightness * 0.7})`;
          if (Math.random() < 0.02) col.chars[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          ctx.fillText(ch, col.x, cy);
        });
        col.y += col.speed;
        if (col.y - col.chars.length * FONT_SIZE > c.height) col.y = -Math.random() * c.height * 0.5;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={cvs} className="background-canvas" />;
}
