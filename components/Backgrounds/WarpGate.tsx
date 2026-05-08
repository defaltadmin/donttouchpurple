import { useRef, useEffect, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

const ACCENT = ["#3b82f6","#06b6d4","#f97316","#22c55e","#eab308","#ec4899"];

export default function WarpGate() {
  const ref = useRef<HTMLCanvasElement>(null);
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
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;

    interface Hex { cx: number; cy: number; color: string; alpha: number; targetAlpha: number; nextPulse: number; }
    let hexes: Hex[] = [];
    const R = 32;

    const buildHexes = (W: number, H: number) => {
      hexes = [];
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
    };

    const resize = () => {
      c.width = window.innerWidth; c.height = window.innerHeight;
      buildHexes(c.width, c.height);
    };
    resize(); window.addEventListener("resize", resize);

    function drawHex(cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    }

    const draw = () => {
      ctx.fillStyle = "rgba(13,13,26,0.12)";
      ctx.fillRect(0, 0, c.width, c.height);
      const now = Date.now();
      for (const h of hexes) {
        if (now > h.nextPulse) {
          h.color = ACCENT[Math.floor(Math.random() * ACCENT.length)];
          h.targetAlpha = 0.12 + Math.random() * 0.22;
          h.nextPulse = now + 1500 + Math.random() * 5000;
        }
        h.alpha += (h.targetAlpha - h.alpha) * 0.04;
        if (Math.abs(h.alpha - h.targetAlpha) < 0.001) h.targetAlpha = 0.03 + Math.random() * 0.05;
        drawHex(h.cx, h.cy, R - 2);
        ctx.globalAlpha = h.alpha;
        ctx.fillStyle = h.color;
        ctx.fill();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = h.color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="background-canvas" />;
}
