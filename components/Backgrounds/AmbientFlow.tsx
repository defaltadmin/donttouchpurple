import { useEffect, useRef } from "react";
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

interface Drifter {
  x: number; y: number;
  vx: number; vy: number;
  size: number; shape: "square" | "diamond" | "triangle";
  opacity: number; rotation: number; rotSpeed: number;
}

export default function AmbientFlow() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Drifter[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const { start, stop } = useSafeRaf(() => {
    const ctx = ctxRef.current;
    const canvas = cvs.current;
    if (!ctx || !canvas) return;

    ctx.fillStyle = "rgba(13,13,26,0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of shapesRef.current) {
      s.x += s.vx; s.y += s.vy;
      if (s.x < -s.size) s.x = canvas.width + s.size;
      if (s.y < -s.size) s.y = canvas.height + s.size;
      if (s.x > canvas.width + s.size) s.x = -s.size;
      if (s.y > canvas.height + s.size) s.y = -s.size;
      s.rotation += s.rotSpeed;
      ctx.save();
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = "#c026d3";
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      const sz = s.size;
      ctx.beginPath();
      if (s.shape === "square") ctx.rect(-sz/2,-sz/2,sz,sz);
      else if (s.shape === "diamond") { ctx.moveTo(0,-sz/2); ctx.lineTo(sz/2,0); ctx.lineTo(0,sz/2); ctx.lineTo(-sz/2,0); ctx.closePath(); }
      else { ctx.moveTo(0,-sz/2); ctx.lineTo(sz/2,sz/2); ctx.lineTo(-sz/2,sz/2); ctx.closePath(); }
      ctx.fill();
      ctx.restore();
    }
  });

  useEffect(() => {
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => {
      unregister?.();
      stop();
    };
  }, [register, start, stop]);

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctxRef.current = ctx;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    shapesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 12 + Math.random() * 24,
      shape: (["square","diamond","triangle"] as const)[Math.floor(Math.random()*3)],
      opacity: 0.04 + Math.random() * 0.08,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.002,
    }));

    return () => {
      window.removeEventListener("resize", resize);
      ctxRef.current = null;
    };
  }, []);

  return <canvas ref={cvs} className="background-canvas" />;
}
