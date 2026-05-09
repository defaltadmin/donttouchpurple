import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../engine/GameEngine";
import { sessionManager } from "../utils/session";
import { scoreSync } from "../utils/score-sync";
import { logger } from "../utils/logger";
import type { GameConfig, GameEvent, GameSnapshot, Winner, StoredPowerups } from "../engine/types";
import { LS_KEYS, GAME } from "../config/difficulty";

// ─── Storage Helpers (Hook layer) ──────────────────────────────────
export function loadStoredPwr(): StoredPowerups {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) {
      const d = JSON.parse(r);
      return { freeze: d.freeze ?? 0, shield: d.shield ?? 0, mult: d.mult ?? 0, heart: d.heart ?? 0 };
    }
  } catch {}
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

export function saveStoredPwr(d: StoredPowerups): void {
  try { localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); } catch {}
}

// ─── Audio (lives here so engine stays React-free) ────────────────
let _actx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _muted = false;
let _volume = 0.7;
let _haptics = true;

export function setAudioMuted(muted: boolean): void { _muted = muted; }
export function setHapticsEnabled(enabled: boolean): void { _haptics = enabled; }
export function setAudioVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  if (_masterGain) _masterGain.gain.setValueAtTime(_volume, _masterGain.context.currentTime);
}

export function playVolumeChime(): void {
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(_masterGain!);
    const t = ctx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
    g.gain.setValueAtTime(_volume * 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(); o.stop(t + 0.15);
  } catch {}
}

// M3: Export for use in RewardsHub dust claim
export function playSoundEffect(name: "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"): void {
  playSound(name);
}

function getACtx(): AudioContext {
  if (!_actx) {
    _actx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _masterGain = _actx.createGain();
    _masterGain.gain.setValueAtTime(_volume, _actx.currentTime);
    _masterGain.connect(_actx.destination);
  }
  return _actx;
}

function playSound(type: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" | "bomb" | "bossStart"): void {
  try {
    if (_haptics && navigator.vibrate) {
      if (type === "bad") navigator.vibrate(50);
      else if (type === "powerup" || type === "levelup") navigator.vibrate([30, 20, 30]);
      else navigator.vibrate(15);
    }
  } catch {}
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(_masterGain!);
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
    } else if (type === "shuffle") {
      // M1: short descending swoosh — two oscillators, noise-like
      o.type = "sine"; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.14);
      g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.start(); o.stop(t + 0.14);
    } else if (type === "rareStart") {
      // M2: rising stinger — triangle wave arp
      o.type = "triangle"; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.06); o.frequency.setValueAtTime(990, t + 0.12);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
    } else if (type === "claim") {
      // M3: satisfying chime — two-note chord
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(_masterGain!);
      o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
      g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
      o2.type = "sine"; o2.frequency.setValueAtTime(1320, t); o2.frequency.exponentialRampToValueAtTime(1760, t + 0.18);
      g2.gain.setValueAtTime(0.1, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o2.start(); o2.stop(t + 0.22);
    } else if (type === "bomb") {
      // Low warning pulse
      o.type = "square"; o.frequency.setValueAtTime(120, t); o.frequency.setValueAtTime(80, t + 0.08);
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(); o.stop(t + 0.18);
    } else if (type === "bossStart") {
      // Dramatic descending arp
      o.type = "sawtooth"; o.frequency.setValueAtTime(880, t); o.frequency.setValueAtTime(660, t + 0.08); o.frequency.setValueAtTime(440, t + 0.16);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(); o.stop(t + 0.3);
    } else {
      o.type = "square"; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(); o.stop(t + 0.04);
    }
  } catch (_) {}
}

// ─── Bot FX type ──────────────────────────────────────────────────
export type BotTapFx = { id: string; idx: number; dustCost: number; at: number; };

// ─── Hook return type ─────────────────────────────────────────────
export interface UseGameEngineReturn {
  snapshot:    GameSnapshot | null;
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
  start:       (forceSeed?: number) => void;
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
  devSpawnSpecialCell: (player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => void;
  devTriggerBotTap: (player: 1 | 2, idx: number, dustCost?: number) => void;
  devToggleBotAssist: (player: 1 | 2, enabled: boolean) => void;
  startBot: () => void;
  stopBot: () => void;
  isBotActive: () => boolean;
  setBotAssist: (player: 1 | 2, enabled: boolean) => void;
  botAssistActive: { 1: boolean; 2: boolean };
  botTapHighlights: { 1: Record<number, number>; 2: Record<number, number> };
  botTapFx: BotTapFx[];
  lastGameScore: number | null;
  getAutoLowQuality: () => boolean;
  submitScoreToLeaderboard: (score: number) => void;
  restoreSession: () => boolean;
  restoreSessionSnapshot: (data: Record<string, unknown>) => boolean;
  generateChallengeUrl: () => Promise<string>;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGameEngine(
  config: GameConfig,
  onGameOver: (winner: Winner, p1Score: number, p2Score: number, gameSeed?: number) => void,
  dustCallbacks?: {
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;
  },
  onDamage?: () => void,
  onBossEvent?: (bossType: string) => void,
  onBombDefused?: () => void,
): UseGameEngineReturn {
  const engineRef  = useRef<GameEngine | null>(null);
  const mountedRef = useRef(true);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => { onGameOverRef.current = onGameOver; });

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const latestSnapshotRef = useRef<GameSnapshot | null>(null);
  const rafIdRef = useRef<number | null>(null);

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
  const [botAssistActive, setBotAssistActiveState] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [botTapHighlights, setBotTapHighlights] = useState<{ 1: Record<number, number>; 2: Record<number, number> }>({ 1: {}, 2: {} });
  const [botTapFx, setBotTapFx] = useState<BotTapFx[]>([]);

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
  const botTapTimersRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const peakStreakRef     = useRef(0);
  const dustAtStartRef    = useRef(0);

  const toast$ = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, GAME.TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const engineConfig: GameConfig = {
      ...config,
      storage: { loadStoredPowerups: loadStoredPwr, saveStoredPowerups: saveStoredPwr },
      ...(dustCallbacks ? {
        botAssist: {
          enabled: false,
          getDust: dustCallbacks.getDust,
          spendDust: dustCallbacks.spendDust,
          getAccuracy: dustCallbacks.getAccuracy,
        }
      } : {})
    };
    const engine = new GameEngine(engineConfig);
    engineRef.current = engine;

    const unsub = engine.subscribe((event: GameEvent) => {
      if (!mountedRef.current) return;

      switch (event.type) {
        case "tick":
          if (mountedRef.current) setSnapshot(event.snapshot);
          // Track peak streak for recap
          const snap = event.snapshot;
          if (snap && snap.p1.streak > (peakStreakRef.current ?? 0)) {
            peakStreakRef.current = snap.p1.streak;
          }
          break;
        case "sound": playSound(event.name); break;
        case "toast": toast$(event.message); break;
        case "pwrToast":
          if (event.player === 1) {
            setPwrToastP1(event.message);
            if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
            pwrToastP1TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP1(null); }, GAME.PWR_TOAST_DURATION_MS);
          } else {
            setPwrToastP2(event.message);
            if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
            pwrToastP2TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP2(null); }, GAME.PWR_TOAST_DURATION_MS);
          }
          break;
      case "damage":
        if (event.player === 1) {
          setHA1(true);
          if (ha1TimerRef.current) clearTimeout(ha1TimerRef.current);
          ha1TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA1(false); }, GAME.HEART_ANIM_MS);
        } else {
          setHA2(true);
          if (ha2TimerRef.current) clearTimeout(ha2TimerRef.current);
          ha2TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA2(false); }, GAME.HEART_ANIM_MS);
        }
        onDamage?.();
        break;
        case "shake":
          if (event.player === 1) {
            setShake1(true);
            if (shake1TimerRef.current) clearTimeout(shake1TimerRef.current);
            shake1TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake1(false); }, GAME.SHAKE_ANIM_MS);
          } else {
            setShake2(true);
            if (shake2TimerRef.current) clearTimeout(shake2TimerRef.current);
            shake2TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake2(false); }, GAME.SHAKE_ANIM_MS);
          }
          break;
        case "levelUp":
          if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
          setLevelUpBadge(`Stage ${event.stage}`);
          levelUpTimerRef.current = setTimeout(() => { if (mountedRef.current) setLevelUpBadge(null); }, GAME.LEVELUP_BADGE_MS);
          break;
        case "rareStart":
          setRareSplash({ color: event.color, cssColor: event.cssColor });
          if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
          rareSplashTimerRef.current = setTimeout(() => { if (mountedRef.current) setRareSplash(null); }, GAME.RARE_SPLASH_MS);
          break;
        case "gameOver":
          const snap2 = engine.getSnapshot();
          const seedAtGameOver = snap2.gameSeed;
          if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setWinner(event.winner);
            setLastGameScore(config.numPlayers === 1 ? snap2.p1.score : Math.max(snap2.p1.score, snap2.p2?.score ?? 0));
            onGameOverRef.current(event.winner, snap2.p1.score, snap2.p2?.score ?? 0, seedAtGameOver);
          }, GAME.GAME_OVER_DELAY_MS);
          break;
        case "botTap":
          // dust spend is already done in engine, just trigger re-render via dustCallbacks
          if (dustCallbacks) dustCallbacks.spendDust(0);
          setBotTapHighlights(prev => ({
            ...prev,
            [event.player]: { ...prev[event.player], [event.idx]: Date.now() },
          }));
          botTapTimersRef.current.push(setTimeout(() => {
            if (!mountedRef.current) return;
            setBotTapHighlights(prev => {
              const nextPlayer = { ...prev[event.player] };
              delete nextPlayer[event.idx];
              return { ...prev, [event.player]: nextPlayer };
            });
          }, 420));
          // Track per-tap dust cost for floating marker
          if (event.dustCost) {
            const fx: BotTapFx = {
              id: `bot-fx-${event.player}-${event.idx}-${Date.now()}`,
              idx: event.idx,
              dustCost: event.dustCost,
              at: Date.now(),
            };
            setBotTapFx(prev => [...prev, fx]);
            botTapTimersRef.current.push(setTimeout(() => {
              if (mountedRef.current) setBotTapFx(prev => prev.filter(f => f.id !== fx.id));
            }, 650));
          }
          break;
        case "bossStart":
          onBossEvent?.(event.bossType);
          break;
        case "bombDefused":
          onBombDefused?.();
          break;
      }
    });

    const handleVisibility = () => {
      if (!engineRef.current) return;
      if (document.hidden) {
        engineRef.current.pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      engine.stopSessionPersistence();
      sessionManager.clear();
      unsub();
      engine.destroy();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
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
      botTapTimersRef.current.forEach(clearTimeout);
      botTapTimersRef.current = [];
    };
  }, [config.mode, config.numPlayers, config.speedMult]);

  const startBot = useCallback(() => engineRef.current?.startBot(), []);
  const stopBot  = useCallback(() => engineRef.current?.stopBot(), []);
  const isBotActive = useCallback(() => engineRef.current?.isBotActive() ?? false, []);

  const setBotAssist = useCallback((player: 1 | 2, enabled: boolean) => {
    engineRef.current?.setBotAssist(player, enabled);
    setBotAssistActiveState(prev => ({ ...prev, [player]: enabled }));
  }, []);

  const pause  = useCallback(() => engineRef.current?.pause(),  []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const handleTap = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleTap(player, idx), []);
  const handleHoldStart = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldStart(player, idx), []);
  const handleHoldEnd = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldEnd(player, idx), []);
  const activateStoredFreeze = useCallback((player: 1 | 2) => engineRef.current?.activateStoredFreeze(player), []);
  const activateStoredShield = useCallback((player: 1 | 2) => engineRef.current?.activateStoredShield(player), []);
  const devForceStage   = useCallback((s: number) => engineRef.current?.devForceStage(s),   []);
  const devForcePattern = useCallback((i: number) => engineRef.current?.devForcePattern(i),  []);
  const devForceRare    = useCallback((r: { color: string; cssColor: string } | null) => engineRef.current?.devForceRare(r), []);
  const devSetGodMode   = useCallback((v: boolean) => engineRef.current?.devSetGodMode(v), []);
  const devSetFreezeTime= useCallback((v: boolean) => engineRef.current?.devSetFreezeTime(v), []);
  const devSetRotationSpeed = useCallback((v: number) => engineRef.current?.devSetRotationSpeed(v), []);
  const devSpawnPowerup = useCallback((type: "shield" | "freeze" | "heart") => engineRef.current?.devSpawnPowerup(type), []);
  const devSpawnSpecialCell = useCallback((player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => engineRef.current?.devSpawnSpecialCell(player, type, idx), []);
  const devTriggerBotTap = useCallback((player: 1 | 2, idx: number, dustCost?: number) => engineRef.current?.devTriggerBotTap(player, idx, dustCost), []);
  const devToggleBotAssist = useCallback((player: 1 | 2, enabled: boolean) => engineRef.current?.devToggleBotAssist(player, enabled), []);
  const getAutoLowQuality = useCallback(() => engineRef.current?.getAutoLowQuality() ?? false, []);

  const submitScoreToLeaderboard = useCallback((score: number) => {
    engineRef.current?.submitScoreToLeaderboard(score);
  }, []);

  const generateChallengeUrl = useCallback(async (): Promise<string> => {
    return (await engineRef.current?.generateChallengeUrl()) ?? '';
  }, []);

  const restoreSessionSnapshot = useCallback((data: Record<string, unknown>): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.restoreSessionSnapshot(data);
  }, []);

  const restoreSession = useCallback((): boolean => {
    const raw = sessionStorage.getItem('dtp:session-ui');
    if (!raw || !engineRef.current) return false;
    try {
      const { engineSnapshot } = JSON.parse(raw);
      engineRef.current.restoreFromSession(engineSnapshot);
      engineRef.current.startSessionPersistence();
      return true;
    } catch { return false; }
  }, []);

  const wrappedStart = useCallback((forceSeed?: number) => {
    setWinner(null);
    setLastGameScore(null);
    setRareSplash(null);
    setLevelUpBadge(null);
    setBotTapHighlights({ 1: {}, 2: {} });
    engineRef.current?.start(forceSeed);
    engineRef.current?.startSessionPersistence();
  }, []);

  return {
    snapshot, heartAnimP1, heartAnimP2, shakeGrid1, shakeGrid2, toast, pwrToastP1, pwrToastP2, levelUpBadge, rareSplash, winner, lastGameScore,
    start: wrappedStart, pause, resume, handleTap, handleHoldStart, handleHoldEnd,
    activateStoredFreeze, activateStoredShield, devForceStage, devForcePattern, devForceRare,
    devSetGodMode, devSetFreezeTime, devSetRotationSpeed, devSpawnPowerup,
    devSpawnSpecialCell, devTriggerBotTap, devToggleBotAssist,
    startBot, stopBot, isBotActive, setBotAssist, botAssistActive, botTapHighlights, botTapFx,
    getAutoLowQuality, submitScoreToLeaderboard, restoreSession, restoreSessionSnapshot, generateChallengeUrl,
  };
}
