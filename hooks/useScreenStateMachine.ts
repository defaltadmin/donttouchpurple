/* Centralized screen transitions + feature-gated UI state */
import { useState, useCallback, useEffect, useRef } from 'react';
import { featureGates, PlayerProgress, FeatureId, ALL_FEATURE_IDS } from '../utils/featureGates';
import { logger } from '../utils/logger';

export type Screen =
  | 'loading'
  | 'onboarding'
  | 'menu'
  | 'playing'
  | 'gameover'
  | 'paused'
  | 'shop'
  | 'leaderboard'
  | 'settings'
  | 'changelog'
  | 'howto'
  | 'keybind'
  | 'gamemaster';

export interface ScreenState {
  current: Screen;
  previous: Screen | null;
  canTransition: (to: Screen) => boolean;
  transition: (to: Screen) => void;
  isFeatureUnlocked: (feature: FeatureId, devMode?: boolean) => boolean;
  progress: PlayerProgress;
  updateProgress: (partial: Partial<PlayerProgress>) => void;
}

const VALID_TRANSITIONS: Record<Screen, Screen[]> = {
  loading:     ['onboarding', 'menu'],
  onboarding:  ['menu'],
  menu:        ['playing', 'shop', 'leaderboard', 'settings', 'changelog', 'howto', 'keybind', 'gamemaster'],
  playing:     ['paused', 'gameover', 'menu'],
  paused:      ['playing', 'menu'],
  gameover:    ['playing', 'menu', 'leaderboard'],
  shop:        ['menu'],
  leaderboard: ['menu'],
  settings:    ['menu'],
  changelog:   ['menu'],
  howto:       ['menu'],
  keybind:     ['menu'],
  gamemaster:  ['menu'],
};

export function useScreenStateMachine(initialProgress?: Partial<PlayerProgress>): ScreenState {
  const [current, setCurrent] = useState<Screen>('loading');
  const [previous, setPrevious] = useState<Screen | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>({
    bestScore: 0,
    wins: 0,
    gamesPlayed: 0,
    deaths: 0,
    ...initialProgress
  });

  const [unlocks, setUnlocks] = useState<Record<string, boolean>>(() => featureGates.load());
  const unlocksRef = useRef(unlocks);
  useEffect(() => { unlocksRef.current = unlocks; }, [unlocks]);

  // Listen for external unlocks
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      setUnlocks(prev => ({ ...prev, [id]: true }));
    };
    window.addEventListener('dtp:feature-unlocked', handler);
    return () => window.removeEventListener('dtp:feature-unlocked', handler);
  }, []);

  const updateProgress = useCallback((partial: Partial<PlayerProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...partial };
      // Check for new unlocks automatically using all feature IDs
      ALL_FEATURE_IDS.forEach(id => {
        if (!unlocksRef.current[id] && featureGates.isUnlocked(id, next)) {
          featureGates.unlock(id);
        }
      });
      return next;
    });
  }, []);

  const canTransition = useCallback((to: Screen) => {
    if (to === current) return false;
    return VALID_TRANSITIONS[current]?.includes(to) ?? false;
  }, [current]);

  const transition = useCallback((to: Screen) => {
    // Issue 24: Use functional setCurrent to eliminate stale closure over `current` and `canTransition`
    setCurrent(prev => {
      if (prev === to || !VALID_TRANSITIONS[prev]?.includes(to)) return prev;
      setPrevious(prev);
      return to;
    });
  }, []);

  const isFeatureUnlocked = useCallback((feature: FeatureId, devMode = false) => {
    return devMode || unlocks[feature] || featureGates.isUnlocked(feature, progress);
  }, [unlocks, progress]);

  return {
    current,
    previous,
    canTransition,
    transition,
    isFeatureUnlocked,
    progress,
    updateProgress
  };
}
