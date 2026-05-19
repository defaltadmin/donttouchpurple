import { useCallback, useRef, useState } from "react";
import { safeSentry } from "../services/sentry";
import { logProgressionEvent } from "../services/gameanalytics";
import type { EnergyData } from "./useAppResources";

interface GameStartDeps {
  energyData: EnergyData;
  practiceMode: boolean;
  evolveTutorialSeen: boolean;
  gameMode: string;
  numPlayers: number;
  inputMode: string;
  pendingReplaySeed: string | null;
  gamesPlayed: number;
  dustRef: React.MutableRefObject<number>;
  startEngine: (seed?: number) => void;
  spendEnergy: () => void;
  clearReplaySeed: () => void;
  getFirebase: () => Promise<any>;
  toast$: (msg: string) => void;
  setScreen: (s: string) => void;
  setPaused: (v: boolean) => void;
  setShowTutorial: (v: boolean) => void;
  setEvolveTutorialSeen: (v: boolean) => void;
  setGamesPlayed: (n: number) => void;
  EVOLVE_TUTORIAL_SEEN_KEY: string;
}

export function useGameStartActions(deps: GameStartDeps) {
  const resumeCheckedRef = useRef(false);
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const scoreSubmittedRef = useRef(false);
  const peakStreakRef = useRef(0);
  const dustAtStartRef = useRef(0);
  const pbFlashedRef = useRef(false);
  const [bossCounters, setBossCounters] = useState({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });

  const startGame = useCallback(() => {
    resumeCheckedRef.current = false;
    setResumeReady(false);
    setResumeData(null);
    if (!deps.practiceMode && deps.energyData.count <= 0) {
      deps.toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    if (!deps.evolveTutorialSeen) {
      deps.setShowTutorial(true);
      return;
    }
    if (!deps.practiceMode) deps.spendEnergy();
    deps.setScreen("playing");
    deps.setPaused(false);
    scoreSubmittedRef.current = false;
    peakStreakRef.current = 0;
    dustAtStartRef.current = deps.dustRef.current;
    pbFlashedRef.current = false;
    setBossCounters({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
    const next = deps.gamesPlayed + 1;
    localStorage.setItem('dtp-games-played', String(next));
    deps.setGamesPlayed(next);
    const forceSeed = deps.pendingReplaySeed ? parseInt(deps.pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({
      category: "game",
      message: "game_start",
      level: "info",
      data: { gameMode: deps.gameMode, numPlayers: deps.numPlayers, inputMode: deps.inputMode, practiceMode: deps.practiceMode, forceSeed },
    });
    deps.getFirebase().then((fb: any) => fb.fbLogEvent("game_start", {
      mode: deps.gameMode,
      players: deps.numPlayers,
      input: deps.inputMode,
      practice: deps.practiceMode,
      replay_seed: forceSeed ?? 0,
    })).catch(() => {});
    logProgressionEvent("Start", deps.gameMode, 0, 0);
    deps.startEngine(forceSeed);
    if (forceSeed !== undefined) {
      deps.clearReplaySeed();
    }
  }, [deps]);

  const handleTutorialClose = useCallback(() => {
    deps.setShowTutorial(false);
    localStorage.setItem(deps.EVOLVE_TUTORIAL_SEEN_KEY, '1');
    deps.setEvolveTutorialSeen(true);
    if (!deps.practiceMode && deps.energyData.count <= 0) {
      deps.toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    const next = deps.gamesPlayed + 1;
    localStorage.setItem('dtp-games-played', String(next));
    deps.setGamesPlayed(next);
    if (next === 1) {
      localStorage.setItem('dtp-show-rewards-after-first-game', '1');
    }
    if (!deps.practiceMode) deps.spendEnergy();
    deps.setScreen("playing");
    deps.setPaused(false);
    scoreSubmittedRef.current = false;
    peakStreakRef.current = 0;
    dustAtStartRef.current = deps.dustRef.current;
    pbFlashedRef.current = false;
    const forceSeed = deps.pendingReplaySeed ? parseInt(deps.pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({ category: "tutorial", message: "tutorial_completed", level: "info", data: { game: next } });
    deps.getFirebase().then((fb: any) => fb.fbLogEvent("game_start", {
      mode: deps.gameMode,
      players: deps.numPlayers,
      input: deps.inputMode,
      practice: deps.practiceMode,
      replay_seed: forceSeed ?? 0,
      tutorial_completed: true,
    })).catch(() => {});
    logProgressionEvent("Start", deps.gameMode, 0, 0);
    deps.startEngine(forceSeed);
    if (forceSeed !== undefined) {
      deps.clearReplaySeed();
    }
  }, [deps]);

  return {
    startGame,
    handleTutorialClose,
    resumeCheckedRef,
    resumeReady, setResumeReady,
    resumeData, setResumeData,
    scoreSubmittedRef,
    peakStreakRef,
    dustAtStartRef,
    pbFlashedRef,
    bossCounters, setBossCounters,
  };
}
