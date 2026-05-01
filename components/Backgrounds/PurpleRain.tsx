import { useEffect, useRef } from "react";

interface Shape {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  opacityTarget: number;
  opacityBase: number;
  opacityRange: number;
  breathPhase: number;
  breathSpeed: number;
  type: "square" | "circle" | "triangle";
  filled: boolean;
  rotation: number;
  rotSpeed: number;
}

function makeShape(canvasW: number, canvasH: number, y?: number): Shape {
  const types: Shape["type"][] = ["square", "circle", "triangle"];
  const size = 18 + Math.random() * 72;
  const opacityBase = 0.06 + Math.random() * 0.09;
  return {
    x: Math.random() * canvasW,
    y: y ?? -size - Math.random() * canvasH,
    size,
    speed: 0.18 + Math.random() * 0.32,
    opacity: opacityBase,
    opacityTarget: opacityBase,
    opacityBase,
    opacityRange: 0.04 + Math.random() * 0.06,
    breathPhase: Math.random() * Math.PI * 2,
    breathSpeed: 0.004 + Math.random() * 0.008,
    type: types[Math.floor(Math.random() * 3)],
    filled: Math.random() > 0.5,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.002,
  };
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, purple: string) {
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = purple;
  ctx.fillStyle = purple;
  ctx.lineWidth = 1.5;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation);

  if (s.type === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
    s.filled ? ctx.fill() : ctx.stroke();
  } else if (s.type === "square") {
    const h = s.size / 2;
    if (s.filled) ctx.fillRect(-h, -h, s.size, s.size);
    else ctx.strokeRect(-h, -h, s.size, s.size);
  } else {
    // triangle
    const r = s.size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.866, r * 0.5);
    ctx.lineTo(-r * 0.866, r * 0.5);
    ctx.closePath();
    s.filled ? ctx.fill() : ctx.stroke();
  }

  ctx.restore();
}

export function PurpleRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const shapes: Shape[] = [];
    const COUNT = 28;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed shapes distributed across full canvas height on init
    for (let i = 0; i < COUNT; i++) {
      shapes.push(makeShape(canvas.width, canvas.height, Math.random() * canvas.height));
    }

    const getPurple = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--purple").trim() || "#c026d3";
    };

    const tick = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const purple = getPurple();

      for (const s of shapes) {
        // Drift down
        s.y += s.speed;
        s.rotation += s.rotSpeed;

        // Breathe opacity
        s.breathPhase += s.breathSpeed;
        s.opacity = s.opacityBase + Math.sin(s.breathPhase) * s.opacityRange;
        s.opacity = Math.max(0.03, Math.min(0.15, s.opacity));

        // Recycle when off-screen
        if (s.y - s.size / 2 > height) {
          Object.assign(s, makeShape(width, height));
        }

        drawShape(ctx, s, purple);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
