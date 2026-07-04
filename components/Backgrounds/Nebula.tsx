import { useEffect, useRef, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

const IS_MOBILE = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function Nebula({ reducedMotion: _reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef<((timestamp: number) => void) | null>(null);
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
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let tick = 0;
    let lastFrameTime = 0;
    const TARGET_MS = IS_MOBILE ? 33.3 : 0;

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

    // Nebula clouds — span the brand range (purple 270 / magenta 290 / pink 320)
    // for color cohesion with the rest of the background set.
    const BRAND_HUES = [270, 290, 320];
    const clouds: { x: number; y: number; radius: number; hue: number; speed: number; alpha: number }[] = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 220 + 110,
        hue: BRAND_HUES[i % BRAND_HUES.length] + (Math.random() * 16 - 8),
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.06 + 0.1, // depth variation, stays atmospheric
      });
    }

    const draw = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (IS_MOBILE && timestamp - lastFrameTime < TARGET_MS) return;
      lastFrameTime = timestamp;

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
        gradient.addColorStop(0, `hsla(${cloud.hue}, 85%, 45%, ${cloud.alpha})`);
        gradient.addColorStop(0.5, `hsla(${cloud.hue + 18}, 65%, 32%, ${cloud.alpha * 0.55})`);
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
        const a = star.brightness * twinkle;
        // ~1 in 6 stars carries a faint brand tint (gold / pink) for richness;
        // the rest stay white so the field reads clean, not noisy.
        const tint = (star.x * 0.123 + star.y * 0.077) % 6;
        ctx.fillStyle = tint < 0.5
          ? `rgba(249, 189, 34, ${a})`   // gold accent
          : tint < 1.0
            ? `rgba(243, 174, 255, ${a})` // pink accent
            : `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      tick++;
    };
    rafRef.current = requestAnimationFrame(draw);
    drawRef.current = draw;

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="background-canvas" />;
}
export default Nebula;
