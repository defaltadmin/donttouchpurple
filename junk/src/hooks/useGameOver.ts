import { useCallback, useRef } from "react";
import type { Winner } from "../engine/types";
import { getMessage } from "../utils/shareMessages";
import { safeSentry } from "../utils/sentry";
import { logProgressionEvent } from "../services/gameanalytics";
import { checkAchievements } from "../utils/achievements";

let _firebase: typeof import('../services/firebase') | null = null;
async function getFirebase() {
  if (!_firebase) _firebase = await import('../services/firebase');
  return _firebase;
}

interface GameOverDeps {
  // identity
  playerName: string;
  numPlayers: number;
  gameMode: "classic" | "evolve";
  // progress
  best1: number;
  best2: number;
  wins: number;
  deaths: number;
  gamesPlayed: number;
  // updaters
  updateBest:  (mode: "classic" | "evolve", score: number) => void;
  recordResult:(p1Score: number, numPlayers: number, winner: string | null) => { newWins: number; newDeaths: number };
  addDust:     (amount: number, source: string) => number;
  updateChallengeProgress: (score: number, tick: number, mode: string) => void;
  updateWeeklyProgress:    (score: number, streak: number, dust: number, games: number) => void;
  machine:     { updateProgress: (p: any) => void };
  shopData:    any;
  // state setters
  setScreen:          (s: string) => void;
  setShareMsg:        (m: string) => void;
  setShouldShowRewardsAfterGame: (v: boolean) => void;
  toast$:             (m: string) => void;
  // refs
  peakStreakRef:      React.RefObject<number>;
  dustAtStartRef:     React.RefObject<number>;
  dustRef:            React.RefObject<number>;
  scoreSubmittedRef:  React.MutableRefObject<boolean>;
  pbFlashedRef:       React.MutableRefObject<boolean>;
  bossCounters:       { bossSurvived: number; bombsDefused: number; inversionSurvived: number };
  snapshotRef:        React.MutableRefObject<any>;
  // combo reset
  resetCombo: () => void;
}

export function useGameOver(deps: GameOverDeps) {
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const handleEngineGameOver = useCallback(async (
    engineWinner: Winner,
    p1Score: number,
    p2Score: number,
    gameSeed?: number
  ) => {
    const d = depsRef.current;

    // Reset combo badge immediately
    d.resetCombo();

    // Record win/death
    const { newWins, newDeaths } = d.recordResult(p1Score, d.numPlayers, engineWinner);

    // Update best score
    const gameHighScore = d.gameMode === "classic"
      ? p1Score
      : Math.max(p1Score, p2Score ?? 0);
    const prevBest = d.gameMode === "classic" ? d.best1 : d.best2;
    const isNewBest = gameHighScore > prevBest;
    d.updateBest(d.gameMode, gameHighScore);

    // Dust reward
    const dustBase     = Math.floor(p1Score * 0.4);
    const dustBonus    = isNewBest ? 20 : 0;
    const bossBonus    = d.bossCounters.bossSurvived    * 15
                       + d.bossCounters.bombsDefused    * 10
                       + d.bossCounters.inversionSurvived * 8;
    const dustEarned   = dustBase + dustBonus + bossBonus;
    const dustAtStart  = d.dustAtStartRef.current ?? 0;
    const newDust      = d.addDust(dustEarned, "GameEnd");

    // Share message
    try { d.setShareMsg(getMessage({ score: p1Score, isNewBest, wins: newWins })); } catch {}

    // Challenge + weekly progress
    const finalTick = d.snapshotRef.current?.tick ?? 0;
    d.updateChallengeProgress(p1Score, finalTick, d.gameMode);
    d.updateWeeklyProgress(p1Score, d.peakStreakRef.current ?? 0, dustEarned, d.gamesPlayed + 1);

    // Feature gate progress
    d.machine.updateProgress({
      gamesPlayed:  d.gamesPlayed + 1,
      score:        gameHighScore,
      wins:         newWins,
      deaths:       newDeaths,
      dust:         newDust,
    });

    // Achievements
    try {
      checkAchievements({
        score: p1Score,
        isNewBest,
        streak: d.peakStreakRef.current ?? 0,
        wins:   newWins,
        deaths: newDeaths,
        mode:   d.gameMode,
        bossCounters: d.bossCounters,
      });
    } catch {}

    // Firebase submit
    if (!d.scoreSubmittedRef.current && p1Score > 0 && d.numPlayers === 1) {
      d.scoreSubmittedRef.current = true;
      try {
        const fb = await getFirebase();
        await fb.submitScore(d.playerName, p1Score, d.gameMode, gameSeed);
      } catch (e) {
        safeSentry.captureException(e);
      }
    }

    // Analytics
    logProgressionEvent("Complete", d.gameMode, `score_${p1Score}`);
    safeSentry.addBreadcrumb({
      category: "game",
      message:  "game_over",
      level:    "info",
      data: {
        score:    p1Score,
        mode:     d.gameMode,
        isNewBest,
        dustEarned,
        wins:     newWins,
      },
    });

    // Transition
    d.setScreen("gameover");

    // First-game reward popup
    if (localStorage.getItem('dtp-show-rewards-after-first-game') === '1') {
      localStorage.removeItem('dtp-show-rewards-after-first-game');
      d.setShouldShowRewardsAfterGame(true);
    }
  }, []);

  return { handleEngineGameOver };
}
