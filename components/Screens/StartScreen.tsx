import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GameMode, NumPlayers } from "../../engine/types";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";
import { Icon } from "../UI/Icon";
import { ParticleLayer } from "../Layout/ParticleLayer";

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

// ─── Magnetic Button (React Bits Magnet pattern) ──────────────────
function MagneticButton({ children, onClick, className = "", disabled = false }: {
  children: React.ReactNode; onClick: () => void; className?: string; disabled?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const isFinePointer = useRef(false);

  useEffect(() => {
    isFinePointer.current = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
    const mq = window.matchMedia?.("(pointer: fine)");
    const handleChange = (e: MediaQueryListEvent) => { isFinePointer.current = e.matches; };
    mq?.addEventListener("change", handleChange);

    const handleMove = (e: MouseEvent) => {
      if (!isFinePointer.current || !wrapperRef.current) return;
      const { left, top, width, height } = wrapperRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);
      const padding = 20;

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        const rawX = (e.clientX - centerX) / 6;
        const rawY = (e.clientY - centerY) / 6;
        setPosition({ x: Math.max(-8, Math.min(8, rawX)), y: Math.max(-8, Math.min(8, rawY)) });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      mq?.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        className={className}
        onClick={onClick}
        disabled={disabled}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: isActive ? "transform 0.3s ease-out" : "transform 0.5s ease-in-out",
          willChange: "transform",
        }}
      >
        {children}
      </button>
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
  hasBackground?: boolean;
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
  onRefillEnergy, onSwitchPlayer, onOpenRewardsHub, onGameMaster: _onGameMaster, rewardsBadgeCount: _rewardsBadgeCount,
  dustWidget: _dustWidget, energyBar,
  dailyObjectives: _dailyObjectives,
  pendingReplaySeed, onClearReplaySeed,
  resumeReady, resumeData, onResumeGame,
  onToast,
  hasBackground,
}: StartScreenProps) {
  const { t } = useTranslation();
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
  }, [inputMode, numPlayers, gameMode, isFeatureUnlocked, devMode, onPlay, onHowTo, onLeaderboard, onShop, onKeybind, resumeReady, onResumeGame, setGameMode, setInputMode, setNumPlayers]);

  return (
    <>
      {!hasBackground && <ParticleLayer count={25} />}
      <div className="menu-card screen-slide" role="main" aria-label="Game menu" data-testid="menu-card">
      <div className="menu-header">
        <h1 className="menu-title">Don't Touch Purple</h1>
        <p className="menu-sub">Tap fast. Survive longer.</p>
      </div>
      {pendingReplaySeed && (
        <div className="replay-banner">
          <span>▶ Replay Seed: <strong>{pendingReplaySeed}</strong></span>
          <button className="btn-ghost btn-sm" onClick={onClearReplaySeed}>Clear</button>
        </div>
      )}
      {resumeReady && resumeData && onResumeGame && (
        <button onClick={onResumeGame} className="dtp-btn-resume" aria-label="Resume saved game">
          {"🔄 " + t('menu.resume')}
          <span className="dtp-resume-meta">Score: {resumeData.score as number} | ❤️ {resumeData.hearts as number}</span>
        </button>
      )}
      {/* Top row: player pill + energy pips */}
      <div className="menu-top-row">
        <button className="player-pill" onClick={onSwitchPlayer}>
          <span className="player-pill-icon">{devMode ? "🔧" : "👤"}</span>
          <span className="player-pill-name">{playerName || t('menu.guest')}{devMode ? " [DEV]" : ""}</span>
          <span className="player-pill-edit">✎</span>
        </button>
        <div className="energy-inline">{energyBar}</div>
      </div>

      <div className="opt-grid">
        <div className="opt-section">
          <div className="opt-label">{t('menu.game')}</div>
          <PillRow<GameMode>
            options={[
              { value: "classic", label: t('menu.classic') },
              { value: "evolve", label: t('menu.evolve') }
            ]}
            value={gameMode}
            disabledOptions={(!isFeatureUnlocked('evolve_mode') && !devMode) ? ['evolve'] : []}
            onDisabledClick={(_m) => onToast?.(t('menu.locked_evolve'))}
            onChange={(m) => setGameMode(m)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.players')}</div>
          <PillRow<NumPlayers>
            options={[
              { value: 1, label: t('menu.solo') },
              { value: 2, label: t('menu.duo') }
            ] as { value: NumPlayers; label: string }[]}
            value={numPlayers}
            disabledOptions={(!isFeatureUnlocked('two_player') && !devMode) ? [2] : []}
            onDisabledClick={(_n) => onToast?.(t('menu.locked_duo'))}
            onChange={(n) => setNumPlayers(n)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.input')}</div>
          <PillRow<InputMode>
            options={[{ value: "touch", label: t('menu.touch') }, { value: "keyboard", label: t('menu.keys') }]}
            value={inputMode} onChange={setInputMode} />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.mode')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('menu.practice') }, { value: "off", label: t('menu.normal') }]}
            value={practiceMode ? "on" : "off"}
            onChange={(v) => setPracticeMode(v === "on")} />
        </div>
      </div>

      {(devMode || energyCount > 0) ? (
        <MagneticButton className="btn-play" onClick={onPlay}>
          {t('menu.play_btn')}
        </MagneticButton>
      ) : (
        <div className="no-energy-block">
          <EnergyCountdown energyLastRegen={energyLastRegen} />
          <button className="btn-ghost" onClick={onRefillEnergy} disabled={dust < GAME.DUST_PER_ENERGY}>{t('menu.refill')}</button>
        </div>
      )}

      <div className="menu-links">
        <button className="btn-icon-sm" onClick={onHowTo} title={t('menu.how_to_play')}><Icon name="info" size={20} /></button>
        <button className="btn-icon-sm" onClick={onShop} title={t('menu.shop')}><Icon name="bolt" size={20} /></button>
        <button className="btn-icon-sm" onClick={onLeaderboard} disabled={!isFeatureUnlocked('leaderboard') && !devMode} title={t('menu.leaderboard')}><Icon name="trophy" size={20} /></button>
        <button className="btn-icon-sm" onClick={onOpenRewardsHub} disabled={!isFeatureUnlocked('daily_challenges') && !devMode} title={t('menu.rewards')}><Icon name="star" size={20} /></button>
        {isKbd && <button className="btn-icon-sm" onClick={onKeybind} title={t('menu.keys')}>⌨</button>}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use keyboard shortcuts: Enter/Space to play, H for help, L for leaderboard, S for shop, K for keys.
        Use 1/2 to switch game modes, arrow keys to change players and input mode.
        {resumeReady ? ' Press R to resume saved game.' : ''}
      </div>
    </div>
    </>
  );
}
