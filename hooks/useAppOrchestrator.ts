import { useState, useCallback, useRef } from "react";
import { useScreenStateMachine } from "./useScreenStateMachine";
import { LS_KEYS } from "../config/difficulty";
import { getDailyObjectives, markObjectiveComplete, checkObjective, getObjectiveProgress, type DailyObjective, type BossObjectiveCounters } from "../config/dailyObjective";
import { getMessage } from "../components/Screens/GameOver";
import { speedLabel } from "../engine/DifficultyScaler";
import { type EnergyData } from "./useAppResources";

export interface GameStats {
  best1: number;
  best2: number;
  wins: number;
  deaths: number;
  gamesPlayed: number;
}

export function useAppOrchestrator(params: {
  addDust: (amount: number, source: string) => number;
  energyData: EnergyData;
  setEnergyData: (data: EnergyData) => void;
  toast$: (msg: string) => void;
}) {
  const { addDust, energyData, setEnergyData, toast$ } = params;

  const [gameMode, setGameMode] = useState<"classic" | "evolve">("classic");
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
  const [inputMode, setInputMode] = useState<"touch" | "keyboard">("touch");
  const [practiceMode, setPracticeMode] = useState(false);

  const [best1, setBest1] = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  const [best2, setBest2] = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0"));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('dtp:wins') || '0', 10));
  const [deaths, setDeaths] = useState(() => parseInt(localStorage.getItem('dtp:deaths') || '0', 10));
  const [gamesPlayed, setGamesPlayed] = useState(() => parseInt(localStorage.getItem('dtp-games-played') || '0', 10));

  const machine = useScreenStateMachine({
    bestScore: Math.max(best1, best2),
    gamesPlayed,
    wins,
    deaths
  });

  const { current: screen, transition: setScreen } = machine;

  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>(() => getDailyObjectives());
  const [gameOverProgress, setGameOverProgress] = useState(0);
  const [shareMsg, setShareMsg] = useState("");
  const [gameSeedState, setGameSeedState] = useState(0);
  const [paused, setPaused] = useState(false);

  const [evolveTutorialSeen, setEvolveTutorialSeen] = useState(() =>
    Boolean(localStorage.getItem('dtp-evolve-tutorial-seen'))
  );

  const scoreSubmittedRef = useRef(false);
  const peakStreakRef = useRef(0);

  const updateProgress = useCallback((engineWinner: string | null, p1Score: number, p2Score: number, tick: number, bossCounters: BossObjectiveCounters) => {
    const gameHighScore = gameMode === "classic" ? p1Score : Math.max(p1Score, p2Score);
    
    const newWins = wins + (engineWinner === "p1" ? 1 : 0);
    const newDeaths = deaths + (p1Score === 0 ? 1 : 0);
    const newGames = gamesPlayed + 1;
    
    setWins(newWins);
    setDeaths(newDeaths);
    setGamesPlayed(newGames);
    localStorage.setItem('dtp:wins', newWins.toString());
    localStorage.setItem('dtp:deaths', newDeaths.toString());
    localStorage.setItem('dtp-games-played', newGames.toString());

    machine.updateProgress({
      bestScore: Math.max(best1, best2, gameHighScore),
      gamesPlayed: newGames,
      wins: newWins,
      deaths: newDeaths
    });

    if (gameMode === "classic") {
      setBest1(b => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_CLASSIC, nb.toString()); return nb; });
    } else {
      setBest2(b => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_EVOLVE, nb.toString()); return nb; });
    }

    const earned = isNaN(gameHighScore) || !isFinite(gameHighScore) ? 0 : gameHighScore;
    addDust(earned, 'GameOver');
    setShareMsg(getMessage(earned));
    
    // Objective check
    const objs = getDailyObjectives();
    const spd = speedLabel(tick, false);
    const progress = objs.length > 0 ? getObjectiveProgress(objs[0], tick, peakStreakRef.current, p1Score, spd, bossCounters) : 0;
    setGameOverProgress(progress);

    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      if (!obj.completed) {
        if (checkObjective(obj, tick, peakStreakRef.current, p1Score, spd, bossCounters)) {
          const completed = markObjectiveComplete(i);
          if (completed) {
            setDailyObjectives(prev => prev.map((o, idx) => idx === i ? completed : o));
            addDust(completed.reward, 'DailyObjective');
            toast$(`🎯 Daily Complete! +${completed.reward} 💜`);
          }
        }
      }
    }
  }, [gameMode, wins, deaths, gamesPlayed, best1, best2, machine, addDust, toast$]);

  const startGameConsumables = useCallback(() => {
    if (!practiceMode) {
      const newEd = { ...energyData, count: energyData.count - 1 };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      setEnergyData(newEd);
    }
    scoreSubmittedRef.current = false;
    peakStreakRef.current = 0;
    setPaused(false);
  }, [practiceMode, energyData, setEnergyData]);

  return {
    gameMode, setGameMode,
    numPlayers, setNumPlayers,
    inputMode, setInputMode,
    practiceMode, setPracticeMode,
    best1, best2, wins, deaths, gamesPlayed,
    screen, setScreen, machine,
    dailyObjectives, setDailyObjectives,
    gameOverProgress, shareMsg, setShareMsg,
    gameSeedState, setGameSeedState,
    paused, setPaused,
    evolveTutorialSeen, setEvolveTutorialSeen,
    updateProgress,
    startGameConsumables,
    peakStreakRef,
    scoreSubmittedRef
  };
}
