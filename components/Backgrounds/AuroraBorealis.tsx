import { useEffect, useRef, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

interface Wave { y: number; amplitude: number; frequency: number; speed: number; hue: number; opacity: number; }

// Brand-family hues: magenta/pink band + one gold accent band (hue ~48).
const WAVES: Wave[] = [
  { y: 0.30, amplitude: 80, frequency: 0.003, speed: 0.020, hue: 300, opacity: 0.15 },
  { y: 0.35, amplitude: 60, frequency: 0.004, speed: 0.015, hue: 320, opacity: 0.12 },
  { y: 0.40, amplitude: 100, frequency: 0.002, speed: 0.025, hue: 280, opacity: 0.10 },
  { y: 0.46, amplitude: 55, frequency: 0.005, speed: 0.030, hue: 48,  opacity: 0.08 }, // gold accent
];

export function AuroraBorealis({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const drawRef = useRef<(() => void) | null>(null);
  const { register } = useBackgroundController(true);

  const pause = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }, []);
  const resume = useCallback(() => {
    if (!rafRef.current && drawRef.current) rafRef.current = requestAnimationFrame(drawRef.current);
  }, []);

  useEffect(() => {
    if (reducedMotion) return; // static frame handles the controller-less case
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let tick = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const lowQ = () => document.documentElement.hasAttribute('data-low-quality');

    const stars: { x: number; y: number; size: number; brightness: number }[] = [];
    const starCount = lowQ() ? 40 : 100;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.6,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
      });
    }

    const renderFrame = () => {
      const w = canvas.width, h = canvas.height;
      const low = lowQ();
      const t = tick * 0.01;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "rgb(5, 2, 15)");
      skyGrad.addColorStop(0.5, "rgb(10, 5, 25)");
      skyGrad.addColorStop(1, "rgb(15, 8, 30)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      for (const star of stars) {
        const twinkle = reducedMotion ? 1 : Math.sin(t * 3 + star.x * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const waves = low ? WAVES.slice(0, 2).concat(WAVES[3]) : WAVES; // keep gold band in low-Q
      for (const wave of waves) {
        ctx.beginPath();
        const baseY = h * wave.y;
        for (let x = 0; x <= w; x += (low ? 6 : 3)) {
          const y = baseY
            + Math.sin(x * wave.frequency + t * wave.speed * 10) * wave.amplitude
            + Math.sin(x * wave.frequency * 2 + t * wave.speed * 7) * wave.amplitude * 0.3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();

        const g = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, baseY + wave.amplitude * 2);
        g.addColorStop(0, `hsla(${wave.hue}, 80%, 60%, 0)`);
        g.addColorStop(0.3, `hsla(${wave.hue}, 80%, 60%, ${wave.opacity})`);
        g.addColorStop(0.6, `hsla(${wave.hue + 20}, 60%, 50%, ${wave.opacity * 0.5})`);
        g.addColorStop(1, `hsla(${wave.hue}, 80%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      if (!low && !reducedMotion) {
        for (let i = 0; i < 5; i++) {
          const x = (Math.sin(t * 0.5 + i * 2) * 0.5 + 0.5) * w;
          const y = h * 0.3 + Math.sin(t * 0.3 + i) * 50;
          const shimmer = ctx.createRadialGradient(x, y, 0, x, y, 100);
          shimmer.addColorStop(0, `rgba(255, 255, 255, ${0.03 + Math.sin(t + i) * 0.02})`);
          shimmer.addColorStop(1, "transparent");
          ctx.fillStyle = shimmer;
          ctx.fillRect(x - 100, y - 100, 200, 200);
        }
      }
    };

    if (reducedMotion) {
      renderFrame(); // one static frame, no loop
    } else {
      const draw = () => {
        if (document.hidden) { rafRef.current = requestAnimationFrame(draw); return; }
        renderFrame();
        tick++;
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
      drawRef.current = draw;
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
export default AuroraBorealis;
