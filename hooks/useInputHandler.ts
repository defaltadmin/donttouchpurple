import { useEffect, useCallback, useRef, useState } from "react";
import { EVOLVE_PATTERNS } from "../config/gridPatterns";
import type { GameMode, PlayerState } from "../engine/types";

// ─── Hook options ─────────────────────────────────────────────────
interface UseInputHandlerOptions {
  mode:       GameMode;
  numPlayers: 1 | 2;
  enabled:    boolean;   // false while paused / on menu / game over
  p1Keys:     string[];
  p2Keys:     string[];
  p1State:    PlayerState | null;
  p2State:    PlayerState | null;
  onTap:        (player: 1 | 2, idx: number) => void;
  onHoldStart:  (player: 1 | 2, idx: number) => void;
  onHoldEnd:    (player: 1 | 2, idx: number) => void;
  onPause:      () => void;
}

// ─── Hook return type ─────────────────────────────────────────────
export interface UseInputHandlerReturn {
  pressP1: Set<number>;
  pressP2: Set<number>;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useInputHandler({
  mode, numPlayers, enabled,
  p1Keys, p2Keys,
  p1State, p2State,
  onTap, onHoldStart, onHoldEnd, onPause,
}: UseInputHandlerOptions): UseInputHandlerReturn {
  const [pressP1, setPressP1] = useState<Set<number>>(new Set());
  const [pressP2, setPressP2] = useState<Set<number>>(new Set());

  // Cleanup refs for key-press visual timers
  const pressP1TimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const pressP2TimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Clear all press timers on unmount
  useEffect(() => {
    return () => {
      pressP1TimersRef.current.forEach(id => clearTimeout(id));
      pressP2TimersRef.current.forEach(id => clearTimeout(id));
    };
  }, []);
  const p1KeysRef  = useRef(p1Keys);
  const p2KeysRef  = useRef(p2Keys);
  const p1StateRef = useRef(p1State);
  const p2StateRef = useRef(p2State);
  const modeRef    = useRef(mode);
  const npRef      = useRef(numPlayers);

  useEffect(() => { p1KeysRef.current  = p1Keys;     }, [p1Keys]);
  useEffect(() => { p2KeysRef.current  = p2Keys;     }, [p2Keys]);
  useEffect(() => { p1StateRef.current = p1State;    }, [p1State]);
  useEffect(() => { p2StateRef.current = p2State;    }, [p2State]);
  useEffect(() => { modeRef.current    = mode;       }, [mode]);
  useEffect(() => { npRef.current      = numPlayers; }, [numPlayers]);

  // ── Key → grid index resolver ──
  const resolveKey = useCallback((
    key: string,
    keys: string[],
    state: PlayerState | null
  ): number => {
    if (!state) return -1;
    const k = key.toLowerCase();
    const patIdx = state.patternIdx;
    const sd = modeRef.current === "classic"
      ? { cols: 3, rows: 3, mask: null as number[] | null }
      : (EVOLVE_PATTERNS[patIdx] ?? { cols: 3, rows: 3, mask: null });
    const validSlots = sd.mask ?? Array.from({ length: sd.cols * sd.rows }, (_, i) => i);
    for (const i of validSlots) {
      const row = Math.floor(i / sd.cols);
      const col = i % sd.cols;
      if (keys[row * 4 + col] === k) return i;
    }
    return -1;
  }, []);

  // ── Keyboard handler ──
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") { onPause(); return; }

      const i1 = resolveKey(e.key, p1KeysRef.current, p1StateRef.current);
      const i2 = npRef.current === 2
        ? resolveKey(e.key, p2KeysRef.current, p2StateRef.current)
        : -1;

      if (i1 !== -1) {
        e.preventDefault();
        setPressP1(s => new Set([...s, i1]));
        const existing1 = pressP1TimersRef.current.get(i1);
        if (existing1) clearTimeout(existing1);
        pressP1TimersRef.current.set(i1, setTimeout(() => {
          setPressP1(s => { const n = new Set(s); n.delete(i1); return n; });
          pressP1TimersRef.current.delete(i1);
        }, 150));
        onTap(1, i1);
      } else if (i2 !== -1) {
        e.preventDefault();
        setPressP2(s => new Set([...s, i2]));
        const existing2 = pressP2TimersRef.current.get(i2);
        if (existing2) clearTimeout(existing2);
        pressP2TimersRef.current.set(i2, setTimeout(() => {
          setPressP2(s => { const n = new Set(s); n.delete(i2); return n; });
          pressP2TimersRef.current.delete(i2);
        }, 150));
        onTap(2, i2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onTap, onPause, resolveKey]);

  // ── Pointer event factory (returned to caller for Cell components) ──
  // Note: pointer events are wired directly in PlayerPanel JSX via onTap/onHoldStart/onHoldEnd.
  // pressP1/pressP2 sets are the only thing this hook returns for pointer visuals.

  return { pressP1, pressP2 };
}
