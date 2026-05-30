import { useRef, useEffect } from "react";
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const BASE_SPEED = 0.35;

interface Props { rareColor?: string; }

export default function PulseField({ rareColor }: Props) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const c = cvs.current; if (!c) return;
    const ctx = ctxRef.current; if (!ctx) return;
    if (c.width !== window.innerWidth) c.width = window.innerWidth;
    if (c.height !== window.innerHeight) c.height = window.innerHeight;
    const W = c.width, H = c.height;
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
      ctx.fillRect(cx - r, cy - r, bs, bs);
      ctx.fillRect(cx + r - bs, cy - r, bs, bs);
      ctx.fillRect(cx - r, cy + r - bs, bs, bs);
      ctx.fillRect(cx + r - bs, cy + r - bs, bs, bs);
    }
  });

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    ctxRef.current = c.getContext("2d");
    return () => { ctxRef.current = null; };
  }, []);

  useEffect(() => {
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => {
      unregister?.();
      stop();
    };
  }, [register, start, stop]);

  return <canvas ref={cvs} className="background-canvas" />;
}
