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
  hueMin?: number;
  hueMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  enabled?: boolean;
}

function createPool(): Particle[] {
  return Array.from({ length: POOL_SIZE }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, alpha: 0, size: 0, hue: 0, active: false,
  }));
}

function getParticle(pool: Particle[]): Particle | null {
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!pool[i].active) {
      pool[i].active = true;
      return pool[i];
    }
  }
  const p = pool[10];
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
  hueMin = 260,
  hueMax = 340,
  sizeMin = 2,
  sizeMax = 6,
  enabled = true,
}: MouseTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const particlePoolRef = useRef<Particle[]>(createPool());

  useEffect(() => {
    if (!enabled) return;
    const pool = particlePoolRef.current;

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

    const handleMove = (e: PointerEvent) => {
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
        const p = getParticle(pool);
        if (!p) continue;
        activeCount++;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        p.vx = Math.cos(angle) * speed - 0.5;
        p.vy = Math.sin(angle) * speed - 0.5;
        p.alpha = 0.8 + Math.random() * 0.2;
        p.size = Math.random() * (sizeMax - sizeMin) + sizeMin;
        p.hue = Math.random() * (hueMax - hueMin) + hueMin;
      }
    };

    let activeCount = 0;

    const animate = () => {
      if (document.hidden) { rafRef.current = requestAnimationFrame(animate); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      activeCount = 0;

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.alpha -= fadeSpeed;

        if (p.alpha <= 0) {
          resetParticle(p);
          continue;
        }

        activeCount++;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // Canvas has pointer-events: none, use document for reliable tracking
    document.addEventListener("pointermove", handleMove);
    const handleLeave = () => { lastPosRef.current = null; };
    document.addEventListener("pointerleave", handleLeave);
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup: reset all particles
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (let i = 0; i < POOL_SIZE; i++) resetParticle(pool[i]);
    };
  }, [enabled, particleCount, fadeSpeed, gravity, hueMin, hueMax, sizeMin, sizeMax]);

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
