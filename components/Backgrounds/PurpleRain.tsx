// components/Backgrounds/PurpleRain.tsx
import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';

interface PurpleRainProps {
  reducedMotion?: boolean;
}

interface Shape {
  x: number; y: number;
  size: number; speed: number;
  opacity: number; opacityTarget: number; opacityBase: number; opacityRange: number;
  breathPhase: number; breathSpeed: number;
  type: "square" | "circle" | "triangle";
  filled: boolean; rotation: number; rotSpeed: number;
}

export interface PurpleRainHandle { pause: () => void; resume: () => void; }

const makeShape = (canvasW: number, canvasH: number, y?: number): Shape => {
  const types: Shape["type"][] = ["square", "circle", "triangle"];
  const size        = 18 + Math.random() * 72;
  const opacityBase = 0.06 + Math.random() * 0.09;
  return {
    x: Math.random() * canvasW,
    y: y ?? -size - Math.random() * canvasH,
    size, speed: 0.18 + Math.random() * 0.32,
    opacity: opacityBase, opacityTarget: opacityBase, opacityBase,
    opacityRange:  0.04 + Math.random() * 0.06,
    breathPhase:   Math.random() * Math.PI * 2,
    breathSpeed:   0.004 + Math.random() * 0.008,
    type:   types[Math.floor(Math.random() * 3)],
    filled: Math.random() > 0.5,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.002,
  };
};

const drawShape = (ctx: CanvasRenderingContext2D, s: Shape, purple: string) => {
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = purple;
  ctx.fillStyle   = purple;
  ctx.lineWidth   = 1.5;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation);

  if (s.type === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
    if (s.filled) ctx.fill(); else ctx.stroke();
  } else if (s.type === "square") {
    const h = s.size / 2;
    if (s.filled) ctx.fillRect(-h, -h, s.size, s.size);
    else ctx.strokeRect(-h, -h, s.size, s.size);
  } else {
    const r = s.size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.866, r * 0.5);
    ctx.lineTo(-r * 0.866, r * 0.5);
    ctx.closePath();
    if (s.filled) ctx.fill(); else ctx.stroke();
  }
  ctx.restore();
};

const PurpleRain = forwardRef<PurpleRainHandle, PurpleRainProps>(({ reducedMotion = false }, ref) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animationRef   = useRef<number | null>(null);
  const shapesRef      = useRef<Shape[]>([]);
  const lastFrameRef   = useRef(0);
  const purpleColorRef = useRef<string>('#c026d3');   // FIX: read once, not per-frame
  const frameInterval  = reducedMotion ? 33 : 16;
  const { register }   = useBackgroundController(!reducedMotion);

  // Read CSS custom property once on mount (and on theme change if you add one)
  useEffect(() => {
    const readColor = () => {
      purpleColorRef.current =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--purple').trim() || '#c026d3';
    };
    readColor();
    window.addEventListener('dtp:theme-change', readColor);
    return () => window.removeEventListener('dtp:theme-change', readColor);
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const animate = useCallback((time: number) => {
    animationRef.current = requestAnimationFrame(animate);
    if (document.hidden) return;
    if (time - lastFrameRef.current < frameInterval) return;
    lastFrameRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // FIX: use cached ref — no layout thrash per frame
    const purple = purpleColorRef.current;

    for (const s of shapesRef.current) {
      s.y           += s.speed;
      s.rotation    += s.rotSpeed;
      s.breathPhase += s.breathSpeed;
      s.opacity      = s.opacityBase + Math.sin(s.breathPhase) * s.opacityRange;
      s.opacity      = Math.max(0.03, Math.min(0.15, s.opacity));

      if (s.y - s.size / 2 > height) Object.assign(s, makeShape(width, height));
      drawShape(ctx, s, purple);
    }

  }, [reducedMotion, frameInterval]);

  const resume = useCallback(() => {
    if (reducedMotion || !canvasRef.current) return;
    if (!animationRef.current) animate(performance.now());
  }, [reducedMotion, animate]);

  useEffect(() => {
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume]);

  useImperativeHandle(ref, () => ({ pause, resume }));

  useEffect(() => {
    if (reducedMotion) { pause(); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    shapesRef.current = [];
    for (let i = 0; i < 28; i++) {
      shapesRef.current.push(makeShape(canvas.width, canvas.height, Math.random() * canvas.height));
    }

    const handleResize = () => {
      if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    };
    window.addEventListener('resize', handleResize);

    animate(performance.now());

    return () => {
      pause();
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, pause, animate]);

  return <canvas ref={canvasRef} className="background-canvas" />;
});

export default PurpleRain;
