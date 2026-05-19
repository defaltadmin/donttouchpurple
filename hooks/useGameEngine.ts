import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../engine/GameEngine";
import { sessionManager } from "../utils/session";
import { logger } from "../utils/logger";
import type { GameConfig, GameEvent, GameSnapshot, Winner, StoredPowerups } from "../engine/types";
import { LS_KEYS, GAME } from "../config/difficulty";
import {
  setAudioMuted,
  setAudioVolume,
  setHapticsEnabled,
  playVolumeChime,
  playSoundEffect,
  playSound,
} from "./useAudio";

export { setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime, playSoundEffect };
export function loadStoredPwr(): StoredPowerups {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) {
      const d = JSON.parse(r);
      return { freeze: d.freeze ?? 0, shield: d.shield ?? 0, mult: d.mult ?? 0, heart: d.heart ?? 0 };
    }
  } catch (e) {
    // Fix #8: Add logging for storage failures
    logger.error('Failed to load stored powerups', e);
  }
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

export function saveStoredPwr(d: StoredPowerups): void {
  try { 
    localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); 
  } catch (e) {
    logger.error('Failed to save stored powerups', e);
  }
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
  scoreFloats: { id: number; player: 1 | 2; idx: number; amount: number }[];
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
  const [scoreFloats, setScoreFloats] = useState<{ id: number; player: 1 | 2; idx: number; amount: number }[]>([]);
  const scoreFloatIdRef = useRef(0);

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
        case "tick": {
          if (mountedRef.current) setSnapshot(event.snapshot);
          {
            const snap = event.snapshot;
            if (snap && snap.p1.streak > (peakStreakRef.current ?? 0)) {
              peakStreakRef.current = snap.p1.streak;
            }
          }
          break;
        }
        case "sound": playSound(event.name, event.pitchMult); break;
        case "scoreFloat": {
          const id = ++scoreFloatIdRef.current;
          setScoreFloats(prev => [...prev, { id, player: event.player, idx: event.idx, amount: event.amount }]);
          setTimeout(() => setScoreFloats(prev => prev.filter(f => f.id !== id)), 800);
          break;
        }
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
        case "gameOver": {
          const snap2 = engine.getSnapshot(); const seedAtGameOver = snap2.gameSeed;
          if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setWinner(event.winner);
            setLastGameScore(config.numPlayers === 1 ? snap2.p1.score : Math.max(snap2.p1.score, snap2.p2?.score ?? 0));
            onGameOverRef.current(event.winner, snap2.p1.score, snap2.p2?.score ?? 0, seedAtGameOver);
          }, GAME.GAME_OVER_DELAY_MS);
          break;
        }
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
        case "qualityDowngrade":
          toast$("📉 Performance mode: Particles disabled");
          break;
        case "qualityUpgrade":
          toast$("📈 Standard mode restored");
          break;
      }
    });

    const handleVisibility = () => {
      if (!engineRef.current) return;
      // Fix #4: Check phase to prevent pausing during gameover
      const snap = engineRef.current.getSnapshot?.();
      if (document.hidden && snap?.phase === 'playing') {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally read the latest ref value in cleanup
      const rafId = rafIdRef.current;
      if (rafId) cancelAnimationFrame(rafId);
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
      // Fix #9: Cap botTapTimersRef cleanup to prevent unbounded growth
      botTapTimersRef.current.forEach(clearTimeout);
      botTapTimersRef.current = [];
    };
  }, [config.mode, config.numPlayers, config.speedMult, config, dustCallbacks, onBombDefused, onBossEvent, onDamage, toast$]);

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
    startBot, stopBot, isBotActive, setBotAssist, botAssistActive, botTapHighlights, botTapFx, scoreFloats,
    getAutoLowQuality, submitScoreToLeaderboard, restoreSession, restoreSessionSnapshot, generateChallengeUrl,
  };
}
