import { useRef, useEffect, useCallback } from "react";

const SHAPES = ["square", "diamond", "triangle"];
const COUNT = 18;
const BASE_SPEED = 0.25; // very slow

interface Shape { type: string; x: number; y: number; size: number; vx: number; vy: number; alpha: number; hue: number; }

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export function AmbientFlow() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const shapes = useRef<Shape[]>([]);

  const init = useCallback((W: number, H: number) => {
    shapes.current = Array.from({ length: COUNT }, () => ({
      type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      x: rand(0, W), y: rand(0, H),
      size: rand(12, 32),
      vx: rand(-0.4, 0.4), vy: rand(-0.3, 0.3),
      alpha: rand(0.06, 0.18),
      hue: rand(250, 290),
    }));
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, s: Shape) => {
    ctx.fillStyle = `hsla(${s.hue}, 60%, 55%, ${s.alpha})`;
    ctx.strokeStyle = `hsla(${s.hue}, 60%, 55%, ${s.alpha * 1.5})`;
    ctx.lineWidth = 1;
    const { type, x, y, size } = s;
    if (type === "square") {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    } else if (type === "diamond") {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size / 2, y);
      ctx.lineTo(x, y + size / 2); ctx.lineTo(x - size / 2, y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  };

  const draw = useCallback(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    ctx.fillStyle = "rgba(13,13,26,0.20)";
    ctx.fillRect(0, 0, W, H);

    shapes.current.forEach(s => {
      s.x += s.vx * BASE_SPEED * 60;
      s.y += s.vy * BASE_SPEED * 60;
      if (s.x < -50) s.x = W + 20; if (s.x > W + 50) s.x = -20;
      if (s.y < -50) s.y = H + 20; if (s.y > H + 50) s.y = -20;
      drawShape(ctx, s);
    });
  }, []);

  useEffect(() => {
    init(window.innerWidth, window.innerHeight);
    let id: number;
    const loop = () => { draw(); id = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(id);
  }, [draw, init]);

  return <canvas ref={cvs} style={{ position: "fixed", width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }} />;
}
