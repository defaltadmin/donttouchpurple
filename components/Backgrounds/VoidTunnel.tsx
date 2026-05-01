import { useEffect, useRef } from "react";

export function VoidTunnel({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number; let t = 0;
    const draw = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      for (let i = 0; i < 12; i++) {
        const phase = ((t * speed * 0.015) + i / 12) % 1;
        const r = phase * Math.max(canvas.width, canvas.height) * 0.75;
        const alpha = (1 - phase) * 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 38, 211, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      t++; raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speed]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} />;
}
