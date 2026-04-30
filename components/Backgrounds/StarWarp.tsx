import { useEffect, useRef } from "react";

interface Star { x: number; y: number; vx: number; vy: number; size: number }

export function StarWarp({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    starsRef.current = Array.from({ length: 100 }, () => ({
      x: (Math.random() - 0.5) * canvas.width,
      y: (Math.random() - 0.5) * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 0.5,
    }));

    const draw = () => {
      ctx.fillStyle = "rgba(13, 8, 32, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 1.02;
        s.vy *= 1.02;

        if (Math.abs(s.x) > cx) s.x = -s.x;
        if (Math.abs(s.y) > cy) s.y = -s.y;

        ctx.fillStyle = "white";
        ctx.fillRect(cx + s.x, cy + s.y, s.size, s.size);
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: -1, pointerEvents: "none" }} />;
}
