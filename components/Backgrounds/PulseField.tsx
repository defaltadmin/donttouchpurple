import { useRef, useEffect, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

const BASE_SPEED = 0.35;

interface Props { rareColor?: string; }

export default function PulseField({ rareColor }: Props) {
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

  const draw = useCallback(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width = window.innerWidth;
    const H = c.height = window.innerHeight;
    const t = performance.now() * 0.001 * BASE_SPEED;

    ctx.fillStyle = "rgba(13,13,26,0.18)";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const maxR = Math.max(W, H) * 0.6;
    const ringCount = 6;

    for (let i = 0; i < ringCount; i++) {
      const phase = t * 0.7 + i * (Math.PI * 2 / ringCount);
      const r = 30 + ((phase * 40) % maxR);
      const alpha = 0.25 * (1 - r / maxR);

      ctx.strokeStyle = rareColor
        ? `${rareColor}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
        : `rgba(192,38,211,${alpha})`;
      ctx.lineWidth = 2.5;

      const s = r * 2;
      ctx.strokeRect(cx - r, cy - r, s, s);

      const bs = 8;
      ctx.fillStyle = rareColor || "rgba(192,38,211,0.6)";
      [[cx - r, cy - r], [cx + r - bs, cy - r], [cx - r, cy + r - bs], [cx + r - bs, cy + r - bs]].forEach(([x, y]) => {
        ctx.fillRect(x, y, bs, bs);
      });
    }
  }, [rareColor]);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    drawRef.current = loop;
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return <canvas ref={cvs} className="background-canvas" />;
}
