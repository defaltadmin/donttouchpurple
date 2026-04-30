import { useEffect, useRef } from "react";

export function VoidTunnel({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let tick = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "#0d0820";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const t = tick * 0.02;

      for (let i = 0; i < 20; i++) {
        const r = 50 + i * 25 + (tick * 2) % 50;
        const hue = (280 + i * 5) % 360;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 70%, 40%, ${1 - i / 20})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      tick++;
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
