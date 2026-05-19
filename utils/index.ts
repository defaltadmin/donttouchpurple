// Central exports for all utility modules
// Grouped by domain for better organization

// ─── Analytics & Telemetry ──────────────────────────────────
export { analytics } from './analytics';
// Note: gameanalytics and clarity export functions, not modules - import directly from services/

// ─── State Management ──────────────────────────────────────
export { sessionManager } from './session';
export { settingsManager } from './settings';
export { seedManager } from './seed-manager';
export { stateGuard } from './state-guard';
export { configManager } from './game-config';

// ─── Input & Controls ──────────────────────────────────────
export { gamepadManager } from './gamepad';
export { TouchGesture } from './gestures';
export { InputBuffer } from './input-smoothing';
export { haptics } from './haptics';

// ─── UI & Experience ──────────────────────────────────────
export { Preloader } from './preloader';
export { AssetHydrator } from './asset-hydrator';
export { LazyHydrate } from './lazy-hydrate';
export { orientationMonitor } from './orientation';
export { visualA11y } from './visual-a11y';

// ─── Audio & Feedback ─────────────────────────────────────
export { audioEngine } from './audio';
export { rhythmFeedback } from './feedback-rhythm';

// ─── Game Logic ───────────────────────────────────────────
export { DynamicDifficulty } from './dda';
export { DailyChallenge } from './seed-challenge';
export { achievementSystem } from './achievements';
export { bossEngine } from './boss-engine';

// ─── Performance & Monitoring ─────────────────────────────
export { perfMonitor } from './perf-monitor';
export { errorTracker } from './error-tracker';
export { logger } from './logger';

// ─── Storage & Persistence ────────────────────────────────
export { idb } from './idb';
// pendingScoresDb and storage are function exports, not objects - import directly if needed

// ─── Utilities ────────────────────────────────────────────
// devLog, cleanupPattern, dustAnimation are function exports - import directly if needed
export { scoreSync } from './score-sync';
export { scoreCardGen } from './score-card';
export { privacyManager } from './privacy';
export { challengeLink } from './challenge-link';
export { featureGates } from './featureGates';

// ─── Internationalization ──────────────────────────────────
export { i18n, type Locale } from './i18n';
export type { I18nKey } from './i18n-keys';