import { useEffect, useRef } from "react";

const POOL_SIZE = 100;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  hue: number;
  active: boolean;
}

interface MouseTrailProps {
  particleCount?: number;
  fadeSpeed?: number;
  gravity?: number;
  enabled?: boolean;
}

// Pre-allocated particle pool
const particlePool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
  x: 0, y: 0, vx: 0, vy: 0, alpha: 0, size: 0, hue: 0, active: false,
}));

function getParticle(): Particle | null {
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!particlePool[i].active) {
      particlePool[i].active = true;
      return particlePool[i];
    }
  }
  // Pool exhausted - recycle oldest (skip first 10 to avoid immediate reuse)
  const p = particlePool[10];
  p.active = true;
  return p;
}

function resetParticle(p: Particle) {
  p.active = false;
}

export function MouseTrail({
  particleCount = 5,
  fadeSpeed = 0.02,
  gravity = 0.02,
  enabled = true,
}: MouseTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (lastPosRef.current) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) return;
      }

      lastPosRef.current = { x, y };

      // Spawn from pool
      for (let i = 0; i < particleCount; i++) {
        const p = getParticle();
        if (!p) continue;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        p.vx = Math.cos(angle) * speed - 0.5;
        p.vy = Math.sin(angle) * speed - 0.5;
        p.alpha = 0.8 + Math.random() * 0.2;
        p.size = Math.random() * 4 + 2;
        p.hue = Math.random() * 80 + 260; // 260-340 = purple/magenta range
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = particlePool[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.alpha -= fadeSpeed;

        if (p.alpha <= 0) {
          resetParticle(p);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup: reset all particles
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (let i = 0; i < POOL_SIZE; i++) resetParticle(particlePool[i]);
    };
  }, [enabled, particleCount, fadeSpeed, gravity]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
      aria-hidden="true"
    />
  );
}