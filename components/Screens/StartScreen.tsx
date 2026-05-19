import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GameMode, NumPlayers } from "../../engine/types";
import { GAME } from "../../config/difficulty";
import { getObjectiveStreak as _getObjectiveStreak } from "../../config/dailyObjective";

// ─── Types local to menu ──────────────────────────────────────────
type InputMode = "touch" | "keyboard";

// ─── PillRow ──────────────────────────────────────────────────────
function PillRow<T extends string | number>({
  options, value, onChange, disabledOptions = [], onDisabledClick,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabledOptions?: T[]; onDisabledClick?: (v: T) => void }) {
  const selIdx   = options.findIndex(o => o.value === value);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rowRef   = useRef<HTMLDivElement>(null);

  const isDisabled = (optValue: T) => disabledOptions.includes(optValue);

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
    let raf2: number;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(reposition); });
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
      {options.map((o, i) => {
        const locked = isDisabled(o.value);
        return (
          <button key={String(o.value)}
            className={`pill-opt${i === selIdx ? " pill-opt--on" : ""}${locked ? " pill-opt--locked" : ""}`}
            onClick={() => locked && onDisabledClick ? onDisabledClick(o.value) : onChange(o.value)}
            title={locked ? "Tap for hint" : undefined}>
            {o.label}{locked && " 🔒"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Magnetic Button ───────────────────────────────────────────────
function MagneticButton({ children, onClick, className = "", disabled = false }: {
  children: React.ReactNode; onClick: () => void; className?: string; disabled?: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const isFinePointer = useRef(false);

  useEffect(() => {
    // Check if device has fine pointer (mouse) vs coarse (touch)
    isFinePointer.current = window.matchMedia("(pointer: fine)").matches;
    const mq = window.matchMedia("(pointer: fine)");
    const handleMediaChange = (e: MediaQueryListEvent) => { isFinePointer.current = e.matches; };
    mq.addEventListener("change", handleMediaChange);

    const btn = btnRef.current;
    if (!btn) return;

    const getRect = () => btn.getBoundingClientRect();

    const handleMove = (e: MouseEvent) => {
      if (!isFinePointer.current) return; // Skip on touch devices
      const rect = getRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < 80) {
        const pull = (1 - dist / 80) * 0.25;
        posRef.current = { x: dx * pull, y: dy * pull };
        // Haptic feedback on snap
        if (dist < 40 && navigator.vibrate) navigator.vibrate(2);
      } else {
        posRef.current = { x: 0, y: 0 };
      }
      btn.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    };

    const handleLeave = () => {
      posRef.current = { x: 0, y: 0 };
      btn.style.transform = "";
    };

    const handleTouchStart = () => {
      // Reset transform immediately on touch to prevent laggy feel
      posRef.current = { x: 0, y: 0 };
      btn.style.transform = "";
    };

    window.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", handleLeave);
    btn.addEventListener("touchstart", handleTouchStart, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      btn.removeEventListener("mouseleave", handleLeave);
      btn.removeEventListener("touchstart", handleTouchStart);
      mq.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <button ref={btnRef} className={className} onClick={onClick} disabled={disabled}
      style={{ transition: "transform 0.1s ease-out" }}>
      {children}
    </button>
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
  isFeatureUnlocked: (id: import('../../utils/featureGates').FeatureId) => boolean;
  onPlay:          () => void;
  onHowTo:         () => void;
  onLeaderboard:   () => void;
  onShop:          () => void;
  onKeybind:       () => void;
  onRefillEnergy:  () => void;
  onSwitchPlayer:  () => void;
  onOpenRewardsHub: () => void;
  onGameMaster?: () => void;
  rewardsBadgeCount?: number;
  dustWidget:      React.ReactNode;
  energyBar:       React.ReactNode;
  dailyObjectives?: import("../../config/dailyObjective").DailyObjective[];
  pendingReplaySeed?: string | null;
  onClearReplaySeed?: () => void;
  resumeReady?: boolean;
  resumeData?: Record<string, unknown> | null;
  onResumeGame?: () => void;
  onToast?: (message: string) => void;
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
  isFeatureUnlocked,
  onPlay, onHowTo, onLeaderboard, onShop, onKeybind,
  onRefillEnergy, onSwitchPlayer, onOpenRewardsHub, onGameMaster, rewardsBadgeCount,
  dustWidget, energyBar,
  dailyObjectives,
  pendingReplaySeed, onClearReplaySeed,
  resumeReady, resumeData, onResumeGame,
  onToast,
}: StartScreenProps) {
  const isKbd = inputMode === "keyboard";

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle navigation when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onPlay();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          onHowTo();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          onLeaderboard();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          onShop();
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          onKeybind();
          break;
        case 'r':
        case 'R':
          if (resumeReady && onResumeGame) {
            e.preventDefault();
            onResumeGame();
          }
          break;
        case '1':
          e.preventDefault();
          setGameMode('classic');
          break;
        case '2':
          if (isFeatureUnlocked('evolve_mode') || devMode) {
            e.preventDefault();
            setGameMode('evolve');
          }
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          setNumPlayers(numPlayers === 1 ? 2 : 1);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setInputMode('touch');
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          setInputMode(inputMode === 'touch' ? 'keyboard' : 'touch');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, numPlayers, gameMode, isFeatureUnlocked, devMode, onPlay, onHowTo, onLeaderboard, onShop, onKeybind, resumeReady, onResumeGame]);

  return (
    <div className="menu-card screen-slide" role="main" aria-label="Game menu">
      {pendingReplaySeed && (
        <div className="replay-banner">
          <span>▶ Replay Seed: <strong>{pendingReplaySeed}</strong></span>
          <button className="btn-ghost btn-sm" onClick={onClearReplaySeed}>Clear</button>
        </div>
      )}
      {resumeReady && resumeData && onResumeGame && (
        <button onClick={onResumeGame} className="dtp-btn-resume" aria-label="Resume saved game">
          🔄 Resume Game
          <span className="dtp-resume-meta">Score: {resumeData.score as number} | ❤️ {resumeData.hearts as number}</span>
        </button>
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

      <div className="opt-grid">
        <div className="opt-section">
          <div className="opt-label">Game</div>
          <PillRow<GameMode>
            options={[
              { value: "classic", label: "⊞ Classic" },
              { value: "evolve", label: "∞ Evolve" }
            ]}
            value={gameMode}
            disabledOptions={(!isFeatureUnlocked('evolve_mode') && !devMode) ? ['evolve'] : []}
            onDisabledClick={(m) => onToast?.("Score 500+ in Classic to unlock ∞ Evolve!")}
            onChange={(m) => setGameMode(m)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">Players</div>
          <PillRow<NumPlayers>
            options={[
              { value: 1, label: "① Solo" },
              { value: 2, label: "② Duo" }
            ] as { value: NumPlayers; label: string }[]}
            value={numPlayers}
            disabledOptions={(!isFeatureUnlocked('two_player') && !devMode) ? [2] : []}
            onDisabledClick={(n) => onToast?.("Win 3 Classic games to unlock Duo mode!")}
            onChange={(n) => setNumPlayers(n)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">Input</div>
          <PillRow<InputMode>
            options={[{ value: "touch", label: "👆 Touch" }, { value: "keyboard", label: "⌨ Keys" }]}
            value={inputMode} onChange={setInputMode} />
        </div>
        <div className="opt-section">
          <div className="opt-label">Mode</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: "∞ Practice" }, { value: "off", label: "⚡ Normal" }]}
            value={practiceMode ? "on" : "off"}
            onChange={(v) => setPracticeMode(v === "on")} />
        </div>
      </div>

      {(devMode || energyCount > 0) ? (
        <MagneticButton className="btn-play" onClick={onPlay}>
          PLAY
        </MagneticButton>
      ) : (
        <div className="no-energy-block">
          <EnergyCountdown energyLastRegen={energyLastRegen} />
          <button className="btn-ghost" onClick={onRefillEnergy} disabled={dust < GAME.DUST_PER_ENERGY}>Refill</button>
        </div>
      )}

      <div className="menu-links">
        <button className="btn-icon-sm" onClick={onHowTo} title="How to Play">❓</button>
        <button className="btn-icon-sm" onClick={onShop} title="Shop">🛒</button>
        <button className="btn-icon-sm" onClick={onLeaderboard} disabled={!isFeatureUnlocked('leaderboard') && !devMode} title="Leaderboard">🏆</button>
        <button className="btn-icon-sm" onClick={onOpenRewardsHub} disabled={!isFeatureUnlocked('daily_challenges') && !devMode} title="Rewards">🎁</button>
        {isKbd && <button className="btn-icon-sm" onClick={onKeybind} title="Keys">⌨</button>}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use keyboard shortcuts: Enter/Space to play, H for help, L for leaderboard, S for shop, K for keys.
        Use 1/2 to switch game modes, arrow keys to change players and input mode.
        {resumeReady ? ' Press R to resume saved game.' : ''}
      </div>
    </div>
  );
}
