// AmbientFlow — slow diagonal drift of faint geometric shapes
import { useEffect, useRef, useCallback } from "react";
import { useBackgroundController } from '../../hooks/useBackground';

interface Drifter {
  x: number; y: number;
  vx: number; vy: number;
  size: number; shape: "square" | "diamond" | "triangle";
  opacity: number; rotation: number; rotSpeed: number;
}

export default function AmbientFlow() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const drawRef = useRef<(() => void) | null>(null);
  const { register } = useBackgroundController(true);

  const pause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const resume = useCallback(() => {
    if (!rafRef.current && drawRef.current) {
      rafRef.current = requestAnimationFrame(drawRef.current);
    }
  }, []);

  useEffect(() => {
    const unregister = register({ pause, resume });
    return unregister;
  }, [register, pause, resume]);

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    const shapes: Drifter[] = Array.from({ length: 40 }, () => ({
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

    const draw = () => {
      ctx.fillStyle = "rgba(13,13,26,0.12)";
      ctx.fillRect(0,0,c.width,c.height);
      for (const s of shapes) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -s.size) s.x = c.width + s.size;
        if (s.y < -s.size) s.y = c.height + s.size;
        if (s.x > c.width + s.size) s.x = -s.size;
        if (s.y > c.height + s.size) s.y = -s.size;
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
      rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={cvs} className="background-canvas" />;
}
