// components/Backgrounds/ElasticWarp.tsx — Gravitational particle vortex
// Glowing stars/dots that continuously gravitate toward the mouse cursor
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  glowIntensity: number;
  glowPhase: number;
  opacity: number;
}

const PARTICLE_COUNT = 120;
const GRAVITY = 0.0008;
const DAMPING = 0.985;
const MOUSE_RADIUS = 300;
const MAX_SPEED = 3.5;

const COLORS = [
  'rgba(191, 64, 255,',   // purple
  'rgba(138, 43, 226,',   // blue-violet
  'rgba(255, 105, 180,',  // pink
  'rgba(100, 149, 237,',  // cornflower blue
  'rgba(200, 160, 255,',  // light lavender
  'rgba(160, 120, 240,',  // medium purple
  'rgba(255, 200, 255,',  // light pink
  'rgba(120, 180, 255,',  // sky blue
];

function createParticle(w: number, h: number): Particle {
  const x = Math.random() * w;
  const y = Math.random() * h;
  const baseRadius = 1 + Math.random() * 2.5;
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: baseRadius,
    baseRadius,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    glowIntensity: 0.3 + Math.random() * 0.7,
    glowPhase: Math.random() * Math.PI * 2,
    opacity: 0.4 + Math.random() * 0.6,
  };
}

export default function ElasticWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || reducedMotion) return;

    const maybeCtx = canvasEl.getContext('2d');
    if (!maybeCtx) return;
    // Store in consts so TypeScript narrows inside nested closures
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const mouse = { x: w / 2, y: h / 2 };
    let animationId: number;
    const particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    // Initialize particles
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(w, h));
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }

    function draw(time: number) {
      if (document.hidden) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Dark background
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, w, h);

      const t = time * 0.001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gravitational pull toward mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 1) {
          // Gravity strength falls off with distance, capped at MOUSE_RADIUS
          const influence = Math.min(1, MOUSE_RADIUS / dist);
          const force = GRAVITY * influence;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        // Gentle return-to-rest force (prevents particles from orbiting forever)
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Pulse radius based on proximity to mouse
        const proximity = Math.max(0, 1 - dist / MOUSE_RADIUS);
        p.radius = p.baseRadius * (1 + proximity * 1.5);

        // Glow intensity pulses
        const glowPulse = Math.sin(t * 2 + p.glowPhase) * 0.3 + 0.7;
        const intensity = p.glowIntensity * glowPulse * (0.6 + proximity * 0.8);
        const alpha = p.opacity * (0.5 + proximity * 0.5);

        // Draw glow
        const glowRadius = p.radius * (3 + proximity * 4);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        gradient.addColorStop(0, p.color + (alpha * intensity * 0.8) + ')');
        gradient.addColorStop(0.4, p.color + (alpha * intensity * 0.3) + ')');
        gradient.addColorStop(1, p.color + '0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = p.color + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core for larger particles
        if (p.baseRadius > 2) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw connection lines between nearby particles near cursor
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const lineDist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (lineDist < 80) {
            const midDistToMouse = Math.sqrt(
              ((a.x + b.x) / 2 - mouse.x) ** 2 +
              ((a.y + b.y) / 2 - mouse.y) ** 2
            );
            const lineAlpha = (1 - lineDist / 80) * Math.min(1, MOUSE_RADIUS / midDistToMouse) * 0.15;
            ctx.strokeStyle = `rgba(180, 130, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas"
      aria-hidden="true"
    />
  );
}
