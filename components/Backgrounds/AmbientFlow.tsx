// LightningField — branching electric bolts in white/blue. No purple.
import { useRef, useEffect } from "react";

export default function AmbientFlow() {
  const cvs = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    interface Bolt { x1: number; y1: number; x2: number; y2: number; }
    interface Lightning { bolts: Bolt[]; alpha: number; born: number; }
    const active: Lightning[] = [];
    let nextBolt = Date.now() + 400;

    function branch(bolts: Bolt[], x: number, y: number, angle: number, len: number, depth: number) {
      if (depth === 0 || len < 8) return;
      const a = angle + (Math.random() - 0.5) * 0.7;
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      bolts.push({ x1: x, y1: y, x2, y2 });
      if (Math.random() < 0.45) branch(bolts, x2, y2, a + 0.4 + Math.random() * 0.3, len * 0.6, depth - 1);
      if (Math.random() < 0.3)  branch(bolts, x2, y2, a - 0.4 - Math.random() * 0.3, len * 0.5, depth - 1);
      branch(bolts, x2, y2, a, len * 0.7, depth - 1);
    }

    function spawn() {
      if (!c) return;
      const bolts: Bolt[] = [];
      branch(bolts, Math.random() * c.width, Math.random() * c.height * 0.4,
             Math.PI / 2 + (Math.random() - 0.5) * 0.5, 60 + Math.random() * 80, 6);
      active.push({ bolts, alpha: 1, born: Date.now() });
    }

    let raf: number;
    const draw = () => {
      ctx.fillStyle = "rgba(13,13,26,0.25)";
      ctx.fillRect(0, 0, c.width, c.height);
      const now = Date.now();
      if (now > nextBolt) { spawn(); nextBolt = now + 600 + Math.random() * 900; }
      for (let i = active.length - 1; i >= 0; i--) {
        const lt = active[i];
        lt.alpha = 1 - (now - lt.born) / 400;
        if (lt.alpha <= 0) { active.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = lt.alpha * 0.8;
        ctx.strokeStyle = `rgba(160,220,255,${lt.alpha})`;
        ctx.shadowColor = "#60d0ff";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        for (const b of lt.bolts) {
          ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={cvs} className="background-canvas" />;
}
