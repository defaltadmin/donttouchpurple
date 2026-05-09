/* Centralized screen transitions + feature-gated UI state */
import { useState, useCallback, useEffect } from 'react';
import { featureGates, PlayerProgress, FeatureId } from '../utils/featureGates';
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
  | 'keybind';

export interface ScreenState {
  current: Screen;
  previous: Screen | null;
  canTransition: (to: Screen) => boolean;
  transition: (to: Screen, payload?: any) => void;
  isFeatureUnlocked: (feature: FeatureId) => boolean;
  progress: PlayerProgress;
  updateProgress: (partial: Partial<PlayerProgress>) => void;
}

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

  // Listen for external unlocks
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      setUnlocks(prev => ({ ...prev, [id]: true }));
    };
    window.addEventListener('dtp:feature-unlocked', handler);
    return () => window.removeEventListener('dtp:feature-unlocked', handler);
  }, []);

  const updateProgress = useCallback((partial: Partial<PlayerProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...partial };
      // Check for new unlocks automatically
      const currentUnlocks = featureGates.load();
      
      (Object.keys(currentUnlocks) as FeatureId[]).forEach(id => {
        if (!currentUnlocks[id] && featureGates.isUnlocked(id, next)) {
          featureGates.unlock(id);
        }
      });
      
      return next;
    });
  }, []);

  const canTransition = useCallback((to: Screen) => {
    if (to === current) return false;
    // Add logic here if certain transitions are prohibited
    return true; 
  }, [current]);

  const transition = useCallback((to: Screen, payload?: any) => {
    if (!canTransition(to)) return;
    
    logger.debug(`🖥️ Transition: ${current} -> ${to}`);
    setPrevious(current);
    setCurrent(to);
  }, [current, canTransition]);

  const isFeatureUnlocked = useCallback((feature: FeatureId) => {
    return unlocks[feature] || featureGates.isUnlocked(feature, progress);
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
