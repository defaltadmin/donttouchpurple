# Complete Code Blocks — All 3 Projects

**Generated for:** MimoCode to apply directly
**Date:** 2026-07-04

---

# PROJECT 1: DTP — Remaining Background Rewrites

Each background follows the proven GridPulse pattern: brand colors, `reducedMotion` prop, `data-low-quality` guard, `dtp-bg-canvas` class.

---

## Background 1: VoidTunnel

**File:** `components/Backgrounds/VoidTunnel.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const RINGS = 6;

export default function VoidTunnel({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    timeRef.current += 0.008;
    const t = timeRef.current;

    for (let i = RINGS; i >= 0; i--) {
      const progress = (i + t * 0.5) % (RINGS + 1) / (RINGS + 1);
      const radius = progress * Math.max(w, h) * 0.5;
      const alpha = (1 - progress) * 0.4;
      const color = COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lowQ ? 1 : 2;
      ctx.globalAlpha = alpha;
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 2: StarWarp

**File:** `components/Backgrounds/StarWarp.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const STAR_COUNT = 120;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#fff'];

interface Star {
  x: number; y: number; z: number; speed: number;
}

export default function StarWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const starsRef = useRef<Star[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = 'rgba(21,16,40,0.15)';
    ctx.fillRect(0, 0, w, h);

    starsRef.current.forEach((s, i) => {
      s.z -= s.speed;
      if (s.z <= 0) { s.z = 1; s.x = (Math.random() - 0.5) * w * 2; s.y = (Math.random() - 0.5) * h * 2; }

      const sx = cx + (s.x / s.z) * 100;
      const sy = cy + (s.y / s.z) * 100;
      if (sx < 0 || sx > w || sy < 0 || sy > h) { s.z = 1; s.x = (Math.random() - 0.5) * w * 2; s.y = (Math.random() - 0.5) * h * 2; }

      const size = Math.max(0.5, (1 - s.z / 800) * 3);
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = Math.min(1, (1 - s.z / 600) * 0.8);
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * 800, speed: 1.5 + Math.random() * 3,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 3: PurpleRain

**File:** `components/Backgrounds/PurpleRain.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const DROP_COUNT = 60;
const COLORS = ['#fda9ff', '#f3aeff', '#c026d3'];

interface Drop {
  x: number; speed: number; length: number; color: string; alpha: number;
}

export default function PurpleRain({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.08)';
    ctx.fillRect(0, 0, w, h);

    dropsRef.current.forEach(d => {
      d.x += d.speed;
      if (d.x > h) { d.x = -d.length; d.speed = 1 + Math.random() * 4; }

      const grad = ctx.createLinearGradient(0, d.x - d.length, 0, d.x);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, d.color);
      ctx.globalAlpha = d.alpha * (lowQ ? 0.4 : 0.6);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lowQ ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(w * d.alpha, d.x - d.length);
      ctx.lineTo(w * d.alpha, d.x);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      dropsRef.current = Array.from({ length: DROP_COUNT }, () => ({
        x: Math.random() * canvas.height,
        speed: 1 + Math.random() * 4,
        length: 30 + Math.random() * 80,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random(),
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 4: DataStream

**File:** `components/Backgrounds/DataStream.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLS = 30;
const CHARS = '01アイウエオカキクケコ∞∑∂∫√';
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

interface Stream { x: number; speed: number; chars: string[]; y: number; }

export default function DataStream({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const streamsRef = useRef<Stream[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.12)';
    ctx.fillRect(0, 0, w, h);

    const fontSize = lowQ ? 12 : 14;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    streamsRef.current.forEach((s, i) => {
      s.y += s.speed;
      if (s.y > h + 200) { s.y = -200; s.chars = Array.from({ length: 15 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]); }

      const color = COLORS[i % COLORS.length];
      s.chars.forEach((ch, j) => {
        const yPos = s.y - j * fontSize;
        if (yPos < 0 || yPos > h) return;
        const alpha = j === 0 ? 1 : Math.max(0.1, 1 - j / s.chars.length);
        ctx.globalAlpha = alpha * (lowQ ? 0.3 : 0.5);
        ctx.fillStyle = j === 0 ? '#fff' : color;
        ctx.fillText(ch, s.x, yPos);
      });
    });
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const colW = canvas.width / COLS;
      streamsRef.current = Array.from({ length: COLS }, (_, i) => ({
        x: i * colW + colW / 2,
        speed: 1.5 + Math.random() * 3,
        y: Math.random() * canvas.height,
        chars: Array.from({ length: 15 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 5: CellBreath

**File:** `components/Backgrounds/CellBreath.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const CELL_COUNT = 12;

interface Cell {
  x: number; y: number; baseRadius: number; phase: number; speed: number; color: string;
}

export default function CellBreath({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellsRef = useRef<Cell[]>([]);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    timeRef.current += 0.015;
    const t = timeRef.current;

    cellsRef.current.forEach(c => {
      const breathe = Math.sin(t * c.speed + c.phase) * 0.3 + 0.7;
      const r = c.baseRadius * breathe;
      ctx.globalAlpha = 0.15 * breathe;
      if (!lowQ) { ctx.shadowColor = c.color; ctx.shadowBlur = 20; }
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      cellsRef.current = Array.from({ length: CELL_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseRadius: 40 + Math.random() * 80,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 6: AmbientFlow

**File:** `components/Backgrounds/AmbientFlow.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];
const BLOB_COUNT = 5;

interface Blob {
  x: number; y: number; vx: number; vy: number; radius: number; color: string; phase: number;
}

export default function AmbientFlow({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.005;

    blobsRef.current.forEach(b => {
      b.x += b.vx + Math.sin(timeRef.current + b.phase) * 0.5;
      b.y += b.vy + Math.cos(timeRef.current + b.phase) * 0.5;
      if (b.x < -b.radius) b.x = w + b.radius;
      if (b.x > w + b.radius) b.x = -b.radius;
      if (b.y < -b.radius) b.y = h + b.radius;
      if (b.y > h + b.radius) b.y = -b.radius;

      const pulse = Math.sin(timeRef.current * 2 + b.phase) * 0.2 + 0.8;
      ctx.globalAlpha = 0.08 * pulse;
      if (!lowQ) { ctx.shadowColor = b.color; ctx.shadowBlur = 30; }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      blobsRef.current = Array.from({ length: BLOB_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 100 + Math.random() * 150,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 7: PulseField

**File:** `components/Backgrounds/PulseField.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const ROWS = 8, COLS = 12;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

export default function PulseField({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.02;

    const cellW = w / COLS, cellH = h / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.hypot(c - COLS / 2, r - ROWS / 2);
        const pulse = Math.sin(timeRef.current - dist * 0.5) * 0.5 + 0.5;
        const color = COLORS[(r + c) % COLORS.length];
        ctx.globalAlpha = pulse * 0.12;
        if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 8; }
        ctx.fillStyle = color;
        const size = cellW * 0.3 * pulse;
        ctx.beginPath();
        ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, Math.max(1, size), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 8: WarpGate

**File:** `components/Backgrounds/WarpGate.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const SEGMENTS = 24;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

export default function WarpGate({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.01;

    const maxR = Math.max(w, h) * 0.6;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2 + timeRef.current;
      const pulse = Math.sin(timeRef.current * 2 + i) * 0.3 + 0.7;
      const r = maxR * pulse;
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.08;
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
      ctx.strokeStyle = color;
      ctx.lineWidth = lowQ ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 9: DigitalRain

**File:** `components/Backgrounds/DigitalRain.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLS = 25;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%';
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

interface Col { x: number; speed: number; y: number; len: number; chars: string[]; }

export default function DigitalRain({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const colsRef = useRef<Col[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.1)';
    ctx.fillRect(0, 0, w, h);

    const fontSize = lowQ ? 11 : 13;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    colsRef.current.forEach((col, ci) => {
      col.y += col.speed;
      if (col.y > h + 200) { col.y = -200; col.chars = Array.from({ length: col.len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]); }

      const color = COLORS[ci % COLORS.length];
      col.chars.forEach((ch, j) => {
        const yPos = col.y - j * fontSize;
        if (yPos < 0 || yPos > h) return;
        ctx.globalAlpha = j === 0 ? 0.9 : Math.max(0.05, 0.6 - j / col.len * 0.6);
        ctx.fillStyle = j === 0 ? '#fff' : color;
        ctx.fillText(ch, col.x, yPos);
      });
    });
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const colW = canvas.width / COLS;
      colsRef.current = Array.from({ length: COLS }, (_, i) => ({
        x: i * colW + colW / 2, speed: 1 + Math.random() * 3,
        y: Math.random() * canvas.height,
        len: 8 + Math.floor(Math.random() * 8),
        chars: Array.from({ length: 16 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 10: AuroraBorealis

**File:** `components/Backgrounds/AuroraBorealis.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];

export default function AuroraBorealis({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.008;

    const bands = lowQ ? 3 : 5;
    for (let i = 0; i < bands; i++) {
      const y = h * (0.2 + i * 0.12);
      const amplitude = 30 + i * 15;
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.06;
      if (!lowQ) { ctx.shadowColor = color; ctx.shadowBlur = 25; }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 8) {
        const wave = Math.sin(x * 0.003 + timeRef.current + i) * amplitude;
        ctx.lineTo(x, y + wave);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 11: Silk

**File:** `components/Backgrounds/Silk.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const LINES = 40;
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22'];

export default function Silk({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.005;

    for (let i = 0; i < LINES; i++) {
      const t = i / LINES;
      const y = t * h;
      const color = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = color;
      ctx.lineWidth = lowQ ? 0.5 : 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const wave = Math.sin(x * 0.002 + timeRef.current + t * 3) * 20 + Math.cos(x * 0.001 + timeRef.current * 0.7) * 15;
        if (x === 0) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 12: Lightning

**File:** `components/Backgrounds/Lightning.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const BOLT_COUNT = 3;
const COLORS = ['#fda9ff', '#f9bd22', '#fff'];

interface Bolt { points: {x:number;y:number}[]; alpha: number; decay: number; color: string; }

export default function Lightning({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const boltsRef = useRef<Bolt[]>([]);
  const timeRef = useRef(0);
  const { register } = useBackgroundController(true);

  function generateBolt(w: number, h: number): Bolt {
    const points: {x:number;y:number}[] = [];
    let x = w * (0.3 + Math.random() * 0.4);
    let y = 0;
    while (y < h) {
      points.push({ x, y });
      x += (Math.random() - 0.5) * 60;
      y += 10 + Math.random() * 30;
    }
    return { points, alpha: 1, decay: 0.015 + Math.random() * 0.01, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  }

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.05)';
    ctx.fillRect(0, 0, w, h);

    timeRef.current += 0.02;
    if (timeRef.current > 2 && boltsRef.current.length < BOLT_COUNT) {
      boltsRef.current.push(generateBolt(w, h));
      timeRef.current = 0;
    }

    boltsRef.current = boltsRef.current.filter(b => {
      b.alpha -= b.decay;
      if (b.alpha <= 0) return false;
      ctx.globalAlpha = b.alpha * 0.6;
      if (!lowQ) { ctx.shadowColor = b.color; ctx.shadowBlur = 15; }
      ctx.strokeStyle = b.color;
      ctx.lineWidth = lowQ ? 1 : 2;
      ctx.beginPath();
      b.points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      return true;
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

## Background 13: PurpleCascade

**File:** `components/Backgrounds/PurpleCascade.tsx` (full replace)

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

const COLORS = ['#fda9ff', '#f3aeff', '#c026d3', '#f9bd22'];
const PARTICLE_COUNT = 80;

interface Particle { x: number; y: number; speed: number; size: number; color: string; wave: number; waveSpeed: number; }

export default function PurpleCascade({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(21,16,40,0.06)';
    ctx.fillRect(0, 0, w, h);

    particlesRef.current.forEach(p => {
      p.y += p.speed;
      p.wave += p.waveSpeed;
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }

      const xPos = p.x + Math.sin(p.wave) * 20;
      ctx.globalAlpha = 0.4;
      if (!lowQ) { ctx.shadowColor = p.color; ctx.shadowBlur = 6; }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(xPos, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2, size: 1 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        wave: Math.random() * Math.PI * 2, waveSpeed: 0.02 + Math.random() * 0.03,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

---

# PROJECT 2: Prayer Times — Complete Code Blocks

(Already written in `OPUS-PRAYER-CODE-BLOCKS.md` — phases 2-4: Task CRUD, iCal VTIMEZONE, Notifications)

---

# PROJECT 3: mscarabia — Scroll Reveal + Count-Up

## Scroll Reveal CSS

Add to `index.html` `<style>` block:

```css
/* ── Scroll Reveal ──────────────────────────────────────────────── */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.reveal.revealed { opacity: 1; transform: translateY(0); }
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

## Scroll Reveal JS

Add before `</body>` in `index.html`:

```javascript
/* ── Scroll Reveal ──────────────────────────────────────────────── */
(function() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(function(el) { observer.observe(el); });
})();
```

## Hero Stats Count-Up JS

Add before `</body>`:

```javascript
/* ── Hero Stats Count-Up ────────────────────────────────────────── */
(function() {
  var stats = document.querySelectorAll('.about-stat-val[data-num]');
  if (!stats.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-num'), 10);
      var suffix = el.getAttribute('data-suf') || '';
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 30));
      var interval = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current + suffix;
      }, 40);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });
  stats.forEach(function(el) { observer.observe(el); });
})();
```

## Add `.reveal` Classes to Sections

In `index.html`, add `class="reveal"` to each major section's root element:

- `<section id="services" class="services">` → `<section id="services" class="services reveal">`
- `<section id="engineering" class="engineering">` → `<section id="engineering" class="engineering reveal">`
- `<section id="manpower" class="manpower">` → `<section id="manpower" class="manpower reveal">`
- `<section id="about" class="about">` → `<section id="about" class="about reveal">`
- `<section id="projects" class="projects">` → `<section id="projects" class="projects reveal">`
- `<section id="clients" class="clients">` → `<section id="clients" class="clients reveal">`
- `<section id="contact" class="contact">` → `<section id="contact" class="contact reveal">`
