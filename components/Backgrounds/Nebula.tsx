import { useEffect, useRef, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

export function Nebula({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef<(() => void) | null>(null);
  const { register } = useBackgroundController(true);

  const pause = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }, []);

  const resume = useCallback(() => {
    if (!rafRef.current && drawRef.current) rafRef.current = requestAnimationFrame(drawRef.current);
  }, []);

  useEffect(() => {
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume]);

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

    // Stars
    const stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        brightness: Math.random() * 0.8 + 0.2,
      });
    }

    // Nebula clouds
    const clouds: { x: number; y: number; radius: number; hue: number; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 200 + 100,
        hue: Math.random() * 60 + 260, // purple range
        speed: Math.random() * 0.3 + 0.1,
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const t = tick * 0.01;

      // Dark space background
      ctx.fillStyle = "rgba(8, 4, 20, 0.15)";
      ctx.fillRect(0, 0, w, h);

      // Nebula clouds
      for (const cloud of clouds) {
        const x = cloud.x + Math.sin(t * cloud.speed) * 50;
        const y = cloud.y + Math.cos(t * cloud.speed * 0.7) * 30;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, cloud.radius);
        gradient.addColorStop(0, `hsla(${cloud.hue}, 80%, 40%, 0.15)`);
        gradient.addColorStop(0.5, `hsla(${cloud.hue + 20}, 60%, 30%, 0.08)`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - cloud.radius, y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
      }

      // Stars
      for (const star of stars) {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = h;
          star.x = Math.random() * w;
        }
        const twinkle = Math.sin(t * 2 + star.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      tick++;
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="background-canvas" />;
}
