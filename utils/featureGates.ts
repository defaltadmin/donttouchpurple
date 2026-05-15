/* Progressive feature unlocking: lock advanced modes behind milestones */
import { logger } from './logger';

export type FeatureId = 
  | 'evolve_mode'      // Unlock after 500 score in classic
  | 'two_player'       // Unlock after 3 classic wins
  | 'daily_challenges' // Unlock after first game completion
  | 'leaderboard'      // Unlock after submitting first score
  | 'shop'             // Available immediately
  | 'settings'         // Available immediately
  | 'changelog'        // Unlock after first game completion
  | 'bot_assist'       // Unlock after 3 deaths (teaches necessity)
  ;

export interface FeatureGate {
  id: FeatureId;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockHint?: string;
  requirement?: { type: 'score' | 'wins' | 'games_played' | 'deaths'; value: number };
}

const FEATURE_DEFINITIONS: Record<FeatureId, Omit<FeatureGate, 'unlocked'>> = {
  evolve_mode: {
    id: 'evolve_mode',
    label: 'Evolve Mode',
    description: 'Dynamic difficulty, boss events, power-ups',
    icon: '⚡',
    unlockHint: 'Score 500+ in Classic to unlock',
    requirement: { type: 'score', value: 500 },
  },
  two_player: {
    id: 'two_player',
    label: '2-Player Mode',
    description: 'Compete side-by-side on the same device',
    icon: '👥',
    unlockHint: 'Win 3 Classic games to unlock',
    requirement: { type: 'wins', value: 3 },
  },
  daily_challenges: {
    id: 'daily_challenges',
    label: 'Daily Challenges',
    description: 'Unique seed-based challenges every day',
    icon: '📅',
    unlockHint: 'Complete your first game to unlock',
    requirement: { type: 'games_played', value: 1 },
  },
  leaderboard: {
    id: 'leaderboard',
    label: 'Global Leaderboard',
    description: 'Compete with players worldwide',
    icon: '🏆',
    unlockHint: 'Submit your first score to unlock',
    requirement: { type: 'games_played', value: 1 }, // Simplified: unlock after any game
  },
  shop: {
    id: 'shop',
    label: 'Theme Shop',
    description: 'Customize your game with new visuals',
    icon: '🛒',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    description: 'Adjust audio, accessibility, and more',
    icon: '⚙️',
  },
  changelog: {
    id: 'changelog',
    label: 'What\'s New',
    description: 'See the latest updates and features',
    icon: '📜',
    unlockHint: 'Complete your first game to unlock',
    requirement: { type: 'games_played', value: 1 },
  },
  bot_assist: {
    id: 'bot_assist',
    label: 'Bot Assist',
    description: 'AI helper for tough moments (Evolve Mode)',
    icon: '🤖',
    unlockHint: 'Lose 3 times to unlock assistance',
    requirement: { type: 'deaths', value: 3 },
  },
};

export const featureGates = {
  STORAGE_KEY: 'dtp:feature-unlocks',
  
  // Load unlock state from localStorage
  load(): Record<FeatureId, boolean> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this._getDefaultState();
      const parsed = JSON.parse(raw) as Partial<Record<FeatureId, boolean>>;
      return { ...this._getDefaultState(), ...parsed } as Record<FeatureId, boolean>;
    } catch {
      return this._getDefaultState();
    }
  },

  // Save unlock state
  save(state: Record<FeatureId, boolean>) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  },

  // Get default state: only basics unlocked for new players
  _getDefaultState(): Record<FeatureId, boolean> {
    return {
      evolve_mode: false,
      two_player: false,
      daily_challenges: false,
      leaderboard: false,
      shop: true,      // Always available
      settings: true,  // Always available
      changelog: false,
      bot_assist: false,
    };
  },

  // Check if a feature is unlocked
  isUnlocked(id: FeatureId, progress: PlayerProgress, devMode = false): boolean {
    if (devMode) return true; // All features unlocked in dev mode

    const def = FEATURE_DEFINITIONS[id];
    if (!def.requirement) return true; // Always unlocked if no requirement

    switch (def.requirement.type) {
      case 'score': return progress.bestScore >= def.requirement.value;
      case 'wins': return progress.wins >= def.requirement.value;
      case 'games_played': return progress.gamesPlayed >= def.requirement.value;
      case 'deaths': return progress.deaths >= def.requirement.value;
      default: return false;
    }
  },

  // Get all features with current unlock status
  getAll(progress: PlayerProgress, devMode = false): FeatureGate[] {
    const unlocks = this.load();
    return (Object.values(FEATURE_DEFINITIONS) as FeatureGate[]).map(def => ({
      ...def,
      unlocked: devMode || unlocks[def.id] || this.isUnlocked(def.id, progress),
    }));
  },

  // Mark a feature as unlocked (e.g., after milestone reached)
  unlock(id: FeatureId) {
    const state = this.load();
    if (!state[id]) {
      state[id] = true;
      this.save(state);
      logger.info(`🔓 Feature unlocked: ${id}`);
      window.dispatchEvent(new CustomEvent('dtp:feature-unlocked', { detail: { id } }));
    }
  },

  // Reset all unlocks (for testing)
  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

export interface PlayerProgress {
  bestScore: number;
  wins: number;
  gamesPlayed: number;
  deaths: number;
}
