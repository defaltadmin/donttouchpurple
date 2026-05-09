import { useEffect, useRef } from "react";
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from '../../utils/cleanup-pattern';

export default function CellBreath() {
  const ref = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<{ y: number; speed: number; width: number; alpha: number; hue: number; trail: number; }[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;

    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "rgba(13,13,26,0.08)";
    ctx.fillRect(0, 0, W, H);
    for (const ln of linesRef.current) {
      const grad = ctx.createLinearGradient(0, ln.y - ln.trail, W, ln.y);
      grad.addColorStop(0, `hsla(${ln.hue},100%,60%,0)`);
      grad.addColorStop(0.6, `hsla(${ln.hue},100%,60%,${ln.alpha * 0.3})`);
      grad.addColorStop(1, `hsla(${ln.hue},100%,70%,${ln.alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, ln.y - ln.trail, W, ln.trail);
      ctx.fillStyle = `hsla(${ln.hue},100%,85%,${ln.alpha})`;
      ctx.fillRect(0, ln.y - ln.width, W, ln.width * 2);
      ln.y += ln.speed;
      if (ln.y > H + ln.trail) ln.y = -ln.trail;
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
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctxRef.current = ctx;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    linesRef.current = Array.from({ length: 8 }, () => ({
      y: Math.random() * window.innerHeight,
      speed: 0.4 + Math.random() * 0.8,
      width: 1 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.4,
      hue: 170 + Math.random() * 40,
      trail: 60 + Math.random() * 120,
    }));

    return () => {
      window.removeEventListener("resize", resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={ref} className="background-canvas" />;
}
