import { useRef, useEffect } from "react";
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from '../../utils/cleanup-pattern';

const ACCENT = ["#3b82f6","#06b6d4","#f97316","#22c55e","#eab308","#ec4899"];

export default function WarpGate() {
  const ref = useRef<HTMLCanvasElement>(null);
  const hexesRef = useRef<{ cx: number; cy: number; color: string; alpha: number; targetAlpha: number; nextPulse: number; }[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;

    ctx.fillStyle = "rgba(13,13,26,0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    for (const h of hexesRef.current) {
      if (now > h.nextPulse) {
        h.color = ACCENT[Math.floor(Math.random() * ACCENT.length)];
        h.targetAlpha = 0.12 + Math.random() * 0.22;
        h.nextPulse = now + 1500 + Math.random() * 5000;
      }
      h.alpha += (h.targetAlpha - h.alpha) * 0.04;
      if (Math.abs(h.alpha - h.targetAlpha) < 0.001) h.targetAlpha = 0.03 + Math.random() * 0.05;

      const cx = h.cx, cy = h.cy;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(cx + 30 * Math.cos(a), cy + 30 * Math.sin(a))
                : ctx.lineTo(cx + 30 * Math.cos(a), cy + 30 * Math.sin(a));
      }
      ctx.closePath();

      ctx.globalAlpha = h.alpha;
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 0.5;
      ctx.stroke();
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
    const ctx = c.getContext("2d")!;
    ctxRef.current = ctx;

    const buildHexes = (W: number, H: number) => {
      const R = 32;
      const hexes: { cx: number; cy: number; color: string; alpha: number; targetAlpha: number; nextPulse: number; }[] = [];
      const hw = R * 2; const hh = Math.sqrt(3) * R;
      for (let row = -1; row < H / hh + 2; row++) {
        for (let col = -1; col < W / (hw * 0.75) + 2; col++) {
          hexes.push({
            cx: col * hw * 0.75,
            cy: row * hh + (col % 2 === 0 ? 0 : hh / 2),
            color: ACCENT[Math.floor(Math.random() * ACCENT.length)],
            alpha: 0.03 + Math.random() * 0.06,
            targetAlpha: 0.03 + Math.random() * 0.06,
            nextPulse: Date.now() + Math.random() * 4000,
          });
        }
      }
      hexesRef.current = hexes;
    };

    const resize = () => {
      c.width = window.innerWidth; c.height = window.innerHeight;
      buildHexes(c.width, c.height);
    };
    resize(); window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={ref} className="background-canvas" />;
}
