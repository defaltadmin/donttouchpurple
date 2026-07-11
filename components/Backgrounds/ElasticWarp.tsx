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
  // Gradient cache — recreated only when glowRadius changes significantly
  _cachedGradient: CanvasGradient | null;
  _cachedGlowRadius: number;
}

const PARTICLE_COUNT = 120;
const GRAVITY = 0.0008;
const DAMPING = 0.985;
const MOUSE_RADIUS = 300;
const MAX_SPEED = 3.5;

// Brand palette (DESIGN.md) — magenta / pink / gold / purple only
const COLORS = [
  'rgba(253, 169, 255,',  // #fda9ff
  'rgba(243, 174, 255,',  // #f3aeff
  'rgba(249, 189, 34,',   // #f9bd22
  'rgba(192, 38, 211,',   // #c026d3
  'rgba(253, 169, 255,',  // weight pinks slightly
  'rgba(192, 38, 211,',   // weight purple
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
    _cachedGradient: null,
    _cachedGlowRadius: -1,
  };
}

export default function ElasticWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || reducedMotion) return;

    const maybeCtx = canvasEl.getContext('2d');
    if (!maybeCtx) return;
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
      // Clamp particle positions to new viewport
      for (const p of particles) {
        if (p.x > w) p.x = Math.random() * w;
        if (p.y > h) p.y = Math.random() * h;
      }
    }

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

    // Pause rAF when tab hidden instead of burning cycles
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animationId = requestAnimationFrame(draw);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Pre-compute cursor proximity squared threshold
    const mouseRadiusSq = MOUSE_RADIUS * MOUSE_RADIUS;

    function draw(time: number) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, w, h);

      const t = time * 0.001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 1) {
          const influence = Math.min(1, MOUSE_RADIUS / dist);
          const force = GRAVITY * influence;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const proximity = Math.max(0, 1 - dist / MOUSE_RADIUS);
        p.radius = p.baseRadius * (1 + proximity * 1.5);

        const glowPulse = Math.sin(t * 2 + p.glowPhase) * 0.3 + 0.7;
        const intensity = p.glowIntensity * glowPulse * (0.6 + proximity * 0.8);
        const alpha = p.opacity * (0.5 + proximity * 0.5);

        // Draw glow — cache gradient per particle, recreate only when radius shifts >0.5px
        const glowRadius = p.radius * (3 + proximity * 4);
        if (p._cachedGradient === null || Math.abs(glowRadius - p._cachedGlowRadius) > 0.5) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
          g.addColorStop(0, p.color + (alpha * intensity * 0.8) + ')');
          g.addColorStop(0.4, p.color + (alpha * intensity * 0.3) + ')');
          g.addColorStop(1, p.color + '0)');
          p._cachedGradient = g;
          p._cachedGlowRadius = glowRadius;
        }
        ctx.fillStyle = p._cachedGradient;
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

      // Connection lines — only run when cursor is near particles
      let anyCursorNear = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if ((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2 < mouseRadiusSq) {
          anyCursorNear = true;
          break;
        }
      }
      if (anyCursorNear) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const lineDistSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
            if (lineDistSq < 6400) { // 80²
              const lineDist = Math.sqrt(lineDistSq);
              const midDistToMouse = Math.sqrt(
                ((a.x + b.x) / 2 - mouse.x) ** 2 +
                ((a.y + b.y) / 2 - mouse.y) ** 2
              );
              const lineAlpha = (1 - lineDist / 80) * Math.min(1, MOUSE_RADIUS / midDistToMouse) * 0.15;
              ctx.strokeStyle = `rgba(192, 38, 211, ${lineAlpha})`; // brand #c026d3
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
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
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="dtp-bg-canvas"
      aria-hidden="true"
    />
  );
}
