import { useState, useCallback, useRef } from 'react';
import { LS_KEYS } from '../config/difficulty';
import { safeSet } from '../utils/storage';
import { logger } from '../utils/logger';
import { safeSentry } from '../services/sentry';
import { getMessage } from '../components/Screens/GameOver';
type FirebaseModule = typeof import('../services/firebase');

interface ScoreSubmissionOptions {
  gameMode: 'classic' | 'evolve';
  numPlayers: 1 | 2;
  playerName: string;
  shopBadge?: string;
  addDust: (amount: number, source: string) => number;
  machine: { updateProgress: (p: Record<string, number>) => void };
  getFirebase: () => Promise<FirebaseModule>;
  logProgressionEvent: (event: string, mode: string, score: number, tick: number) => void;
  toast$: (msg: string) => void;
  snapshotRef: React.RefObject<{ tick: number; gameSeed: number } | null>;
}

export interface ScoreSubmissionReturn {
  gamesPlayed: number;
  best1: number;
  best2: number;
  wins: number;
  deaths: number;
  prevBest: number;
  setPrevBest: React.Dispatch<React.SetStateAction<number>>;
  scoreSubmittedRef: React.MutableRefObject<boolean>;
  setShareMsg: React.Dispatch<React.SetStateAction<string>>;
  setGameSeedState: React.Dispatch<React.SetStateAction<number>>;
  setInitials: React.Dispatch<React.SetStateAction<string>>;
  setIE: React.Dispatch<React.SetStateAction<boolean>>;
  incrementGamesPlayed: () => void;
  submitScore: (engineWinner: 'p1' | 'p2' | null, p1Score: number, p2Score: number, gameSeed?: number) => Promise<number>;
  shareMsg: string;
  gameSeedState: number;
  initials: string;
  ie: boolean;
}

export function useScoreSubmission(opts: ScoreSubmissionOptions): ScoreSubmissionReturn {
  const [gamesPlayed, setGamesPlayed] = useState(() =>
    parseInt(localStorage.getItem('dtp-games-played') || '0', 10)
  );
  const [best1, setBest1] = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  const [best2, setBest2] = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0"));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('dtp:wins') || '0', 10));
  const [deaths, setDeaths] = useState(() => parseInt(localStorage.getItem('dtp:deaths') || '0', 10));
  const [prevBest, setPrevBest] = useState(0);
  const scoreSubmittedRef = useRef(false);
  const [shareMsg, setShareMsg] = useState("");
  const [gameSeedState, setGameSeedState] = useState(0);
  const [initials, setInitials] = useState("");
  const [ie, setIE] = useState(false);

  const incrementGamesPlayed = useCallback(() => {
    setGamesPlayed(prev => {
      const next = prev + 1;
      safeSet('dtp-games-played', String(next));
      if (next === 1) {
        safeSet('dtp-show-rewards-after-first-game', '1');
      }
      return next;
    });
  }, []);

  const submitScore = useCallback(async (
    engineWinner: 'p1' | 'p2' | null,
    p1Score: number,
    p2Score: number,
    gameSeed?: number
  ): Promise<number> => {
    const { gameMode, numPlayers, playerName, shopBadge, addDust, machine, getFirebase, logProgressionEvent, toast$, snapshotRef } = opts;

    // Update progress tracking (use functional updates to avoid stale closures)
    let newWins = 0;
    let newDeaths = 0;
    let newGames = 0;
    setWins(prev => { newWins = prev + (engineWinner === "p1" ? 1 : 0); return newWins; });
    setDeaths(prev => { newDeaths = prev + (p1Score === 0 ? 1 : 0); return newDeaths; });
    setGamesPlayed(prev => { newGames = prev + 1; return newGames; });
    safeSet('dtp:wins', newWins.toString());
    safeSet('dtp:deaths', newDeaths.toString());

    machine.updateProgress({
      bestScore: Math.max(best1, best2, Math.max(p1Score, p2Score)),
      gamesPlayed: newGames,
      wins: newWins,
      deaths: newDeaths
    });

    const gameHighScore = gameMode === "classic" ? p1Score : Math.max(p1Score, p2Score);

    if (gameMode === "classic") {
      setBest1((b: number) => { const nb = Math.max(b, gameHighScore); safeSet(LS_KEYS.BEST_CLASSIC, nb.toString()); return nb; });
    } else {
      setBest2((b: number) => { const nb = Math.max(b, gameHighScore); safeSet(LS_KEYS.BEST_EVOLVE, nb.toString()); return nb; });
    }

    const earned = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);
    setShareMsg(getMessage(isNaN(earned) || !isFinite(earned) ? 0 : earned));
    setGameSeedState(gameSeed ?? snapshotRef.current?.gameSeed ?? 0);
    setInitials(playerName || "Player");
    setIE(false);

    safeSentry.addBreadcrumb({
      category: "game",
      message: "game_over",
      level: "info",
      data: { gameMode, numPlayers, p1Score, p2Score, winner: engineWinner, seed: gameSeed },
    });
    addDust(isNaN(earned) || !isFinite(earned) ? 0 : earned, 'GameOver');
    getFirebase().then(fb => {
      fb.fbLogEvent("game_over", {
        mode: gameMode,
        players: numPlayers,
        p1_score: p1Score,
        p2_score: p2Score,
        winner: engineWinner ?? "solo",
        seed: gameSeed ?? 0,
      });
    }).catch(e => logger.warn('Firebase operation failed', e));
    logProgressionEvent("Complete", gameMode, p1Score, snapshotRef.current?.tick ?? 0);

    // Auto-submit score through Cloudflare Worker (with offline fallback)
    try {
      const autoEntry = {
        score: numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score),
        initials: playerName || "Player",
        mode: gameMode,
        badge: shopBadge,
        date: new Date().toISOString().split("T")[0],
        tick: snapshotRef.current?.tick || 0
      };

      if (autoEntry.score > 0 && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;

        try {
          const response = await fetch('https://game.mscarabia.com/api/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(autoEntry)
          });

          if (!response.ok) throw new Error('Worker rejected');
          toast$("🏆 Score submitted to global leaderboard!");

        } catch {
          logger.warn("Worker offline, queuing score");
          const { addPendingScore } = await import('../utils/pendingScoresDb');
          await addPendingScore(autoEntry);

          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            (reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync?.register('dtp-score-submit');
          }
          toast$("💾 Score saved offline — will sync soon");
        }
      }
    } catch (err: unknown) {
      logger.warn('[DTP] Score submission failed', err);
    }

    return gameHighScore;
  }, [opts, wins, deaths, gamesPlayed, best1, best2]);

  return {
    gamesPlayed, best1, best2, wins, deaths,
    prevBest, setPrevBest,
    scoreSubmittedRef,
    setShareMsg, setGameSeedState, setInitials, setIE,
    shareMsg, gameSeedState, initials, ie,
    incrementGamesPlayed, submitScore,
  };
}
