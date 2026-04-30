import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GameMode, NumPlayers } from "../../engine/types";
import { GAME } from "../../config/difficulty";

// ─── Types local to menu ──────────────────────────────────────────
type InputMode = "touch" | "keyboard";

// ─── PillRow ──────────────────────────────────────────────────────
function PillRow<T extends string | number>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const selIdx   = options.findIndex(o => o.value === value);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rowRef   = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const row   = rowRef.current;
    const thumb = thumbRef.current;
    if (!row || !thumb) return;
    const btns = row.querySelectorAll<HTMLButtonElement>(".pill-opt");
    const btn  = btns[selIdx];
    if (!btn) return;
    thumb.style.left  = btn.offsetLeft + "px";
    thumb.style.width = btn.offsetWidth + "px";
  }, [selIdx]);

  useEffect(() => {
    reposition();
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(reposition); });
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined")
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    const ro = new ResizeObserver(() => { reposition(); requestAnimationFrame(reposition); });
    ro.observe(row);
    if (row.parentElement) ro.observe(row.parentElement);
    return () => { ro.disconnect(); cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [reposition, selIdx]);

  return (
    <div className="pill-row" ref={rowRef}>
      <div className="pill-thumb" ref={thumbRef} />
      {options.map((o, i) => (
        <button key={String(o.value)}
          className={`pill-opt${i === selIdx ? " pill-opt--on" : ""}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Energy countdown ──────────────────────────────────────────────
function getNextRegenMs(energyLastRegen: number): number {
  const elapsed   = Date.now() - energyLastRegen;
  const remaining = GAME.ENERGY_REGEN_MS - (elapsed % GAME.ENERGY_REGEN_MS);
  return remaining;
}

function EnergyCountdown({ energyLastRegen }: { energyLastRegen: number }) {
  const [ms, setMs] = useState(() => getNextRegenMs(energyLastRegen));
  useEffect(() => {
    const id = setInterval(() => setMs(getNextRegenMs(energyLastRegen)), 250);
    return () => clearInterval(id);
  }, [energyLastRegen]);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return <div className="no-energy-timer">Next energy in {mins}:{String(secs).padStart(2, "0")}</div>;
}

// ─── Props ────────────────────────────────────────────────────────
export interface StartScreenProps {
  gameMode:        GameMode;
  setGameMode:     (m: GameMode) => void;
  numPlayers:      NumPlayers;
  setNumPlayers:   (n: NumPlayers) => void;
  inputMode:       InputMode;
  setInputMode:    (m: InputMode) => void;
  practiceMode:    boolean;
  setPracticeMode: (v: boolean) => void;
  energyCount:     number;
  energyLastRegen: number;
  dust:            number;
  devMode:         boolean;
  playerName:      string | null;
  onPlay:          () => void;
  onHowTo:         () => void;
  onLeaderboard:   () => void;
  onShop:          () => void;
  onKeybind:       () => void;
  onRefillEnergy:  () => void;
  onSwitchPlayer:  () => void;
  dustWidget:      React.ReactNode;
  energyBar:       React.ReactNode;
  dailyObjective?: import("../../config/dailyObjective").DailyObjective;
  pendingReplaySeed?: string | null;
  onClearReplaySeed?: () => void;
}

// ─── StartScreen ──────────────────────────────────────────────────
export function StartScreen({
  gameMode, setGameMode,
  numPlayers, setNumPlayers,
  inputMode, setInputMode,
  practiceMode, setPracticeMode,
  energyCount, energyLastRegen,
  dust, devMode,
  playerName,
  onPlay, onHowTo, onLeaderboard, onShop, onKeybind,
  onRefillEnergy, onSwitchPlayer,
  dustWidget, energyBar,
  dailyObjective,
  pendingReplaySeed, onClearReplaySeed,
}: StartScreenProps) {
  const isKbd = inputMode === "keyboard";

  return (
    <div className="menu-card screen-slide">
      {pendingReplaySeed && (
        <div className="replay-banner">
          <span>▶ Replay Seed: <strong>{pendingReplaySeed}</strong></span>
          <button className="btn-ghost btn-sm" onClick={onClearReplaySeed}>Clear</button>
        </div>
      )}
      {/* Top row: player pill + energy pips */}
      <div className="menu-top-row">
        <button className="player-pill" onClick={onSwitchPlayer}>
          <span className="player-pill-icon">{devMode ? "🔧" : "👤"}</span>
          <span className="player-pill-name">{playerName || "Guest"}{devMode ? " [DEV]" : ""}</span>
          <span className="player-pill-edit">✎</span>
        </button>
        <div className="energy-inline">{energyBar}</div>
      </div>

      <div className="menu-header">
        <h1 className="menu-title">Don't Touch the <span className="txt-p">Purple</span></h1>
        <p className="menu-sub">⚡ Tap fast. Avoid purple. Survive.</p>
      </div>

      <div className="opt-grid">
        <div className="opt-section">
          <div className="opt-label">🎮 Game Mode</div>
          <PillRow<GameMode>
            options={[{ value: "classic", label: "⊞ Classic" }, { value: "evolve", label: "∞ Evolve" }]}
            value={gameMode} onChange={setGameMode} />
        </div>
        <div className="opt-section">
          <div className="opt-label">👥 Players</div>
          <PillRow<NumPlayers>
            options={[{ value: 1, label: "Solo" }, { value: 2, label: "Duo" }] as { value: NumPlayers; label: string }[]}
            value={numPlayers} onChange={setNumPlayers} />
        </div>
        <div className="opt-section">
          <div className="opt-label">🕹 Input</div>
          <PillRow<InputMode>
            options={[{ value: "touch", label: "👆 Touch" }, { value: "keyboard", label: "⌨ Keys" }]}
            value={inputMode} onChange={setInputMode} />
        </div>
        <div className="opt-section">
          <div className="opt-label">🎯 Practice Mode</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: "∞ Unlimited" }, { value: "off", label: "⚡ Normal" }]}
            value={practiceMode ? "on" : "off"}
            onChange={(v) => setPracticeMode(v === "on")} />
        </div>
      </div>

      {(devMode || energyCount > 0) ? (
        <button className="btn-play" onClick={onPlay}>▶ PLAY!{devMode ? " 🔧" : ""}</button>
      ) : (
        <div className="no-energy-block">
          <div className="no-energy-txt">⚡ No energy</div>
          <EnergyCountdown energyLastRegen={energyLastRegen} />
          <button className="btn-ghost" style={{ marginTop: 8, fontSize: 13 }}
            onClick={onRefillEnergy}
            disabled={dust < GAME.DUST_PER_ENERGY}
            title={dust < GAME.DUST_PER_ENERGY ? `Need ${GAME.DUST_PER_ENERGY} 💜 dust` : ""}>
            💜 Spend {GAME.DUST_PER_ENERGY} dust to refill
          </button>
        </div>
      )}

      {dailyObjective && (
        <div className={`daily-obj-chip${dailyObjective.completed ? " daily-obj-chip--done" : ""}`}>
          🎯 {dailyObjective.description} → +{dailyObjective.reward} 💜
          {dailyObjective.completed && " ✓"}
        </div>
      )}

      <div className="menu-links">
        <button className="btn-link" onClick={onHowTo}>❓ How to Play</button>
        <button className="btn-link" onClick={onLeaderboard}>🏆 Leaderboard</button>
        <button className="btn-link" onClick={onShop}>🛒 Shop</button>
        {isKbd && <button className="btn-link" onClick={onKeybind}>⌨ Keys</button>}
      </div>
    </div>
  );
}
