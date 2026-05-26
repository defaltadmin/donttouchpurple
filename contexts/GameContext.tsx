// contexts/GameContext.tsx
// Isolates high-frequency snapshot updates from the rest of the UI.
// Only components that consume this context re-render on every tick.
import React, { createContext, useState, useCallback, useRef } from "react";
import type { GameSnapshot, Winner } from "../engine/types";

type GameMode   = "classic" | "evolve";
type NumPlayers = 1 | 2;
type InputMode  = "touch" | "keyboard";

interface GameContextValue {
  snapshot: GameSnapshot | null;
  setSnapshot: (s: GameSnapshot | null) => void;
  snapshotRef: React.MutableRefObject<GameSnapshot | null>;
  winner: Winner;
  setWinner: (w: Winner) => void;
  lastGameScore: number | null;
  setLastGameScore: (s: number | null) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  numPlayers: NumPlayers;
  setNumPlayers: (n: NumPlayers) => void;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  speedMult: number;
  setSpeedMult: (v: number) => void;
  practiceMode: boolean;
  setPracticeMode: (v: boolean) => void;
  godMode: boolean;
  setGodMode: (v: boolean) => void;
  gameSeedState: number;
  setGameSeedState: (v: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const snapshotRef = useRef<GameSnapshot | null>(null);
  const [snapshot, _setSnapshot] = useState<GameSnapshot | null>(null);
  const setSnapshot = useCallback((s: GameSnapshot | null) => {
    snapshotRef.current = s;
    _setSnapshot(s);
  }, []);

  const [winner, setWinner]               = useState<Winner>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);
  const [paused, setPaused]               = useState(false);
  const [gameMode, setGameMode]           = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers]       = useState<NumPlayers>(1);
  const [inputMode, setInputMode]         = useState<InputMode>("touch");
  const [speedMult, setSpeedMult]         = useState(1);
  const [practiceMode, setPracticeMode]   = useState(false);
  const [godMode, setGodMode]             = useState(false);
  const [gameSeedState, setGameSeedState] = useState(0);

  return (
    <GameContext.Provider value={{
      snapshot, setSnapshot, snapshotRef,
      winner, setWinner,
      lastGameScore, setLastGameScore,
      paused, setPaused,
      gameMode, setGameMode,
      numPlayers, setNumPlayers,
      inputMode, setInputMode,
      speedMult, setSpeedMult,
      practiceMode, setPracticeMode,
      godMode, setGodMode,
      gameSeedState, setGameSeedState,
    }}>
      {children}
    </GameContext.Provider>
  );
}

