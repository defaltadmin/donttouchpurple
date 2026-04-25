import React, { useState, useEffect, useRef } from "react";
import { EVOLVE_PATTERNS, RARE_COLORS, STAGES } from "../../config/gridPatterns";
import type { CellShape, GameMode, NumPlayers, PlayerState, RareColorMode } from "../../engine/types";

interface DevOverlayProps {
  p1: PlayerState;
  p2: PlayerState;
  tick: number;
  gameMode: GameMode;
  numPlayers: NumPlayers;
  rareMode: RareColorMode;
  cellShape: CellShape;
  paused: boolean;
  screen: string;
  onClose: () => void;
  godMode: boolean;
  onGodModeToggle: () => void;
  speedMult: number;
  onSpeedMult: (v: number) => void;
  rotationSpeed: number;
  onRotationSpeed: (v: number) => void;
  freezeTime: boolean;
  onFreezeTimeToggle: () => void;
  dust: number;
  onDustAdd: (amount: number) => void;
  onSpawnPowerup: (type: "shield" | "freeze" | "heart") => void;
  gameSeed: number;
}

const SPARKLINE_CAP = 30;
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 180, h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (SPARKLINE_CAP - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", margin: "2px 0" }}>
      <polyline points={pts} fill="none" stroke="#c026d3" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="0" y1={h} x2={w} y2={h} stroke="rgba(192,38,211,0.15)" strokeWidth="1" />
    </svg>
  );
}

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="devs-section">
      <button className="devs-section-hdr" onClick={() => setOpen(o => !o)}>
        <span>{icon} {title}</span>
        <span style={{ opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="devs-section-body">{children}</div>}
    </div>
  );
}

function Row({ label, val, help }: { label: string; val: string | number | boolean; help?: string }) {
  return (
    <div className="devs-row" title={help}>
      <span className="devs-key">{label}{help ? " ⓘ" : ""}</span>
      <span className="devs-val">{String(val)}</span>
    </div>
  );
}

function Btn({ label, onClick, color, help }: { label: string; onClick: () => void; color?: string; help?: string }) {
  return (
    <button className="devs-btn" onClick={onClick} style={{ color }} title={help}>
      {label}
    </button>
  );
}

function Toggle({ label, active, onToggle, help }: { label: string; active: boolean; onToggle: () => void; help?: string }) {
  return (
    <div className="devs-toggle-row" title={help}>
      <span className="devs-key">{label}{help ? " ⓘ" : ""}</span>
      <button className={"devs-toggle" + (active ? " devs-toggle--on" : "")} onClick={onToggle}>
        {active ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange, format, help }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
  format?: (v: number) => string; help?: string;
}) {
  return (
    <div className="devs-slider-row" title={help}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="devs-key">{label}{help ? " ⓘ" : ""}</span>
        <span className="devs-val">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="devs-range" />
    </div>
  );
}

export function DevOverlay({
  p1, p2, tick, gameMode, numPlayers, rareMode, cellShape, paused, screen, onClose,
  godMode, onGodModeToggle, speedMult, onSpeedMult, rotationSpeed, onRotationSpeed,
  freezeTime, onFreezeTimeToggle, dust, onDustAdd, onSpawnPowerup, gameSeed,
}: DevOverlayProps) {
  const [tickMs, setTickMs] = useState<number[]>([]);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;
    setTickMs(prev => [...prev.slice(-(SPARKLINE_CAP - 1)), delta]);
  }, [tick]);

  const copySeed = () => { navigator.clipboard?.writeText(String(gameSeed)).catch(() => {}); };
  const isDesktop = typeof window !== "undefined" && window.innerWidth > 900;

  return (
    <div className="devs-overlay">
      {isDesktop && (
        <div className="devs-panel devs-panel--left">
          <div className="devs-header">
            <span>📊 Live Monitor</span>
          </div>
          <Section title="World State" icon="🌍">
            <Row label="screen" val={screen} />
            <Row label="mode" val={gameMode} />
            <Row label="players" val={numPlayers} />
            <Row label="tick" val={tick} />
            <Row label="paused" val={paused} />
            <Row label="cellShape" val={cellShape} />
            <Row label="rareMode" val={rareMode.active ? (rareMode.color + " ×" + rareMode.turnsLeft) : "off"} />
            <div className="devs-row">
              <span className="devs-key">gameSeed ⓘ</span>
              <span className="devs-val" onClick={copySeed}
                style={{ cursor: "pointer", textDecoration: "underline dotted" }}
                title="Click to copy — paste into //dev// seed field to replay">
                {gameSeed}
              </span>
            </div>
          </Section>
          <Section title="Tick Graph (ms between ticks)" icon="📈" help="Lower = faster tick rate">
            <Sparkline data={tickMs} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, opacity: 0.5, fontFamily: "monospace" }}>
              <span>min:{tickMs.length ? Math.min(...tickMs) : "—"}</span>
              <span>max:{tickMs.length ? Math.max(...tickMs) : "—"}</span>
              <span>last:{tickMs[tickMs.length - 1] ?? "—"}</span>
            </div>
          </Section>
          <Section title="Player 1" icon="👤">
            <Row label="score" val={p1.score} />
            <Row label="health" val={p1.health} />
            <Row label="stage" val={p1.gridStage} />
            <Row label="patternIdx" val={p1.patternIdx} />
            <Row label="streak" val={p1.streak} />
            <Row label="shield" val={p1.shield} />
            <Row label="alive" val={p1.alive} />
            <Row label="active cells" val={p1.active.length} help="Non-void cells on grid" />
            {p1.active.map((cell, i) => (
              <Row key={i} label={"  [" + i + "] idx:" + cell.idx}
                val={cell.type + (cell.iceCount != null ? " ×" + cell.iceCount : "") + (cell.holdRequired != null ? " hold" : "")} />
            ))}
          </Section>
          {numPlayers === 2 && (
            <Section title="Player 2" icon="👤" defaultOpen={false}>
              <Row label="score" val={p2.score} />
              <Row label="health" val={p2.health} />
              <Row label="stage" val={p2.gridStage} />
              <Row label="patternIdx" val={p2.patternIdx} />
              <Row label="alive" val={p2.alive} />
            </Section>
          )}
        </div>
      )}

      <div className="devs-panel devs-panel--right" onClick={e => e.stopPropagation()}>
        <div className="devs-header">
          <span>🛠 Dev Controls</span>
          <button className="devs-close" onClick={onClose}>✕</button>
        </div>

        {!isDesktop && (
          <Section title="Live State" icon="📊" defaultOpen={false}>
            <Row label="screen" val={screen} />
            <Row label="tick" val={tick} />
            <Row label="P1 score" val={p1.score} />
            <Row label="P1 health" val={p1.health} />
            <Row label="P1 stage" val={p1.gridStage} />
            <Row label="rareMode" val={rareMode.active ? rareMode.color : "off"} />
            <div className="devs-row">
              <span className="devs-key">gameSeed</span>
              <span className="devs-val" onClick={copySeed}
                style={{ cursor: "pointer", textDecoration: "underline dotted" }}>
                {gameSeed}
              </span>
            </div>
            <Sparkline data={tickMs} />
          </Section>
        )}

        <Section title="Cheats" icon="⚡">
          <Toggle label="God Mode — no damage" active={godMode} onToggle={onGodModeToggle}
            help="All hits are ignored. Health won't drop." />
          <Toggle label="Freeze Time — no speed scaling" active={freezeTime} onToggle={onFreezeTimeToggle}
            help="Difficulty scaler is paused. Speed stays constant." />
          <div className="devs-divider" />
          <div className="devs-sublabel">DUST INJECTOR</div>
          <div className="devs-btn-row">
            <Btn label="+1K 💜" onClick={() => onDustAdd(1000)} help="Add 1,000 dust to balance" />
            <Btn label="+10K 💜" onClick={() => onDustAdd(10000)} help="Add 10,000 dust to balance" />
          </div>
          <div className="devs-sublabel" style={{ marginTop: 8 }}>FORCE SPAWN NEXT TICK</div>
          <div className="devs-btn-row">
            <Btn label="❄ Freeze" onClick={() => onSpawnPowerup("freeze")}
              help="Force a Freeze powerup to appear on next tick spawn" />
            <Btn label="◈ Shield" onClick={() => onSpawnPowerup("shield")}
              help="Force a Shield powerup to appear on next tick spawn" />
            <Btn label="♥ Medpack" onClick={() => onSpawnPowerup("heart")}
              help="Force a Medpack to appear on next tick spawn" />
          </div>
        </Section>

        <Section title="Speed & Rotation" icon="🎛">
          <Slider label="Game Speed" min={0.1} max={5} step={0.05} value={speedMult}
            onChange={onSpeedMult} format={v => v.toFixed(2) + "×"}
            help="Multiplies tick interval. 1.0 = default, 0.1 = ultra slow, 5.0 = ultra fast" />
          <Slider label="Spin Duration" min={0.2} max={4} step={0.1} value={rotationSpeed}
            onChange={onRotationSpeed} format={v => v.toFixed(1) + "×"}
            help="Higher = slower wheel spin. 1.0 = default. Try 2.5 for smooth tire feel." />
        </Section>

        <Section title="Force Stage" icon="📐" defaultOpen={false}>
          <div className="devs-sublabel">Click to jump to any stage</div>
          <div className="devs-btn-row devs-btn-row--wrap">
            {STAGES.map((stage, i) => (
              <Btn key={stage.name}
                label={i + ": " + stage.name}
                onClick={() => window.dispatchEvent(new CustomEvent("dtp-dev-stage", { detail: i }))}
                help={stage.cols + "×" + stage.rows + (stage.mask ? " masked" : " full") + " — " + stage.total + " cells"} />
            ))}
          </div>
        </Section>

        <Section title="Force Pattern" icon="🔲" defaultOpen={false}>
          <div className="devs-sublabel">Evolve patterns — click to force</div>
          <div className="devs-btn-row devs-btn-row--wrap">
            {EVOLVE_PATTERNS.slice(0, 12).map((pattern, i) => (
              <Btn key={pattern.cols + "-" + pattern.rows + "-" + i}
                label={"P" + i + " " + pattern.cols + "×" + pattern.rows + (pattern.mask ? "m" : "")}
                onClick={() => window.dispatchEvent(new CustomEvent("dtp-dev-pattern", { detail: i }))}
                help={"cols:" + pattern.cols + " rows:" + pattern.rows + " minStage:" + pattern.minStage} />
            ))}
          </div>
        </Section>

        <Section title="Rare Mode" icon="🌈" defaultOpen={false}>
          <div className="devs-sublabel">Force a rare color event</div>
          <div className="devs-btn-row devs-btn-row--wrap">
            {RARE_COLORS.map(rare => (
              <Btn key={rare.color} label={rare.color} color={rare.cssColor}
                onClick={() => window.dispatchEvent(new CustomEvent("dtp-dev-rare", { detail: rare }))}
                help={"Force Don't Touch " + rare.color.toUpperCase()} />
            ))}
            <Btn label="⊘ Clear"
              onClick={() => window.dispatchEvent(new CustomEvent("dtp-dev-rare", { detail: null }))}
              help="End rare mode immediately" />
          </div>
        </Section>

        <div style={{ height: 16 }} />
        <div style={{ fontSize: 9, opacity: 0.2, fontFamily: "monospace", textAlign: "center" }}>
          Dev mode · mscarabia.com · Don't Touch Purple
        </div>
      </div>
    </div>
  );
}

export function DevUnlockModal({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = () => {
    if (pw === "mscarabia") { onUnlock(); }
    else { setErr(true); setPw(""); setTimeout(() => setErr(false), 1200); }
  };

  return (
    <div className="devs-modal-overlay" onClick={onClose}>
      <div className="devs-modal" onClick={e => e.stopPropagation()}>
        <div className="devs-modal-title">🛠 Developer Mode</div>
        <div className="devs-modal-sub">Enter the dev password to unlock controls</div>
        <input ref={inputRef} type="password"
          className={"devs-modal-input" + (err ? " devs-modal-input--err" : "")}
          placeholder="Password..."
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") attempt(); if (e.key === "Escape") onClose(); }}
        />
        {err && <div className="devs-modal-err">❌ Incorrect password</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="devs-modal-btn devs-modal-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="devs-modal-btn devs-modal-btn--ok" onClick={attempt}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

export function DevFab({ isDevMode, onClick }: { isDevMode: boolean; onClick: () => void }) {
  return (
    <button className={"devs-fab" + (isDevMode ? " devs-fab--on" : "")} onClick={onClick}
      title={isDevMode ? "Close Dev Mode" : "Open Dev Mode"}>
      🔧
    </button>
  );
}
