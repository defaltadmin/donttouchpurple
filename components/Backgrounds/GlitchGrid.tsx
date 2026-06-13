import { useRef, useEffect } from "react";
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const SYMBOLS = "■□◆◇▲△▼▽●○★☆✦✧";

export default function GlitchGrid() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const colsRef = useRef<{ x: number; y: number; speed: number; chars: string[]; }[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = cvs.current;
    if (!ctx || !canvas) return;

    const FONT_SIZE = 16;
    ctx.fillStyle = "rgba(13,8,26,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px monospace`;
    for (const col of colsRef.current) {
      col.chars.forEach((ch, i) => {
        const cy = col.y - i * FONT_SIZE;
        if (cy < -FONT_SIZE || cy > canvas.height) return;
        const brightness = 1 - i / col.chars.length;
        // On-brand: bright pink-white lead glyph, trail fades through magenta/purple.
        ctx.fillStyle = i === 0
          ? `rgba(253,230,255,${brightness * 0.95})`
          : `rgba(${Math.floor(150 * brightness + 70)},${Math.floor(40 * brightness + 10)},${Math.floor(180 * brightness + 50)},${brightness * 0.7})`;
        if (Math.random() < 0.02) col.chars[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        ctx.fillText(ch, col.x, cy);
      });
      col.y += col.speed;
      if (col.y - col.chars.length * FONT_SIZE > canvas.height) col.y = -Math.random() * canvas.height * 0.5;
    }
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
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctxRef.current = ctx;
    const FONT_SIZE = 16;

    const buildCols = () => {
      const colCount = Math.floor(c.width / FONT_SIZE);
      colsRef.current = Array.from({ length: colCount }, (_, i) => ({
        x: i * FONT_SIZE,
        y: -Math.random() * c.height,
        speed: 0.8 + Math.random() * 1.6,
        chars: Array.from({ length: 20 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
      }));
    };

    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; buildCols(); };
    resize(); window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={cvs} className="background-canvas" />;
}
