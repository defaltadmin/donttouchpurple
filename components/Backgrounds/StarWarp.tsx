import { useEffect, useRef } from "react";

export function StarWarp({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const STARS = 200;
    const stars = Array.from({ length: STARS }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
    }));
    const draw = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      ctx.fillStyle = "rgba(0,0,0,0)"; ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      for (const s of stars) {
        s.z -= 0.004 * speed;
        if (s.z <= 0) { s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; s.z = 1; }
        const sx = (s.x / s.z) * cx + cx;
        const sy = (s.y / s.z) * cy + cy;
        const r = Math.max(0.4, (1 - s.z) * 2.5);
        const alpha = 1 - s.z;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = s.z < 0.3 ? `rgba(192,38,211,${alpha})` : `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speed]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} />;
}
