// NeonPulse — horizontal cyan/teal scanlines sweeping downward. No purple.
import { useEffect, useRef } from "react";

export default function CellBreath() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    interface Line { y: number; speed: number; width: number; alpha: number; hue: number; trail: number; }
    const lines: Line[] = Array.from({ length: 8 }, () => ({
      y: Math.random() * window.innerHeight,
      speed: 0.4 + Math.random() * 0.8,
      width: 1 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.4,
      hue: 170 + Math.random() * 40,
      trail: 60 + Math.random() * 120,
    }));

    let raf: number;
    const draw = () => {
      const W = c.width, H = c.height;
      ctx.fillStyle = "rgba(13,13,26,0.08)";
      ctx.fillRect(0, 0, W, H);
      for (const ln of lines) {
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
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="background-canvas" />;
}
