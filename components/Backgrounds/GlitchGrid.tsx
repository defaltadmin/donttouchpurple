import { useRef, useEffect, useCallback } from "react";

const GRID = 5;
const GLITCH_INTERVAL = 3200; // ms between glitches
const GLITCH_DURATION = 400;  // ms the glitch lasts

export function GlitchGrid() {
  const cvs = useRef<HTMLCanvasElement>(null);
  const nextGlitch = useRef(Date.now() + GLITCH_INTERVAL * Math.random());
  const glitchEnd = useRef(0);
  const cells = useRef<{ color: string; x: number; y: number; w: number; h: number }[]>([]);

  const initCells = useCallback((W: number, H: number) => {
    const pad = 60;
    const gw = W - pad * 2, gh = H - pad * 2;
    const cw = gw / GRID, ch = gh / GRID;
    cells.current = [];
    for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++)
        cells.current.push({
          color: `hsl(${260 + Math.random() * 60}, 70%, ${35 + Math.random() * 25}%)`,
          x: pad + c * cw, y: pad + r * ch, w: cw - 2, h: ch - 2,
        });
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const now = Date.now();

    if (now > nextGlitch.current && now > glitchEnd.current) {
      glitchEnd.current = now + GLITCH_DURATION;
      nextGlitch.current = now + GLITCH_INTERVAL + Math.random() * 2000;
      // randomize colors
      cells.current.forEach(cl => {
        cl.color = `hsl(${260 + Math.random() * 60}, 70%, ${35 + Math.random() * 25}%)`;
      });
    }

    ctx.fillStyle = "rgba(13,13,26,0.22)";
    ctx.fillRect(0, 0, W, H);

    const isGlitching = now < glitchEnd.current;
    cells.current.forEach(cl => {
      ctx.fillStyle = isGlitching && Math.random() > 0.6
        ? `rgba(255,255,255,${0.3 + Math.random() * 0.4})`
        : cl.color;
      ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
      ctx.strokeStyle = "rgba(192,38,211,0.25)";
      ctx.strokeRect(cl.x, cl.y, cl.w, cl.h);
    });
  }, []);

  useEffect(() => {
    initCells(window.innerWidth, window.innerHeight);
    let id: number;
    const loop = () => { draw(); id = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(id);
  }, [draw, initCells]);

  return <canvas ref={cvs} style={{ position: "fixed", width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }} />;
}
