import React from "react";
import { useState, useEffect } from "react";
import type { CellType, CellShape } from "../../engine/types";

// ─── Symbols ─────────────────────────────────────────────────────
const SYMBOLS: Partial<Record<CellType, string>> = {
  medpack: "♥", shield: "◈", freeze: "❄", multiplier: "⚡",
};

const CB_SYMBOLS: Partial<Record<CellType, string>> = {
  white: "●", blue: "■", red: "▲", orange: "◆", yellow: "★",
  green: "✚", cyan: "⬟", lime: "⬡", teal: "⬢", pink: "♦",
  rose: "▼", magenta: "❋", purple: "✕",
  medpack: "♥", shield: "◈", freeze: "❄", multiplier: "⚡",
};

// ─── Shard burst ─────────────────────────────────────────────────
interface Shard { id: number; dx: string; dy: string; dr: string; color: string; }

function getShardColor(type: CellType): string {
  const map: Partial<Record<CellType, string>> = {
    white: "#c7d9f5", blue: "#3b82f6", red: "#ef4444", orange: "#f97316",
    yellow: "#eab308", green: "#22c55e", cyan: "#06b6d4", lime: "#84cc16",
    teal: "#14b8a6", pink: "#ec4899", rose: "#f43f5e",
    magenta: "#d946ef", purple: "#a855f7",
    medpack: "#f59e0b", shield: "#06b6d4", freeze: "#60a5fa", multiplier: "#f97316",
  };
  return map[type] || "#fff";
}

// ─── Props ────────────────────────────────────────────────────────
interface CellProps {
  type:          CellType;
  animState:     string | null;
  keyLabel:      string;
  showKey:       boolean;
  pressing:      boolean;
  onTap:         (x: number, y: number) => void;
  onHoldStart:   () => void;
  onHoldEnd:     () => void;
  colorblind:    boolean;
  cellShape?:    CellShape;
  counterSpinDur?: string | null;
  iceCount?:     number;
  holdRequired?: number;
  holdStart?:    number;
  cellIdx?:      number;
  skin?:         string;
}

function toLabel(k: string): string {
  if (!k) return "?";
  if (/^[a-z]$/.test(k)) return k.toUpperCase();
  const m: Record<string, string> = { " ": "SPC", escape: "ESC", backspace: "⌫", enter: "↵", tab: "↹", ",": "," };
  return m[k] ?? (k.length === 1 ? k : k.slice(0, 3).toUpperCase());
}

// ─── Cell component ───────────────────────────────────────────────
export function Cell({
  type, animState, keyLabel, showKey, pressing,
  onTap, onHoldStart, onHoldEnd,
  colorblind, cellShape, counterSpinDur,
  iceCount, holdRequired, holdStart,
  cellIdx, skin,
}: CellProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [shards,  setShards]  = useState<Shard[]>([]);
  const [tilt,    setTilt]    = useState(0);
  const [holdPct, setHoldPct] = useState(0);

  const sym = colorblind
    ? (type !== "inactive" ? CB_SYMBOLS[type] ?? null : null)
    : (SYMBOLS[type] ?? null);

  const cls = [
    "cell", type, animState,
    pressing && type !== "inactive" ? "cell--press" : null,
    skin && skin !== "default" && type !== "inactive" && type !== "void"
      ? `cell-skin--${skin}` : null,
  ].filter(Boolean).join(" ");

  // Shards on pop — use onAnimationEnd instead of setTimeout
  useEffect(() => {
    if (animState !== "pop" || type === "inactive") return;
    setTilt(Math.round(Math.random() * 16 - 8));
    const color = getShardColor(type);
    const newShards: Shard[] = Array.from({ length: 7 }, (_, i) => {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.6;
      const dist  = 26 + Math.random() * 26;
      return {
        id:    Date.now() + i,
        dx:    `${Math.round(Math.cos(angle) * dist)}px`,
        dy:    `${Math.round(Math.sin(angle) * dist)}px`,
        dr:    `${Math.round(120 + Math.random() * 240)}deg`,
        color,
      };
    });
    setShards(newShards);
  }, [animState, type]);

  // Hold progress
  useEffect(() => {
    if (type !== "hold" || !holdStart || !holdRequired) { setHoldPct(0); return; }
    const id = setInterval(
      () => setHoldPct(Math.min(100, ((Date.now() - holdStart) / holdRequired) * 100)),
      50
    );
    return () => clearInterval(id);
  }, [type, holdStart, holdRequired]);

  const onPtr = (e: React.PointerEvent) => {
    if (type === "inactive") return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setRipples(p => [...p, { id: Date.now() + Math.random(), x: e.clientX - r.left, y: e.clientY - r.top }]);
    if (type === "hold") { onHoldStart(); return; }
    onTap(e.clientX - r.left, e.clientY - r.top);
  };

  const onPtrUp = (e: React.PointerEvent) => {
    if (type === "hold") { e.preventDefault(); onHoldEnd(); }
  };

  const counterSpinStyle: React.CSSProperties = counterSpinDur
    ? { animation: `cellCounterSpin ${counterSpinDur} linear infinite` }
    : {};

  const isTriangle        = cellShape === "triangle";
  const isRoundedTriangle = cellShape === "roundedTriangle";
  const shapeStyle: React.CSSProperties = {};
  if (cellShape === "circle") shapeStyle.borderRadius = "50%";

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (type !== "hold" || animState === "pop" || !holdStart) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 50);
    return () => clearInterval(id);
  }, [holdStart, type, animState]);

  return (
    <button
      className={cls}
      data-cell-idx={cellIdx}
      onPointerDown={onPtr}
      onPointerUp={onPtrUp}
      onPointerLeave={onPtrUp}
      onContextMenu={e => e.preventDefault()}
      style={{
        touchAction: "none",
        userSelect:  "none",
        WebkitUserSelect: "none" as any,
        ...shapeStyle,
        ...counterSpinStyle,
        ...(animState === "pop" ? { "--tilt": `${tilt}deg` } as any : {}),
      }}
      aria-label={`${type} cell`}
    >
      {isTriangle && <span className="cell-tri-shape" />}
      {isRoundedTriangle && <span className="cell-rtri-shape" />}
      {type === "ice" && iceCount != null && <span className="cell-overlay-ice">❄{iceCount}</span>}
      {type === "hold" && (
        <div className="hold-ring-wrap" style={{ overflow: 'hidden' }}>
          <div className="hold-fill" style={{ width: `${holdPct}%` }} />
          <span className="hold-label">HOLD</span>
        </div>
      )}
      {sym && type !== "ice" && type !== "hold" && <span className="sym">{sym}</span>}
      {showKey && type !== "inactive" && <span className="kbadge">{toLabel(keyLabel)}</span>}

      {ripples.map(r => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }}
          onAnimationEnd={() => setRipples(p => p.filter(x => x.id !== r.id))} />
      ))}

      {/* Phase 4 fix: onAnimationEnd replaces setTimeout for shard cleanup */}
      {shards.map(s => (
        <span key={s.id} className="shard"
          style={{
            background: s.color,
            "--dx": s.dx, "--dy": s.dy, "--dr": s.dr,
            top: "50%", left: "50%", marginTop: "-3px", marginLeft: "-3px",
          } as any}
          onAnimationEnd={() => setShards(p => p.filter(x => x.id !== s.id))}
        />
      ))}
    </button>
  );
}
