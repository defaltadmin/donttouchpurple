import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../engine/GameEngine";
import type { GameConfig, GameEvent, GameSnapshot, Winner, StoredPowerups } from "../engine/types";
import { LS_KEYS } from "../config/difficulty";

// ─── Storage Helpers (Hook layer) ──────────────────────────────────
function loadStoredPwr(): StoredPowerups {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) {
      const d = JSON.parse(r);
      return { freeze: d.freeze ?? 0, shield: d.shield ?? 0, mult: d.mult ?? 0, heart: d.heart ?? 0 };
    }
  } catch {}
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

function saveStoredPwr(d: StoredPowerups): void {
  try { localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); } catch {}
}

// ─── Audio (lives here so engine stays React-free) ────────────────
let _actx: AudioContext | null = null;
let _muted = false;

export function setAudioMuted(muted: boolean): void { _muted = muted; }

function getACtx(): AudioContext {
  if (!_actx) _actx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _actx;
}

function playSound(type: "ok" | "bad" | "tick" | "powerup" | "levelup"): void {
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    if (type === "ok") {
      o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.start(); o.stop(t + 0.12);
    } else if (type === "bad") {
      o.type = "sawtooth"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.start(); o.stop(t + 0.28);
    } else if (type === "powerup") {
      o.type = "sine"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(); o.stop(t + 0.2);
    } else if (type === "levelup") {
      o.type = "triangle";
      o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.1); o.frequency.setValueAtTime(880, t + 0.2);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(); o.stop(t + 0.35);
    } else {
      o.type = "square"; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(); o.stop(t + 0.04);
    }
  } catch (_) {}
}

// ─── Hook return type ─────────────────────────────────────────────
export interface UseGameEngineReturn {
  // Latest game snapshot (read-only mirror)
  snapshot:    GameSnapshot | null;
  // UI feedback state
  heartAnimP1: boolean;
  heartAnimP2: boolean;
  shakeGrid1:  boolean;
  shakeGrid2:  boolean;
  toast:       string | null;
  pwrToastP1:  string | null;
  pwrToastP2:  string | null;
  levelUpBadge: string | null;
  rareSplash:  { color: string; cssColor: string } | null;
  winner:      Winner;
  // Engine actions
  start:       () => void;
  pause:       () => void;
  resume:      () => void;
  handleTap:        (player: 1 | 2, idx: number) => void;
  handleHoldStart:  (player: 1 | 2, idx: number) => void;
  handleHoldEnd:    (player: 1 | 2, idx: number) => void;
  activateStoredFreeze: (player: 1 | 2) => void;
  activateStoredShield: (player: 1 | 2) => void;
  devForceStage:   (stage: number) => void;
  devForcePattern: (idx: number) => void;
  devForceRare:    (r: { color: string; cssColor: string } | null) => void;
  devSetGodMode:   (v: boolean) => void;
  devSetFreezeTime:(v: boolean) => void;
  devSetRotationSpeed: (v: number) => void;
  devSpawnPowerup: (type: "shield" | "freeze" | "heart") => void;
  // Dust awarded on game-over (for App to consume)
  lastGameScore: number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGameEngine(
  config: GameConfig,
  onGameOver: (winner: Winner, p1Score: number, p2Score: number) => void
): UseGameEngineReturn {
  const engineRef  = useRef<GameEngine | null>(null);
  const mountedRef = useRef(true);
  const onGameOverRef = useRef(onGameOver);

  // Sync ref on every render
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  });

  // React mirror state
  const [snapshot,    setSnapshot]    = useState<GameSnapshot | null>(null);
  const [heartAnimP1, setHA1]         = useState(false);
  const [heartAnimP2, setHA2]         = useState(false);
  const [shakeGrid1,  setShake1]      = useState(false);
  const [shakeGrid2,  setShake2]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [pwrToastP1,  setPwrToastP1]  = useState<string | null>(null);
  const [pwrToastP2,  setPwrToastP2]  = useState<string | null>(null);
  const [levelUpBadge, setLevelUpBadge] = useState<string | null>(null);
  const [rareSplash,  setRareSplash]  = useState<{ color: string; cssColor: string } | null>(null);
  const [winner,      setWinner]      = useState<Winner>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);

  const toastTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rareSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha1TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha2TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake1TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake2TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ──
  const toast$ = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, 2200);
  }, []);

  // ── Build engine once; rebuild when config changes ──
  useEffect(() => {
    mountedRef.current = true;
    const engineConfig: GameConfig = {
      ...config,
      storage: { loadStoredPowerups: loadStoredPwr, saveStoredPowerups: saveStoredPwr }
    };
    const engine = new GameEngine(engineConfig);
    engineRef.current = engine;

    const unsub = engine.subscribe((event: GameEvent) => {
      if (!mountedRef.current) return;

      switch (event.type) {

        case "tick":
          setSnapshot({ ...event.snapshot });
          break;

        case "sound":
          playSound(event.name);
          break;

        case "toast":
          toast$(event.message);
          break;

        case "pwrToast":
          if (event.player === 1) {
            setPwrToastP1(event.message);
            if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
            pwrToastP1TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP1(null); }, 2000);
          } else {
            setPwrToastP2(event.message);
            if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
            pwrToastP2TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP2(null); }, 2000);
          }
          break;

        case "damage":
          if (event.player === 1) {
            setHA1(true);
            if (ha1TimerRef.current) clearTimeout(ha1TimerRef.current);
            ha1TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA1(false); }, 420);
          } else {
            setHA2(true);
            if (ha2TimerRef.current) clearTimeout(ha2TimerRef.current);
            ha2TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA2(false); }, 420);
          }
          break;

        case "shake":
          if (event.player === 1) {
            setShake1(true);
            if (shake1TimerRef.current) clearTimeout(shake1TimerRef.current);
            shake1TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake1(false); }, 400);
          } else {
            setShake2(true);
            if (shake2TimerRef.current) clearTimeout(shake2TimerRef.current);
            shake2TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake2(false); }, 400);
          }
          break;

        case "levelUp":
          if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
          setLevelUpBadge(`Stage ${event.stage}`);
          levelUpTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setLevelUpBadge(null);
          }, 2200);
          break;

        case "rareStart":
          setRareSplash({ color: event.color, cssColor: event.cssColor });
          if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
          rareSplashTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setRareSplash(null);
          }, 5000);
          break;

        case "gameOver": {
          // 400ms delay matches original App.tsx before showing gameover screen
          const snap = engine.getSnapshot();
          if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setWinner(event.winner);
            setLastGameScore(
              config.numPlayers === 1
                ? snap.p1.score
                : Math.max(snap.p1.score, snap.p2.score)
            );
            onGameOverRef.current(event.winner, snap.p1.score, snap.p2.score);
          }, 400);
          break;
        }

        case "phaseChange":
          // snapshot update handles phase; nothing extra needed here
          break;

        // cellAnim events are handled by PlayerPanel/Cell directly via snapshot.p1/p2.anim
      }
    });

    // Tab visibility: pause/resume automatically
    const handleVisibility = () => {
      if (!engineRef.current) return;
      if (document.hidden) engineRef.current.pause();
      else if (engineRef.current.getSnapshot().phase === "paused") engineRef.current.resume();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      unsub();
      engine.destroy();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (toastTimerRef.current)      clearTimeout(toastTimerRef.current);
      if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
      if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
      if (levelUpTimerRef.current)    clearTimeout(levelUpTimerRef.current);
      if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
      if (ha1TimerRef.current)        clearTimeout(ha1TimerRef.current);
      if (ha2TimerRef.current)        clearTimeout(ha2TimerRef.current);
      if (shake1TimerRef.current)     clearTimeout(shake1TimerRef.current);
      if (shake2TimerRef.current)     clearTimeout(shake2TimerRef.current);
      if (gameOverTimerRef.current)   clearTimeout(gameOverTimerRef.current);
    };
  // config object identity changes when mode/numPlayers/speedMult change — engine rebuilds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.mode, config.numPlayers, config.speedMult]);

  // ── Stable action callbacks ───────────────────────────────────────

  const start = useCallback(() => {
    setWinner(null);
    setLastGameScore(null);
    setRareSplash(null);
    setLevelUpBadge(null);
    engineRef.current?.start();
  }, []);

  const pause  = useCallback(() => engineRef.current?.pause(),  []);
  const resume = useCallback(() => engineRef.current?.resume(), []);

  const handleTap = useCallback(
    (player: 1 | 2, idx: number) => engineRef.current?.handleTap(player, idx),
    []
  );
  const handleHoldStart = useCallback(
    (player: 1 | 2, idx: number) => engineRef.current?.handleHoldStart(player, idx),
    []
  );
  const handleHoldEnd = useCallback(
    (player: 1 | 2, idx: number) => engineRef.current?.handleHoldEnd(player, idx),
    []
  );

  const activateStoredFreeze = useCallback(
    (player: 1 | 2) => engineRef.current?.activateStoredFreeze(player),
    []
  );
  const activateStoredShield = useCallback(
    (player: 1 | 2) => engineRef.current?.activateStoredShield(player),
    []
  );

  const devForceStage   = useCallback((s: number) => engineRef.current?.devForceStage(s),   []);
  const devForcePattern = useCallback((i: number) => engineRef.current?.devForcePattern(i),  []);
  const devForceRare    = useCallback(
    (r: { color: string; cssColor: string } | null) => engineRef.current?.devForceRare(r),
    []
  );
  const devSetGodMode   = useCallback((v: boolean) => engineRef.current?.devSetGodMode(v), []);
  const devSetFreezeTime= useCallback((v: boolean) => engineRef.current?.devSetFreezeTime(v), []);
  const devSetRotationSpeed = useCallback((v: number) => engineRef.current?.devSetRotationSpeed(v), []);
  const devSpawnPowerup = useCallback((type: "shield" | "freeze" | "heart") => engineRef.current?.devSpawnPowerup(type), []);

  return {
    snapshot,
    heartAnimP1, heartAnimP2,
    shakeGrid1,  shakeGrid2,
    toast, pwrToastP1, pwrToastP2, levelUpBadge, rareSplash, winner, lastGameScore,
    start, pause, resume,
    handleTap, handleHoldStart, handleHoldEnd,
    activateStoredFreeze, activateStoredShield,
    devForceStage, devForcePattern, devForceRare,
    devSetGodMode, devSetFreezeTime, devSetRotationSpeed, devSpawnPowerup,
  };
}
