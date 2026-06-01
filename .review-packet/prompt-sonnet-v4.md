# DTP Code Review -- v7.6.1 (Post-Landing Merge + ElasticWarp + Audit)

**Project**: Don't Touch Purple -- reflex-based grid-tapping game
**Stack**: React 18, TypeScript 5, Vite 7, Firebase (Firestore + Auth + Analytics + App Check), OGL/WebGL backgrounds, Cloudflare Workers, GSAP
**Date**: 2026-06-01
**Previous review**: v7.5.4 (Big Pickle v2 Round 2, 2026-05-27)
**Repo**: https://github.com/defaltadmin/donttouchpurple

## Build Status

| Gate | Status |
|------|--------|
| Typecheck | MERGE CONFLICT in `utils/score-sync.ts` (lines 96-101) -- upstream/stashed conflict marker left in. Blocks build. |
| Tests | 205/205 pass (19 files). 2 test files fail to import due to the merge conflict above. |
| Lint | 0 errors, 0 warnings (last clean run) |
| Build | Blocked by typecheck conflict |

**NOTE**: The merge conflict in `utils/score-sync.ts` is a pre-existing issue that needs fixing before this review can have a clean build. The conflict is at lines 96-101 in the `flush()` method -- a simple safe-attempts guard. Reviewer should note this but focus on the code logic.

## What Changed Since v7.5.4

Since the last review (commit 880fb91), the following major changes were made across ~30 commits:

### 1. Landing/Game Merge (feat: merge landing + game into single page)
- Removed LoadingScreen entirely -- game starts instantly on menu
- Removed `uiReady` / `appReady` gate logic
- Side panels removed from landing; game info moved into HowToPlay.tsx
- Landing hero sections (GameDemo, boss overlay, score display) removed
- Bot gameplay demo added to landing

### 2. ElasticWarp Background (default background)
- Complete rewrite: was OGL/WebGL shader, now pure Canvas 2D gravitational particle vortex
- 120 particles with gravitational pull toward cursor, glow effects, connection lines
- Multiple shader rewrites (GLSL 100, domain warping, starfield) before settling on Canvas 2D
- Debug: canvas sizing issues (inline style vs CSS class), UV attribute fixes, resolution uniform fixes

### 3. UI/UX Cleanup
- Overlays: escape key handler, focus trap, body scroll lock, aria-modal on all modals
- Dead code cleanup: LoadingScreen, ParticleLayer, `enableDevMode` hook, duplicate `settingsManager` subscription
- Background layer separation: Galaxy full viewport, no more `.root` clipping
- Em-dashes replaced with hyphens in user-facing text

### 4. Security & Stability
- STAB-001: gameover timer cleanup in useGameEngine (timers cleared on unmount)
- SEC-006: dust_wallet monotonic +10000/-5000 bounds in firestore.rules
- QOL-001: bomb countdown SVG ring (BombTimer component)
- QOL-002: BossCountdown in BossOverlay
- Resume game feature fully removed (no session persistence)

### 5. Build/Deploy
- CF Pages build fixed to serve game, not landing page
- website/package.json build script handles auto-builds

## Architecture Overview

```
App.tsx (1777 lines -- main orchestrator, state machine)
  ├── engine/
  │   ├── GameEngine.ts (1017 lines -- game loop, tap handling, scoring, achievements)
  │   └── subsystems/
  │       ├── TickProcessor.ts (421 lines -- tick logic, boss events, bombs, shuffles)
  │       ├── CellLifecycle.ts (142 lines -- cell spawning, pattern selection)
  │       ├── BotController.ts (bot AI)
  │       ├── ScoreTracker.ts (scoring math)
  │       └── EventOrchestrator.ts (boss event types)
  ├── components/
  │   ├── Cell/index.tsx (327 lines -- cell rendering, spark effects, bomb timer)
  │   ├── HUD/GameArea.tsx (180 lines -- game area layout)
  │   ├── HUD/PlayerPanel.tsx (377 lines -- grid rendering, GSAP stagger, hold cells)
  │   ├── HUD/EnergyBar.tsx (73 lines -- energy pips + refill)
  │   ├── Screens/StartScreen.tsx (374 lines -- menu, magnetic button, pill rows)
  │   ├── Screens/GameOver.tsx (243 lines -- score animation, share modal)
  │   ├── Screens/HowToPlay.tsx (119 lines -- info hub, boss events, features, GitHub)
  │   ├── Screens/WhatsNew.tsx (75 lines -- version changelog popup)
  │   ├── Screens/EnergyPopup.tsx (53 lines -- energy refill dialog)
  │   ├── Settings/SettingsDrawer.tsx (220 lines -- all settings)
  │   ├── Settings/BuildDeploySection.tsx (150 lines -- difficulty tuning sliders)
  │   └── Backgrounds/ElasticWarp.tsx (234 lines -- Canvas 2D particle vortex)
  ├── hooks/
  │   ├── useGameEngine.ts (396 lines -- engine bridge, event handling)
  │   ├── useThemeSettings.ts (107 lines -- theme, FPS, colorblind, fullscreen)
  │   └── useDevToolsState.ts (20 lines -- dev mode state)
  ├── services/
  │   ├── firebase.ts (266 lines -- lazy Firebase, auth, leaderboard, dust, streaks)
  │   └── firestoreService.ts (not present -- logic consolidated into firebase.ts)
  ├── config/
  │   └── difficulty.ts (55 lines -- DIFFICULTY, GAME, LS_KEYS constants)
  ├── utils/
  │   ├── state-guard.ts (142 lines -- HMAC session signing, parse, sanitize, safeStore)
  │   ├── challenge-link.ts (103 lines -- challenge URL generate/verify)
  │   └── score-sync.ts (128 lines -- offline queue, exponential backoff -- HAS MERGE CONFLICT)
  ├── workers/
  │   └── score-validator.ts (335 lines -- Cloudflare Worker: score submit, challenge sign/verify, rate limiting)
  ├── firestore.rules (94 lines -- leaderboard + dust_wallet security rules)
  ├── vite.config.ts (118 lines -- build config, chunking, Sentry)
  ├── tsconfig.json (41 lines)
  └── eslint.config.js (48 lines)
```

## Key Stats

| Metric | Value |
|--------|-------|
| App.tsx lines | 1,777 |
| GameEngine.ts lines | 1,017 |
| TickProcessor.ts lines | 421 |
| Total source files reviewed | 30 |
| Cell types | 14 (white, blue, red, orange, yellow, green, cyan, lime, teal, pink, rose, magenta, purple + special: medpack, shield, freeze, multiplier, ice, hold, bomb) |
| Game modes | 2 (classic, evolve) |
| Boss event types | 3 (storm, inversion, blackout) |
| WebGL backgrounds | 20 |
| Achievements | 37 |
| Test files | 21 |
| Passing tests | 205 |

## Review Instructions

Focus your review on:

1. **Security** -- Are Firebase rules tight enough? Is the Cloudflare Worker secure against all attack vectors? Challenge link signing/verification. Session state integrity. XSS/injection vectors in user-facing strings.

2. **Correctness** -- Game logic bugs. Cell lifecycle issues. Tick processing edge cases. Score calculation correctness. Achievement unlock conditions. Boss event timing. Bomb lifecycle. Hold cell timing.

3. **Performance** -- App.tsx is 1,777 lines. Are there unnecessary re-renders? Is the snapshot emission efficient? Is the Canvas 2D ElasticWarp performant? GSAP usage in PlayerPanel. Cell memo effectiveness.

4. **Edge Cases** -- Tab switching (visibility API). Rapid tap sequences. 2-player edge cases. Evolve mode stage transitions. Rare color mode transitions. Game over during boss event. Pause during freeze/shield.

5. **Architecture** -- App.tsx monolith. GameEngine/TickProcessor separation. Hook dependency correctness. Callback stability. Ref vs state usage. Resource cleanup patterns.

6. **Code Quality** -- Dead code. Unused imports. TypeScript strictness. Naming consistency. Error handling completeness. Accessibility (ARIA, focus management, screen readers).

## Files for Review

All source files are included below in full. Review each file independently and cross-reference where noted.

---

## FILE: App.tsx
```tsx
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import "./styles/game.css";
import "./styles/enhancements.css";
import "./styles/dtp-components.css";
import { logger } from "./utils/logger";
import { Icon } from "./components/UI/Icon";
import { LottiePlayer } from "./components/UI/LottiePlayer";
import type { IconName } from "./components/UI/Icon";
import { settingsManager } from "./utils/settings";
import { ChunkErrorBoundary } from "./components/ChunkErrorBoundary";
import { audioEngine } from "./utils/audio";
import { i18n, type Locale } from "./utils/i18n";
import { AssetHydrator } from "./utils/asset-hydrator";

type AssetTier = 'critical' | 'deferred' | 'background';
import { Preloader } from "./utils/preloader";
import { gamepadManager } from "./utils/gamepad";
import { configManager } from "./utils/game-config";
import { errorTracker } from "./utils/error-tracker";
import { privacyManager } from "./utils/privacy";
import { webVitalsMonitor } from "./services/web-vitals";
import { challengeLink } from "./utils/challenge-link";
import { orientationMonitor } from "./utils/orientation";
import { TouchGesture } from "./utils/gestures";
import { visualA11y } from "./utils/visual-a11y";
import { useOffsetCursor } from "./hooks/useOffsetCursor";
import { useEnergyStore } from "./hooks/useEnergyStore";
import { useFocusTrap } from "./hooks/useFocusTrap";

declare const __APP_VERSION__: string;
import { safeSentry } from "./services/sentry";
import { computeMs, speedLabel, speedPct } from "./engine/DifficultyScaler";
import { GAME, LS_KEYS } from "./config/difficulty";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, loadKeys } from "./config/keybindings";
import { SHOP_TRAILS } from "./config/powerupWeights";
import { setAudioMuted, setAudioVolume, setHapticsEnabled, useGameEngine, loadStoredPwr, saveStoredPwr } from "./hooks/useGameEngine";
import { useGameSettings } from "./hooks/useGameSettings";
import { useDustEconomy } from "./hooks/useDustEconomy";
import { useUIFlags } from "./hooks/useUIFlags";
import { useInputHandler } from "./hooks/useInputHandler";
import { useThemeSettings } from "./hooks/useThemeSettings";
import { useDevToolsState } from "./hooks/useDevToolsState";
import type { GameConfig as EngineGameConfig, Winner, PlayerState, HoldCell } from "./engine/types";

// Components - HUD
import { EnergyBar } from "./components/HUD/EnergyBar";
import { DustWidget } from "./components/HUD/DustWidget";
import { Hearts } from "./components/HUD/Hearts";

// Components - Screens
import { StartScreen } from "./components/Screens/StartScreen";
import { HowToPlay } from "./components/Screens/HowToPlay";
import { getMessage } from "./components/Screens/GameOver";
import { PrivacyBanner } from "./components/Screens/PrivacyBanner";
import EvolveTutorial from "./components/Screens/EvolveTutorial";
import { WhatsNew, shouldShowWhatsNew, markWhatsNewSeen } from "./components/Screens/WhatsNew";
import { GameMaster } from "./components/Screens/GameMaster";
import { getStreakReward } from "./components/Screens/LoginStreakPopup";
import { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
import { RewardsHub, countUnclaimedRewards, type WeeklyTask } from "./components/Screens/RewardsHub";
import { getObjectiveStreak } from "./config/dailyObjective";

// Components - Backgrounds (lazy loaded)
const VoidTunnel = lazy(() => import("./components/Backgrounds/VoidTunnel"));
const StarWarp   = lazy(() => import("./components/Backgrounds/StarWarp"));
const GridPulse  = lazy(() => import("./components/Backgrounds/GridPulse"));
const PurpleRain = lazy(() => import("./components/Backgrounds/PurpleRain"));
const PurpleCascade = lazy(() => import("./components/Backgrounds/PurpleCascade"));
const BlockOrbit    = lazy(() => import("./components/Backgrounds/BlockOrbit"));
const DataStream    = lazy(() => import("./components/Backgrounds/DataStream"));
const CellBreath    = lazy(() => import("./components/Backgrounds/CellBreath"));
const WarpGate      = lazy(() => import("./components/Backgrounds/WarpGate"));
const PulseField    = lazy(() => import("./components/Backgrounds/PulseField"));
const GlitchGrid    = lazy(() => import("./components/Backgrounds/GlitchGrid"));
const AmbientFlow   = lazy(() => import("./components/Backgrounds/AmbientFlow"));
const Nebula        = lazy(() => import("./components/Backgrounds/Nebula"));
const DigitalRain   = lazy(() => import("./components/Backgrounds/DigitalRain"));
const AuroraBorealis = lazy(() => import("./components/Backgrounds/AuroraBorealis"));
const Galaxy         = lazy(() => import("./components/Backgrounds/Galaxy"));
const Hyperspeed     = lazy(() => import("./components/Backgrounds/Hyperspeed"));
const Silk           = lazy(() => import("./components/Backgrounds/Silk"));
const Lightning      = lazy(() => import("./components/Backgrounds/Lightning"));
const ElasticWarp    = lazy(() => import("./components/Backgrounds/ElasticWarp"));
import { MouseFollower } from "./components/Backgrounds/MouseFollower";
import { MouseTrail } from "./components/Backgrounds/MouseTrail";

// Daily Objective
import { getDailyObjectives, markObjectiveComplete, checkObjective, getObjectiveProgress, type DailyObjective, type BossObjectiveCounters } from "./config/dailyObjective";

// Services (lazy loaded - see getFirebase() below)
import { fbFetchTop20Global } from "./services/firebase";
// Lazy-loaded GameAnalytics (~91KB off initial bundle)
const gaPromise = import("./services/gameanalytics");
async function initGALazy(version: string) {
  try { (await gaPromise).initGA(version); } catch { /* GA unavailable */ }
}
async function logProgressionLazy(...args: Parameters<typeof import("./services/gameanalytics").logProgressionEvent>) {
  try { (await gaPromise).logProgressionEvent(...args); } catch { /* GA unavailable */ }
}
import { safeGetJSON, safeSet } from "./utils/storage";
import { scoreSync } from "./utils/score-sync";
import { useScreenStateMachine, type Screen } from "./hooks/useScreenStateMachine";
import { PauseOverlay } from "./components/Screens/PauseOverlay";
import { EnergyPopup } from "./components/Screens/EnergyPopup";
import { QuickSettings } from "./components/Settings/QuickSettings";
import { BossOverlay } from "./components/HUD/BossOverlay";
import { GameHeader } from "./components/HUD/GameHeader";
import { GameArea } from "./components/HUD/GameArea";

// Components - Settings & Shop
const SettingsDrawer = lazy(() => import("./components/Settings/SettingsDrawer").then(m => ({ default: m.SettingsDrawer })));
const ShopPanel = lazy(() => import("./components/Shop/ShopPanel").then(m => ({ default: m.ShopPanel })));
const LeaderboardPanel = lazy(() => import("./components/Leaderboard/LeaderboardPanel").then(m => ({ default: m.LeaderboardPanel })));
// DevOverlay: lazy-loaded to keep out of initial bundle
const DevOverlay = lazy(() => import("./components/Settings/DevOverlay").then(m => ({ default: m.DevOverlay })));
const DevUnlockModal = lazy(() => import("./components/Settings/DevOverlay").then(m => ({ default: m.DevUnlockModal })));

interface AchievementToast { id: string; icon: string; name: string; desc: string; }
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";
type GameMode        = "classic" | "evolve";
type InputMode       = "touch" | "keyboard";
type NumPlayers      = 1 | 2;
// ColorblindMode type — now from useThemeSettings

// ─── Lazy-loaded Firebase ────────────────────────────────────────
let _firebase: typeof import('./services/firebase') | null = null;
async function getFirebase() {
  if (!_firebase) _firebase = await import('./services/firebase');
  return _firebase;
}

import { NameChangeForm } from "./components/Settings/NameChangeForm";
import { ColorblindFilters, getCBFilterStyle } from "./components/ColorblindFilters";
import { ExitConfirmModal } from "./components/Screens/ExitConfirmModal";
import { RotatePrompt } from "./components/Screens/RotatePrompt";
import { loadShopData, saveShopData, type ShopData } from "./utils/shop-storage";

// --- Tutorial ---
import { buildDailyChallenges, buildWeeklyTasks } from './utils/rewards';

// --- App Component ---
export default function App() {
  const {
    showNameEntry, setShowNameEntry,
    showRotatePrompt, setShowRotatePrompt,
    showDevPanel, setShowDevPanel,
    showSettings, setShowSettings,
    settingsFromPause, setSettingsFromPause,
    showTutorial, setShowTutorial,
    showWhatsNew, setShowWhatsNew,
    showPrivacy, setShowPrivacy,
    setShowLoginStreak,
    showRewardsHub, setShowRewardsHub,
    showExitConfirm, setShowExitConfirm,
    showEnergyPopup, setShowEnergyPopup,
    showOnboarding, setShowOnboarding,
    showDevUnlock, setShowDevUnlock,
    showBuildDeploy, setShowBuildDeploy,
    evolveTutorialSeen, setEvolveTutorialSeen,
    EVOLVE_TUTORIAL_SEEN_KEY,
  } = useUIFlags();
  const [currentLocale, setCurrentLocale] = useState<Locale>(i18n.current);
  const [gamepadActive, setGamepadActive] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementToast[]>([]);

  // Map emoji icons from engine to SVG Icon names
  const ACHIEVEMENT_ICON_MAP: Record<string, IconName> = {
    '⭐': 'star',
    '🏆': 'trophy',
    '🔥': 'fire',
  };
  const [, setDailyComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setCombo] = useState({ count: 0, multiplier: 1 });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboPopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloaderRef = useRef(new Preloader());
  const [bossUi, setBossUi] = useState<{ active: boolean; shieldHits: number; maxShield: number; phase: number }>({ active: false, shieldHits: 0, maxShield: 5, phase: 1 });
  const [comboPop, setComboPop] = useState(false);

  const hydrator = useRef(new AssetHydrator());

  const [gamesPlayed, setGamesPlayed] = useState(() =>
    parseInt(localStorage.getItem('dtp-games-played') || '0', 10)
  );
  const [best1, setBest1]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  const [best2, setBest2]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0"));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('dtp:wins') || '0', 10));
  const [deaths, setDeaths] = useState(() => parseInt(localStorage.getItem('dtp:deaths') || '0', 10));

  // Refs for synchronous reads in handleEngineGameOver (avoids stale closures)
  const winsRef = useRef(wins);
  const deathsRef = useRef(deaths);
  const gamesPlayedRef = useRef(gamesPlayed);
  const best1Ref = useRef(best1);
  const best2Ref = useRef(best2);

  const machine = useScreenStateMachine({
    bestScore: Math.max(best1, best2),
    gamesPlayed,
    wins,
    deaths
  });
  const screen = machine.current;
  const setScreen = useCallback((s: Screen) => machine.transition(s), [machine]);
  const { devMode, setDevMode, godMode, setGodMode, devFreezeTime, setDevFreezeTime, devRotationSpeed, setDevRotationSpeed, devAutoPlay, setDevAutoPlay, devHeatmap, setDevHeatmap } = useDevToolsState();

  useEffect(() => {
    // 1. Init i18n (background)
    i18n.init().catch(() => {});

    // 2. Start Web Vitals monitoring
    webVitalsMonitor.startMonitoring();

    // 3. Hydrate assets in background
    hydrator.current.hydrateAll();
  }, []);

  const [playerName, setPlayerName] = useState(() => {
    const raw = localStorage.getItem(LS_KEYS.PLAYER_NAME) || "Player";
    return raw.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player";
  });
  const { dust, dustRef, setDust, addDust, spendDust, persistDust, getBotAccuracy } = useDustEconomy(playerName);
  const scoreSubmittedRef = useRef(false);

  const { energyData, refillEnergy, spendEnergy } = useEnergyStore();

  const [shopData, setShopDataState] = useState(() => loadShopData());
  const { theme, setTheme, colorblindMode, setColorblindMode, isFS, toggleFS, settingsOpen, setSettingsOpen, showOffset, setShowOffset, showFps, setShowFps, fps, equippedTheme } = useThemeSettings(shopData);

  useEffect(() => {
    initGALazy(typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "5.9.0");
  }, []);

  useEffect(() => {
    const gamesEver = parseInt(localStorage.getItem('dtp-games-played') ?? '0', 10);
    if (gamesEver > 0 && shouldShowWhatsNew()) setShowWhatsNew(true);
  }, [setShowWhatsNew]);

  // Spotlight effect - update CSS vars for card hover glow (throttled via RAF)
  useEffect(() => {
    let rafId: number | null = null;
    let lastX = 0, lastY = 0;
    const handleMove = (e: MouseEvent) => {
      lastX = (e.clientX / window.innerWidth) * 100;
      lastY = (e.clientY / window.innerHeight) * 100;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mx', `${lastX}%`);
          document.documentElement.style.setProperty('--my', `${lastY}%`);
          rafId = null;
        });
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  
  const [gameMode, setGameMode]      = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers]  = useState<NumPlayers>(1);
  const [inputMode, setInputMode]    = useState<InputMode>("touch");
  const [practiceMode, setPracticeMode] = useState(false);
  const { muted, toggleMuted, volume, setVolume, haptics, setHaptics, screenShake, setScreenShakePersisted, reducedMotion, setReducedMotion } = useGameSettings();
  const isTouchDevice = !(window.matchMedia?.("(pointer: fine)")?.matches);
  const [toast, setToast]            = useState<string|null>(null);
  const [shareMsg, setShareMsg]      = useState("");
  const [gameSeedState, setGameSeedState] = useState(0);
  const [lbMode, setLbMode]          = useState<GameMode>("classic");

  // Aggressive preload on menu (Shop + default background)
  useEffect(() => {
    if (screen === "menu") {
      import("./components/Shop/ShopPanel");
      import("./components/Backgrounds/PurpleRain");
    }
  }, [screen]);

  const [pendingReplaySeed, setPendingReplaySeed] = useState<string | null>(
    () => localStorage.getItem("pendingReplaySeed")
  );
  const [customSeedInput, setCustomSeedInput] = useState("");

  const clearReplaySeed = useCallback(() => {
    localStorage.removeItem("pendingReplaySeed");
    setPendingReplaySeed(null);
  }, []);
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>(() => getDailyObjectives());
  const [bossCounters, setBossCounters] = useState<BossObjectiveCounters>({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
  const bossCountersRef = useRef(bossCounters);
  useEffect(() => { bossCountersRef.current = bossCounters; }, [bossCounters]);
  const [, setInitials]              = useState("");
  const [, setIE]                    = useState(false);
  const [loginStreakCount, setLoginStreakCount]        = useState(1);
  const [loginStreakReward, setLoginStreakReward]      = useState(50);
  const [dailyChallenges, setDailyChallenges]         = useState<DailyChallenge[]>([]);
  const [weeklyTasks, setWeeklyTasks]                 = useState<WeeklyTask[]>([]);
  const [, setPrevBest]              = useState(0);

  const [paused, setPaused]         = useState(false);
  // devMode, godMode, devFreezeTime, devRotationSpeed, devAutoPlay, devHeatmap from useDevToolsState (line 205)
  // Give 99999 dust when dev mode is enabled (dev builds only)
  useEffect(() => { if (devMode) { setDust(99999); localStorage.setItem(LS_KEYS.DUST, "99999"); } }, [devMode, setDust]);
    const [shouldShowRewardsAfterGame, setShouldShowRewardsAfterGame] = useState(false);
    const [shouldShowRewardsOnLogin, setShouldShowRewardsOnLogin] = useState(false);
  // settingsOpen, showOffset, showFps, fps come from useThemeSettings (line 231)
  const cursorPos = useOffsetCursor(showOffset, containerRef);
  const peakStreakRef = useRef(0);
  const dustAtStartRef = useRef(dust);
  const pbFlashedRef = useRef(false);
  const visibilityPausedRef = useRef(false);
  const [gameOverProgress, setGameOverProgress] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const [hasSeenHowTo, setHasSeenHowTo] = useState(() => localStorage.getItem('dtp:howto-seen') === 'true');

  // Login streak check — show popup if not claimed today (moved after useState declarations)
  useEffect(() => {
    const LOGIN_CLAIMED_KEY = 'dtp-login-claimed';
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastClaimed = localStorage.getItem(LOGIN_CLAIMED_KEY);
    if (lastClaimed !== todayStr) {
      const streak = getObjectiveStreak();
      const reward = getStreakReward(streak);
      setLoginStreakCount(streak);
      setLoginStreakReward(reward);

      // Fetch latest streak from Firebase
      getFirebase().then(fb =>
        fb.fbGetStreak({ clientDate: todayStr })
      ).then(fbStreak => {
        const safeStreak = typeof fbStreak === 'number' && isFinite(fbStreak) ? fbStreak : streak;
        setLoginStreakCount(safeStreak);
        try {
          safeSet("dtp_login_streak", JSON.stringify({
            count: safeStreak,
            lastDate: new Date().toDateString()
          }));
        } catch {}
      }).catch(e => logger.warn('Firebase streak fetch failed', e));

      const gamesEver = parseInt(localStorage.getItem('dtp-games-played') ?? '0', 10);
      if (gamesEver > 0) {
        setShouldShowRewardsOnLogin(true);
      }
    }

    // Build daily challenges from seeded pool
    setDailyChallenges(buildDailyChallenges(todayStr));
  }, []);

  const saveShopDataState = useCallback((data: ShopData) => {
    saveShopData(data);
    setShopDataState(data);
  }, []);

  const switchPlayer = useCallback(() => {
    // Toggle between player names or show name entry
    setShowNameEntry(true);
  }, [setShowNameEntry]);

  const [p1Keys] = useState(() => loadKeys(LS_KEYS.P1_KEYS, DEFAULT_P1_KEYS));
  const [p2Keys] = useState(() => loadKeys(LS_KEYS.P2_KEYS, DEFAULT_P2_KEYS));

  const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const toast$ = useCallback((msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    setLiveMessage(msg);
    toastRef.current = setTimeout(() => setToast(null), GAME.TOAST_DURATION_MS);
  }, []);

  // Service Worker update toast
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast$("🚀 Update available! Reload to update.");
              }
            });
          }
        });
      });
    }
  }, [toast$]);

  // Dev Toggle — type d→d→p on menu screen (dev builds only)
  const devKeyBuffer = useRef<string[]>([]);
  useEffect(() => {
    if (devMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (screen !== "menu") return;
      devKeyBuffer.current = [...devKeyBuffer.current.slice(-2), e.key.toLowerCase()];
      if (devKeyBuffer.current.join("") === "ddp") {
        setDevMode(true);
        devKeyBuffer.current = [];
        toast$("🔧 Dev mode");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, devMode, toast$, setDevMode]);

  // Engine Setup
  const [speedMult, setSpeedMult] = useState(1);

  // IMPORTANT: dustCallbacks identity must stay stable — it's passed to GameEngine constructor.
  // If spendDust or getBotAccuracy change identity (e.g. useDustEconomy refactor), the engine
  // will be recreated mid-game. Keep deps minimal and verify stability after any dust/bot changes.
  const dustCallbacks = React.useMemo(() => ({
    getDust: () => dustRef.current,
    spendDust,
    getAccuracy: getBotAccuracy,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dustRef is a stable ref, not a reactive dep
  }), [spendDust, getBotAccuracy]);

  const engineConfig: EngineGameConfig = React.useMemo(() => ({
    mode: gameMode,
    numPlayers,
    speedMult,
    inputMode: inputMode === "keyboard" ? "keys" as const : "touch" as const,
    godMode: godMode || practiceMode,
  }), [gameMode, numPlayers, speedMult, inputMode, godMode, practiceMode]);

  // Update challenge progress from game over
  const updateChallengeProgress = useCallback((p1Score: number, finalTick: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const PROGRESS_KEY = `dtp-challenge-progress-${todayStr}`;
    let progress: Record<string,number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50) progress['score50'] = p1Score;
    if (finalTick >= 60) progress['survive60'] = finalTick;
    if (peakStreakRef.current >= 5) progress['streak5'] = peakStreakRef.current;

    safeSet(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(todayStr));

    // Weekly task progress (UTC for consistency across timezones)
    const now2 = new Date();
    const utcDay2 = now2.getUTCDay();
    const weekStart2 = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() - utcDay2));
    const weekKey2 = weekStart2.toISOString().slice(0, 10);
    const WEEKLY_PROGRESS_KEY2 = `dtp-weekly-progress-${weekKey2}`;
    let weeklyProgress: Record<string, number> = {};
    try { weeklyProgress = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY2) ?? '{}'); } catch {}
    weeklyProgress['play10'] = (weeklyProgress['play10'] ?? 0) + 1;
    if (p1Score >= 100) weeklyProgress['score100'] = (weeklyProgress['score100'] ?? 0) + 1;
    const modesKey = `dtp-weekly-modes-${weekKey2}`;
    let modesArr: string[] = [];
    try { modesArr = JSON.parse(localStorage.getItem(modesKey) ?? '[]'); } catch {}
    const modesPlayed = new Set<string>(modesArr);
    modesPlayed.add(gameMode);
    safeSet(modesKey, JSON.stringify([...modesPlayed]));
    weeklyProgress['bothmode'] = modesPlayed.size;
    safeSet(WEEKLY_PROGRESS_KEY2, JSON.stringify(weeklyProgress));
    setWeeklyTasks(buildWeeklyTasks());
  }, [gameMode]);

  const handleEngineGameOver = useCallback(async (engineWinner: Winner, p1Score: number, p2Score: number, gameSeed?: number) => {
    // TRANSITION FIRST — prevents soft lock if async work fails
    setScreen("gameover");
    setLiveMessage(`Game over. Score: ${p1Score}`);
    setPaused(false);
    setPrevBest(gameMode === "classic" ? best1Ref.current : best2Ref.current);

    safeSentry.addBreadcrumb({
      category: "game",
      message: "game_over",
      level: "info",
      data: { gameMode, numPlayers, p1Score, p2Score, winner: engineWinner, seed: gameSeed },
    });
    safeSentry.addBreadcrumb({
      category: "economy",
      message: "game_over",
      level: "info",
      data: { gameMode, numPlayers, p1Score, p2Score, winner: engineWinner, seed: gameSeed },
    });
    const rawEarned = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);
    const earned = isNaN(rawEarned) || !isFinite(rawEarned) ? 0 : rawEarned;
    if (earned > 0) addDust(earned, 'GameOver'); // QOL-003: skip dust log on 0-score games
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
    logProgressionLazy("Complete", gameMode, p1Score, snapshotRef.current?.tick ?? 0);
    const gameHighScore = gameMode === "classic" ? p1Score : Math.max(p1Score, p2Score);

    // Update progress tracking (use refs for synchronous reads)
    const newWins = winsRef.current + (engineWinner === "p1" ? 1 : 0);
    const newDeaths = deathsRef.current + (p1Score === 0 ? 1 : 0);
    // FIX-01: gamesPlayed already incremented in startGame — don't double-count here

    setWins(newWins); winsRef.current = newWins;
    setDeaths(newDeaths); deathsRef.current = newDeaths;
    safeSet('dtp:wins', newWins.toString());
    safeSet('dtp:deaths', newDeaths.toString());

    machine.updateProgress({
      bestScore: Math.max(best1Ref.current, best2Ref.current, gameHighScore),
      gamesPlayed: gamesPlayedRef.current,
      wins: newWins,
      deaths: newDeaths
    });

    if (gameMode === "classic") {
      setBest1((b: number) => { const nb = Math.max(b, gameHighScore); best1Ref.current = nb; safeSet(LS_KEYS.BEST_CLASSIC, nb.toString()); return nb; });
    } else {
      setBest2((b: number) => { const nb = Math.max(b, gameHighScore); best2Ref.current = nb; safeSet(LS_KEYS.BEST_EVOLVE, nb.toString()); return nb; });
    }
    setShareMsg(getMessage(earned));
    setGameSeedState(gameSeed ?? snapshotRef.current?.gameSeed ?? 0);
    setInitials(playerName || "Player");
    setIE(false);

    // Auto-submit score through scoreSync (with offline fallback)
    try {
      const submitVal = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);

      if (submitVal > 0 && !scoreSubmittedRef.current && !practiceMode && !godMode) {
        scoreSubmittedRef.current = true;

        try {
          await scoreSync.queue(submitVal, gameMode, snapshotRef.current?.tick || 0, practiceMode, godMode);
          toast$("🏆 Score submitted to global leaderboard!");
        } catch {
          logger.warn("Score sync failed");
          toast$("💾 Score saved offline - will sync soon");
        }
      }
    } catch (err: unknown) {
      logger.warn('[DTP] Score submission failed', err);
    }

    // Update daily challenge progress
    updateChallengeProgress(p1Score, snapshotRef.current?.tick ?? 0);

    const objs = getDailyObjectives();
    const spd = snapshotRef.current ? speedLabel(snapshotRef.current.tick, false) : "1.0×";
    const finalStreak = peakStreakRef.current;
    const progress = objs.length > 0 ? getObjectiveProgress(objs[0], snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current) : 0;
    setGameOverProgress(progress);

    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      if (!obj.completed) {
        if (checkObjective(obj, snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current)) {
          const completed = markObjectiveComplete(i);
          if (completed) {
            setDailyObjectives(prev => prev.map((o, idx) => idx === i ? completed : o));
            const safeReward = isNaN(completed.reward) ? 0 : completed.reward;
            addDust(safeReward, 'DailyObjective');
            toastTimeoutRef.current = setTimeout(() => {
              setToast(`🎯 Daily Complete! +${completed.reward} 💜`);
              if (toastRef.current) clearTimeout(toastRef.current);
              toastRef.current = setTimeout(() => setToast(null), 3500);
              safeSentry.addBreadcrumb({
                category: "economy",
                message: "daily_complete",
                level: "info",
                data: { reward: completed.reward, objective: obj.type },
              });
              getFirebase().then(fb => fb.fbLogEvent("daily_complete", { reward: completed.reward, objective: obj.type })).catch(e => logger.warn('Firebase operation failed', e));
            }, 800);
          }
        }
      }
    }
    if (localStorage.getItem('dtp-show-rewards-after-first-game') === '1') {
      localStorage.removeItem('dtp-show-rewards-after-first-game');
      setShouldShowRewardsAfterGame(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [numPlayers, playerName, toast$, gameMode, machine, addDust, setScreen, updateChallengeProgress, practiceMode, godMode]);

  useEffect(() => {
    if (shouldShowRewardsAfterGame && screen === "gameover") {
      const t = setTimeout(() => {
        setShowRewardsHub(true);
        setShouldShowRewardsAfterGame(false);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [shouldShowRewardsAfterGame, screen, setShowRewardsHub]);

  useEffect(() => {
    if (shouldShowRewardsOnLogin && screen === "menu") {
      const t = setTimeout(() => {
        setShowRewardsHub(true);
        setShouldShowRewardsOnLogin(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [shouldShowRewardsOnLogin, screen, setShowRewardsHub]);

  // Challenge URL detection
  useEffect(() => {
    challengeLink.parseAndVerify().then(({ isChallenge, valid, seed }) => {
      if (isChallenge && seed) {
        if (!valid) logger.warn('Challenge link signature invalid - score claim untrusted');
        logger.info('Challenge link loaded', { seed, valid });
      }
    });
  }, []);

  const handleDamage = useCallback(() => {
    document.body.classList.add('damage-pulse');
    setTimeout(() => document.body.classList.remove('damage-pulse'), 350);
  }, []);

  // Memoize callbacks passed to useGameEngine to prevent engine recreation on every render
   
  const onBossEvent = useCallback((bossType: string) => {
    const next = { ...bossCountersRef.current, bossSurvived: bossCountersRef.current.bossSurvived + 1 };
    if (bossType === "inversion") next.inversionSurvived += 1;
    bossCountersRef.current = next;
    setBossCounters(next);
    safeSentry.addBreadcrumb({ category: "game", message: "boss_survived", level: "info", data: { type: bossType } });
    if (snapshotRef.current && snapshotRef.current.p1?.score >= 100) {
      const bonus = bossType === "inversion" ? 20 : 15;
      addDust(bonus, `boss_${bossType}`);
      toast$(`🏆 Survived ${bossType.charAt(0).toUpperCase() + bossType.slice(1)}! +${bonus} 💜`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [toast$, addDust]);
   
  const onBombDefused = useCallback(() => {
    const next = { ...bossCountersRef.current, bombsDefused: bossCountersRef.current.bombsDefused + 1 };
    bossCountersRef.current = next;
    setBossCounters(next);
    safeSentry.addBreadcrumb({ category: "game", message: "bomb_defused", level: "info" });
  }, []);

  const {
    snapshot, snapshotRef: snapshotRef,
    heartAnimP1, heartAnimP2,
    shakeGrid1, shakeGrid2,
    toast: engineToast, 
    pwrToastP1, pwrToastP2,
    levelUpBadge, 
    rareSplash, 
    winner: engineWinner,
    start: startEngine,
    pause: pauseEngine,
    resume: resumeEngine,
    handleTap, handleHoldStart, handleHoldEnd,
    activateStoredFreeze, activateStoredShield,
    devForceStage, devForcePattern, devForceRare,
    devSetGodMode, devSetFreezeTime, devSetRotationSpeed, devSpawnPowerup,
    devSpawnSpecialCell, devTriggerBotTap, devToggleBotAssist,
    isBotActive,
    setBotAssist, botAssistActive, botTapHighlights, scoreFloats,
    getAutoLowQuality,
  } = useGameEngine(
    engineConfig,
    handleEngineGameOver,
    dustCallbacks,
    handleDamage,
    onBossEvent,
    onBombDefused,
  );

  const handleBotToggle = useCallback((player: 1 | 2) => {
    const currentDust = dustRef.current;
    if (!botAssistActive[player] && currentDust < 30) {
      toast$("🤖 Not enough dust for Bot Assist (30 💜 needed)");
      return;
    }
    setBotAssist(player, !botAssistActive[player]);
  }, [botAssistActive, toast$, setBotAssist, dustRef]);

  // Compute whether backgrounds should animate
  const shouldAnimateBackground = !reducedMotion && (screen === "playing" || screen === "gameover" || screen === "menu");

  // Background component mapping
  const backgroundMap = React.useMemo<Record<string, { component: React.ComponentType<Record<string, unknown>> }>>(() => ({
    'default': { component: ElasticWarp },
    'void-tunnel': { component: VoidTunnel },
    'star-warp': { component: StarWarp },
    'grid-pulse': { component: GridPulse },
    'purple-cascade': { component: PurpleCascade },
    'purple-rain': { component: PurpleRain },
    'block-orbit': { component: BlockOrbit },
    'data-stream': { component: DataStream },
    'cell-breath': { component: CellBreath },
    'warp-gate': { component: WarpGate },
    'pulse-field': { component: PulseField },
    'glitch-grid': { component: GlitchGrid },
    'ambient-flow': { component: AmbientFlow },
    'nebula': { component: Nebula },
    'digital-rain': { component: DigitalRain },
    'aurora-borealis': { component: AuroraBorealis },
    'galaxy': { component: Galaxy },
    'hyperspeed': { component: Hyperspeed },
    'silk': { component: Silk },
    'lightning': { component: Lightning },
  }), []);
  const equippedBackground = backgroundMap[shopData.equippedBackground] || backgroundMap['default'];

  // First-interaction audio init
  const handleFirstInteraction = useCallback(() => {
    audioEngine.init();
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [handleFirstInteraction]);

  useEffect(() => {
    if (!snapshot) return;
    peakStreakRef.current = Math.max(peakStreakRef.current, snapshot.p1.streak);
  }, [snapshot]);

  useEffect(() => {
    safeSentry.setTags({
      screen,
      gameMode,
      inputMode,
      numPlayers: String(numPlayers),
      practiceMode: String(practiceMode),
      colorblindMode,
      reducedMotion: String(reducedMotion),
    });
  }, [screen, gameMode, inputMode, numPlayers, practiceMode, colorblindMode, reducedMotion]);

  // Only update Sentry context on screen/gameMode changes, not every tick
  useEffect(() => {
    const s = snapshotRef.current;
    if (!s) return;
    safeSentry.setContext("game", {
      seed: s.gameSeed,
      tick: s.tick,
      phase: s.phase,
      score: s.p1.score,
      streak: s.p1.streak,
      health: s.p1.health,
      gridStage: s.p1.gridStage,
      patternIdx: s.p1.patternIdx,
      rareMode: s.rareMode.active ? s.rareMode.color : "purple",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [screen, gameMode]);

  const resumeGame = useCallback(() => {
    safeSentry.addBreadcrumb({ category: "game", message: "resume", level: "info" });
    resumeEngine();
    setPaused(false);
  }, [resumeEngine]);

  const pauseGame = useCallback(() => {
    safeSentry.addBreadcrumb({ category: "game", message: "pause", level: "info" });
    pauseEngine();
    setPaused(true);
  }, [pauseEngine]);

  // Reduced Motion CSS Vars
  useEffect(() => {
    const handleMotionPref = (e: MediaQueryListEvent) => {
      document.documentElement.style.setProperty('--motion-scale', e.matches ? '0' : '1');
      document.documentElement.style.setProperty('--particles-enabled', e.matches ? '0' : '1');
    };
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    document.documentElement.style.setProperty('--motion-scale', prefersReduced.matches ? '0' : '1');
    document.documentElement.style.setProperty('--particles-enabled', prefersReduced.matches ? '0' : '1');
    prefersReduced.addEventListener('change', handleMotionPref);
    return () => prefersReduced.removeEventListener('change', handleMotionPref);
  }, []);

  // Visibility/Unload safety with auto-pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (snapshotRef.current?.phase === "playing") {
          visibilityPausedRef.current = true;
          pauseEngine();
        }
      } else if (document.visibilityState === 'visible') {
        // FIX-03: Only auto-resume if visibility change caused the pause, not manual pause
        if (snapshotRef.current?.phase === "paused" && visibilityPausedRef.current) {
          visibilityPausedRef.current = false;
          resumeEngine();
          setPaused(false);
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [pauseEngine, resumeEngine]);

  // Focus trap for pause overlay
  const focusTrapRef = useFocusTrap<HTMLDivElement>(paused);
  // Focus trap for onboarding overlay
  const onboardingTrapRef = useFocusTrap<HTMLDivElement>(showOnboarding && screen === 'playing');

  // Live region timer
  useEffect(() => {
    if (!liveMessage) return;
    const id = setTimeout(() => setLiveMessage(''), 2000);
    return () => clearTimeout(id);
  }, [liveMessage]);

  // Feed engine toasts to live region for screen readers
  useEffect(() => {
    if (engineToast) setLiveMessage(engineToast);
  }, [engineToast]);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    if (settingsFromPause && paused) {
      // keep paused — user was in pause menu
    }
    setSettingsFromPause(false);
  }, [settingsFromPause, paused, setShowSettings, setSettingsFromPause]);

  // Dev Events
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevPanel(prev => {
          const next = !prev;
          localStorage.setItem('dtp:dev', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowDevPanel]);

  useEffect(() => {
    const s = (e: CustomEvent<number>) => devForceStage(e.detail);
    const p = (e: CustomEvent<number>) => devForcePattern(e.detail);
    const r = (e: CustomEvent<{ color: string; cssColor: string } | null>) => devForceRare(e.detail);
    window.addEventListener("dtp-dev-stage",   s as EventListener);
    window.addEventListener("dtp-dev-pattern", p as EventListener);
    window.addEventListener("dtp-dev-rare",    r as EventListener);
    return () => {
      window.removeEventListener("dtp-dev-stage",   s as EventListener);
      window.removeEventListener("dtp-dev-pattern", p as EventListener);
      window.removeEventListener("dtp-dev-rare",    r as EventListener);
    };
  }, [devForceStage, devForcePattern, devForceRare]);

  useEffect(() => { devSetGodMode(godMode || practiceMode); }, [godMode, practiceMode, devSetGodMode]);
  useEffect(() => { devSetFreezeTime(devFreezeTime); }, [devFreezeTime, devSetFreezeTime]);
  useEffect(() => { devSetRotationSpeed(devRotationSpeed); }, [devRotationSpeed, devSetRotationSpeed]);

  const BOT_HUMAN_MIN_MS = 180; // ~max human reaction speed
  const BOT_REACTION_JITTER = 60; // ±30ms randomness

  // STB-003: Use ref for snapshot in devAutoPlay — single persistent self-scheduling loop
  const handleTapRefBot = useRef(handleTap);
  handleTapRefBot.current = handleTap;
  const handleHoldStartRefBot = useRef(handleHoldStart);
  handleHoldStartRefBot.current = handleHoldStart;
  const handleHoldEndRefBot = useRef(handleHoldEnd);
  handleHoldEndRefBot.current = handleHoldEnd;

  useEffect(() => {
    if (!devAutoPlay) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let holdTimers: ReturnType<typeof setTimeout>[] = [];

    const tick = () => {
      const snap = snapshotRef.current;
      if (!snap || snap.phase !== "playing") {
        timer = setTimeout(tick, 100); // poll until playing
        return;
      }
      const dangerColor = snap.rareMode.active ? snap.rareMode.color : "purple";
      const tickMs = computeMs(snap.tick, 1);
      const botMs = Math.max(BOT_HUMAN_MIN_MS, tickMs * 0.85)
        + (Math.random() - 0.5) * BOT_REACTION_JITTER;

      holdTimers.forEach(clearTimeout);
      holdTimers = [];

      const tapPlayer = (active: typeof snap.p1.active, player: 1 | 2) => {
        active
          .filter(cell => !cell.clicked && (snap.isInverted ? cell.type === 'purple' : cell.type !== dangerColor))
          .forEach(cell => handleTapRefBot.current(player, cell.idx));
        active
          .filter((cell): cell is HoldCell => !cell.clicked && cell.type === "hold")
          .forEach(cell => {
            handleHoldStartRefBot.current(player, cell.idx);
            holdTimers.push(setTimeout(() => handleHoldEndRefBot.current(player, cell.idx), (cell.holdRequired ?? 800) + 50));
          });
      };
      tapPlayer(snap.p1.active, 1);
      if (numPlayers === 2 && snap.p2) tapPlayer(snap.p2.active, 2);
      timer = setTimeout(tick, botMs);
    };

    timer = setTimeout(tick, 50);
    return () => { if (timer) clearTimeout(timer); holdTimers.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [devAutoPlay, numPlayers, computeMs]);

  const { pressP1, pressP2 } = useInputHandler({
    mode: gameMode,
    numPlayers,
    enabled: screen === "playing" && inputMode === "keyboard" && snapshot?.phase === "playing",
    p1Keys,
    p2Keys,
    p1State: snapshot?.p1 ?? null,
    p2State: numPlayers === 2 ? snapshot?.p2 ?? null : null,
    onTap: handleTap,
    onHoldStart: handleHoldStart,
    onHoldEnd: handleHoldEnd,
    onPause: () => { pauseEngine(); setPaused(true); },
  });


  useEffect(() => { setAudioMuted(muted); }, [muted]);
  useEffect(() => { setAudioVolume(volume); }, [volume]);
  useEffect(() => { setHapticsEnabled(haptics); }, [haptics]);

  // Keyboard shortcuts → pause/resume (registered once, uses ref)
  const keyboardHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyboardHandlerRef.current = (e: KeyboardEvent) => {
    if ((e.key === "Escape" || e.key === "p" || e.key === "P") && document.activeElement?.tagName !== "INPUT") {
      if (screen === "playing" && snapshot?.phase === "playing") { pauseGame(); return; }
      if (screen === "playing" && paused) { resumeGame(); return; }
    }
    if (e.key === "b" || e.key === "B") {
      if (screen === "playing" && snapshot?.phase === "playing") {
        handleBotToggle(1);
      }
      return;
    }
  };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyboardHandlerRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // FPS Monitor + F key handled by useThemeSettings

  // Personal best delta flash — best1/best2 are state (not refs), so this effect
  // re-runs on score updates. pbFlashedRef prevents repeated toasts within a single game.
  useEffect(() => {
    if (!snapshot || snapshot.phase !== "playing") return;
    const currentBest = gameMode === "classic" ? best1 : best2;
    if (snapshot.p1.score > currentBest && snapshot.p1.score > 0 && !pbFlashedRef.current) {
      pbFlashedRef.current = true;
      setToast("🎉 New Best!");
    }
  }, [snapshot, gameMode, best1, best2]);

  // Theme + shop CSS vars + FPS handled by useThemeSettings (line 231)

  useEffect(() => {
    preloaderRef.current.loadAll().catch(() => {});
  }, []);

  // Transition from loading to menu immediately
  useEffect(() => {
    if (screen === 'loading') {
      setScreen('menu');
    }
  }, [screen, setScreen]);

  useEffect(() => {
    configManager.load();
  }, []);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      errorTracker.capture(e.error || new Error(e.message), { source: e.filename, line: e.lineno });
    };
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      errorTracker.capture(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), { source: 'unhandledrejection' });
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setCurrentLocale((e as CustomEvent<Locale>).detail);
    window.addEventListener('dtp:locale-change', handler);
    return () => window.removeEventListener('dtp:locale-change', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setCombo((e as CustomEvent).detail);
    window.addEventListener('dtp:combo', handler);
    return () => window.removeEventListener('dtp:combo', handler);
  }, []);

  useEffect(() => {
    const onBossUpdate = (e: Event) => setBossUi((e as CustomEvent).detail);
    const onBossActivate = (e: Event) => setBossUi((e as CustomEvent).detail);
    const onBossBreak = () => setComboPop(true);
    const onComboKill = () => { setComboPop(true); if (comboPopTimerRef.current) clearTimeout(comboPopTimerRef.current); comboPopTimerRef.current = setTimeout(() => setComboPop(false), 1500); };
    const onBossComplete = () => setBossUi({ active: false, shieldHits: 0, maxShield: 5, phase: 1 });

    window.addEventListener('dtp:boss:update', onBossUpdate);
    window.addEventListener('dtp:boss:activate', onBossActivate);
    window.addEventListener('dtp:boss:shield-break', onBossBreak);
    window.addEventListener('dtp:combo:kill', onComboKill);
    window.addEventListener('dtp:boss:complete', onBossComplete);
    return () => {
      window.removeEventListener('dtp:boss:update', onBossUpdate);
      window.removeEventListener('dtp:boss:activate', onBossActivate);
      window.removeEventListener('dtp:boss:shield-break', onBossBreak);
      window.removeEventListener('dtp:combo:kill', onComboKill);
      window.removeEventListener('dtp:boss:complete', onBossComplete);
      if (comboPopTimerRef.current) { clearTimeout(comboPopTimerRef.current); comboPopTimerRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const unsub = gamepadManager.on((btn, state) => {
      if (state === 'press') setGamepadActive(true);
    });
    if (gamepadManager.connected) setGamepadActive(true);
    return unsub;
  }, []);

  useEffect(() => {
    const processQueue = () => {
      const queue: { id: string; name: string; icon: string; desc: string; ts: number }[] = safeGetJSON('dtp:achievement-toasts', []);
      if (queue.length > 0) {
        setAchievementQueue(prev => [...prev, queue[0]]);
        safeSet('dtp:achievement-toasts', JSON.stringify(queue.slice(1)));
        toastTimeoutRef.current = setTimeout(processQueue, 6000);
      }
    };
    processQueue();
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const checkDaily = () => {
      const saved = localStorage.getItem('dtp:daily');
      if (saved) {
        try {
          const { completed } = JSON.parse(saved);
          setDailyComplete(!!completed);
        } catch { setDailyComplete(false); }
      }
    };
    checkDaily();
    const onDaily = () => setDailyComplete(true);
    window.addEventListener('dtp:daily-complete', onDaily);
    return () => window.removeEventListener('dtp:daily-complete', onDaily);
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem('dtp:telemetry-consent');
    if (consent === null) privacyManager.setConsent(false);
  }, []);

  useEffect(() => {
    orientationMonitor.init();
    const unsub = orientationMonitor.onChange(isLand => {
      setShowRotatePrompt(isLand);
    });
    return unsub;
  }, [setShowRotatePrompt]);

  useEffect(() => {
    if (!containerRef.current) return;
    const gesture = new TouchGesture(containerRef.current);
    const unsub = gesture.on('double-tap', () => {
      if (paused) resumeGame();
      else pauseGame();
    });
    return () => { unsub(); gesture.destroy(); };
  }, [paused, resumeGame, pauseGame]);

  const startGame = useCallback((skipTutorialCheck = false) => {
    if (!practiceMode && energyData.count <= 0) {
      toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    if (!skipTutorialCheck && !evolveTutorialSeen) {
      setShowTutorial(true);
      return;
    }
    if (!practiceMode) spendEnergy();
    setScreen("playing");
    setPaused(false);
    scoreSubmittedRef.current = false;
    peakStreakRef.current = 0;
    dustAtStartRef.current = dustRef.current;
    pbFlashedRef.current = false;
    setBossCounters({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
    const next = gamesPlayed + 1;
    safeSet('dtp-games-played', String(next));
    setGamesPlayed(next);
    if (next === 1) {
      safeSet('dtp-show-rewards-after-first-game', '1');
    }
    const forceSeed = pendingReplaySeed ? parseInt(pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({
      category: "game",
      message: "game_start",
      level: "info",
      data: { gameMode, numPlayers, inputMode, practiceMode, forceSeed },
    });
    getFirebase().then(fb => fb.fbLogEvent("game_start", {
      mode: gameMode,
      players: numPlayers,
      input: inputMode,
      practice: practiceMode,
      replay_seed: forceSeed ?? 0,
    })).catch(e => logger.warn('Firebase operation failed', e));
    logProgressionLazy("Start", gameMode, 0, 0);
    startEngine(forceSeed);
    if (forceSeed !== undefined) {
      clearReplaySeed();
    }
  }, [startEngine, energyData, practiceMode, gameMode, toast$, pendingReplaySeed, clearReplaySeed, gamesPlayed, numPlayers, inputMode, evolveTutorialSeen, spendEnergy, setScreen, dustRef, setShowTutorial]);

  // Tutorial close handler — mark seen, then delegate to startGame
  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem(EVOLVE_TUTORIAL_SEEN_KEY, '1');
    setEvolveTutorialSeen(true);
    safeSentry.addBreadcrumb({ category: "tutorial", message: "tutorial_completed", level: "info" });
    startGame(true);
  }, [startGame, setShowTutorial, setEvolveTutorialSeen, EVOLVE_TUTORIAL_SEEN_KEY]);

  const goMenu = useCallback(() => {
    pauseEngine();
    setPaused(false);
    setScreen("menu");
    setInitials(playerName || "Player");
    setIE(false);
    setShareMsg("");
    // Clear snapshot so rare badge and other game-specific UI don't persist on menu
    snapshotRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref, not a reactive dep
  }, [pauseEngine, playerName, setScreen]);

  // --- Daily Rewards handlers (Phase C) ---
  const handleLoginStreakClaim = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    safeSet('dtp-login-claimed', todayStr);
    setLoginClaimedToday(true);
    const safeReward = (isNaN(loginStreakReward) || !isFinite(loginStreakReward)) ? 50 : loginStreakReward;
    addDust(safeReward, 'LoginStreak');
    setShowLoginStreak(false);
  };

  const handleChallengeClaim = (challengeId: string, reward: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const CHALLENGES_KEY = `dtp-challenges-${todayStr}`;
    const claimed: string[] = safeGetJSON(CHALLENGES_KEY, []);
    if (claimed.includes(challengeId)) return; // prevent double-claim
    claimed.push(challengeId);
    safeSet(CHALLENGES_KEY, JSON.stringify(claimed));
    addDust(isNaN(reward) ? 0 : reward, 'DailyChallenge');
    setDailyChallenges(buildDailyChallenges(todayStr));
  };

  // L7: Auto-check top-10 leaderboard achievement
  const checkTop10Achievement = useCallback((entries: { score: number; initials: string }[]) => {
    const inTop10 = entries
      .slice(0, 10)
      .some(e => e.initials === playerName && e.score >= (lbMode === "classic" ? best1 : best2));
    if (!inTop10) return;
    const now2 = new Date();
    const weekStart2 = new Date(now2);
    weekStart2.setDate(now2.getDate() - now2.getDay());
    const weekKey2 = weekStart2.toISOString().slice(0, 10);
    const WPK = `dtp-weekly-progress-${weekKey2}`;
    const wp: Record<string, number> = safeGetJSON(WPK, {});
    if ((wp['top10'] ?? 0) < 1) {
      wp['top10'] = 1;
      safeSet(WPK, JSON.stringify(wp));
      setWeeklyTasks(buildWeeklyTasks());
    }
  }, [playerName, lbMode, best1, best2]);

  const handleClaimWeekly = (taskId: string, reward: number) => {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay));
    const weekKey = weekStart.toISOString().slice(0, 10);
    const WEEKLY_CLAIMED_KEY = `dtp-weekly-claimed-${weekKey}`;
    const claimed: string[] = safeGetJSON(WEEKLY_CLAIMED_KEY, []);
    if (claimed.includes(taskId)) return; // prevent double-claim
    claimed.push(taskId);
    safeSet(WEEKLY_CLAIMED_KEY, JSON.stringify(claimed));
    addDust(isNaN(reward) ? 0 : reward, 'WeeklyTask');
    setWeeklyTasks(buildWeeklyTasks());
  };

  // toggleFS from useThemeSettings

  const isPlaying = screen === "playing" || screen === "gameover";
  const is2P = numPlayers === 2;
  const cbFilter = getCBFilterStyle(colorblindMode);
  const cbActive = colorblindMode !== "none";
  const [loginClaimedToday, setLoginClaimedToday] = useState(() => {
    try { return localStorage.getItem('dtp-login-claimed') === new Date().toISOString().slice(0, 10); }
    catch { return false; }
  });
  const rewardsBadgeCount = countUnclaimedRewards(loginClaimedToday, dailyChallenges, weeklyTasks);

  // equippedTheme from useThemeSettings (line 231)
  const themeVars = {
    "--theme-purple":  equippedTheme.colors.purple,
    "--theme-accent":  equippedTheme.colors.accent,
    "--theme-bg":      equippedTheme.colors.bg,
    "--theme-text":    equippedTheme.colors.text,
    "--bg":            equippedTheme.id !== "default" ? equippedTheme.colors.bg : undefined,
    "--purple":        equippedTheme.id !== "default" ? equippedTheme.colors.purple : undefined,
    "--accent":        equippedTheme.id !== "default" ? equippedTheme.colors.accent : undefined,
    "--text":          equippedTheme.id !== "default" ? equippedTheme.colors.text : undefined,
  } as React.CSSProperties;

  const cellSizeVar = is2P
    ? "clamp(58px, 14vw, 78px)"
    : "clamp(52px, min(16vw,16vh), 80px)";



  // Screen effect classes based on active powerups
  const now = Date.now();
  const freezeActive = (snapshot?.p1.freezeEnd ?? 0) > now;
  const multActive = (snapshot?.p1.multiplierEnd ?? 0) > now;
  const shieldActive = (snapshot?.p1.shieldCount ?? 0) > 0;

  return (
    <>
    <div ref={containerRef} className={`root root--${screen}${is2P ? " root--2p" : ""}${gameMode === "classic" ? " root--classic" : ""}${theme === "light" ? " light-theme" : ""}${reducedMotion ? " root--reduced-motion" : ""}${freezeActive ? " fx-freeze-active" : ""}${multActive ? " fx-mult-active" : ""}${shieldActive ? " fx-shield-active" : ""}`}
      style={{ "--cell-1p": cellSizeVar, ...themeVars } as React.CSSProperties}>

      {/* Rare mode flash overlay */}
      <div className="bg-pulse" style={snapshot?.rareMode.active && screen === "playing" ? { background: `radial-gradient(ellipse at 50% 30%, ${snapshot.rareMode.cssColor}44 0%, transparent 65%)`, opacity: 1 } : {}} />

      {showFps && devMode && (
        <div className="dtp-fps-monitor" aria-live="off" aria-label="Performance Monitor">
          <span className={`dtp-fps-value ${fps < 30 ? 'dtp-fps-low' : fps < 50 ? 'dtp-fps-med' : 'dtp-fps-good'}`}>
            {fps} FPS
          </span>
          <small>Auto-Q: {getAutoLowQuality() ? '⬇️ Low' : '✅ Full'}</small>
        </div>
      )}

      <ColorblindFilters />

      {/* SVG Filters for Gooey/Liquid Effects */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Background Layer - Controlled by pause/visibility/reducedMotion */}
      {shouldAnimateBackground && equippedBackground?.component && (
        <Suspense fallback={null}>
          <equippedBackground.component
            key={`bg-${shopData.equippedBackground || 'default'}`}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      )}

      {/* Mouse Follower Blob - adds glassmorphism feel (desktop only) */}
      {!isTouchDevice && <MouseFollower color="rgba(138, 43, 226, 0.35)" size={280} blur={30} opacity={0.5} delay={0.12} />}
      {/* Mouse Trail - subtle particle effect on all screens (desktop only) */}
      {!isTouchDevice && (() => {
        const trailCfg = SHOP_TRAILS.find(t => t.id === shopData.equippedTrail)?.config;
        return trailCfg ? (
          <MouseTrail enabled={!reducedMotion} {...trailCfg} />
        ) : (
          <MouseTrail enabled={!reducedMotion} />
        );
      })()}

      {(engineToast || toast) && <div className="toast" role="status" aria-live="polite" aria-atomic="true">{engineToast || toast}</div>}

      {/* Combo Counter - removed from center, no longer distracts */}

      <BossOverlay
        snapshot={snapshot}
        screen={screen}
        bossUi={bossUi}
        comboPop={comboPop}
        rareSplash={rareSplash}
        reducedMotion={reducedMotion}
      />

      {showPrivacy && (
        <PrivacyBanner onDismiss={() => {
          localStorage.setItem(LS_KEYS.PRIVACY_OK, "1");
          setShowPrivacy(false);
        }} />
      )}

      {showOnboarding && screen === 'playing' && (
        <div className="dtp-onboarding" role="dialog" aria-modal="true" aria-label="Quick visual tutorial" ref={onboardingTrapRef}>
          <div className="dtp-hint-step tap-hint">Tap green</div>
          <div className="dtp-hint-step avoid-hint">Avoid purple</div>
          <button onClick={() => { localStorage.setItem('dtp:onboard-seen', 'true'); setShowOnboarding(false); }}
                  className="dtp-btn dtp-btn-primary" data-icon={visualA11y.icons.play}>
            <span className="dtp-text-label">Start</span>
          </button>
        </div>
      )}

      {showTutorial && <EvolveTutorial isOpen={showTutorial} onClose={handleTutorialClose} />}
      {showWhatsNew && <WhatsNew onClose={() => { markWhatsNewSeen(); setShowWhatsNew(false); }} />}

      {settingsOpen && (
        <QuickSettings
          showOffset={showOffset}
          onToggleOffset={() => setShowOffset(v => !v)}
          visualA11y={visualA11y}
          onClose={() => setSettingsOpen(false)}
        />
      )}


      {showSettings && (
        <ChunkErrorBoundary name="Settings">
        <Suspense fallback={<div className="loading-placeholder">Loading settings...</div>}>
        <SettingsDrawer
          colorblindMode={colorblindMode} setColorblindMode={setColorblindMode}
          theme={theme} setTheme={setTheme}
          muted={muted} setMuted={toggleMuted}
          haptics={haptics} setHaptics={setHaptics}
          volume={volume} setVolume={setVolume}
          screenShake={screenShake} setScreenShake={setScreenShakePersisted}
          reducedMotion={reducedMotion} setReducedMotion={setReducedMotion}
          isFS={isFS} toggleFS={toggleFS}
          onClose={closeSettings}
          onNameChange={() => setShowNameEntry(true)}
          playerName={playerName}
          onOpenBuildDeploy={() => setShowBuildDeploy(true)}
          customSeed={customSeedInput}
          onCustomSeedChange={setCustomSeedInput}
          onPlayWithSeed={() => {
            if (!customSeedInput) return;
            localStorage.setItem("pendingReplaySeed", customSeedInput);
            setPendingReplaySeed(customSeedInput);
            setShowSettings(false);
            startGame();
          }}
          currentLocale={currentLocale}
          setCurrentLocale={setCurrentLocale}
        />
        </Suspense>
        </ChunkErrorBoundary>
      )}

      {showDevUnlock && (
        <Suspense fallback={null}>
        <DevUnlockModal
          onUnlock={() => { setShowDevUnlock(false); setDevMode(true); }}
          onClose={() => setShowDevUnlock(false)}
        />
        </Suspense>
      )}

      {showBuildDeploy && (
        <BuildDeploySection onClose={() => setShowBuildDeploy(false)} />
      )}

      {showNameEntry && (
        <div className="modal-overlay" onClick={() => setShowNameEntry(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Change Name</span>
              <button className="btn-icon" onClick={() => setShowNameEntry(false)}>✕</button>
            </div>
            <NameChangeForm
              current={playerName}
              onDevTrigger={() => { setShowNameEntry(false); setShowDevUnlock(true); }}
              onSubmit={(name) => {
                safeSet(LS_KEYS.PLAYER_NAME, name);
                setPlayerName(name);
                setShowNameEntry(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {liveMessage}
      </div>

      {paused && (
        <PauseOverlay
          snapshot={snapshot}
          is2P={is2P}
          muted={muted}
          isFS={isFS}
          onResume={resumeGame}
          onRestart={() => { resumeEngine(); setPaused(false); scoreSubmittedRef.current = false; setTimeout(() => { startEngine(); }, 50); }}
          onExit={() => setShowExitConfirm(true)}
          onToggleMute={() => toggleMuted(!muted)}
          onToggleFS={toggleFS}
          onOpenSettings={() => { setSettingsFromPause(true); setShowSettings(true); }}
          focusTrapRef={focusTrapRef}
        />
      )}

      {showOffset && cursorPos.visible && (
        <div className="dtp-offset-cursor" style={{ left: cursorPos.x, top: cursorPos.y, position: 'fixed', pointerEvents: 'none' }} aria-hidden="true" />
      )}

      {showExitConfirm && (
        <ExitConfirmModal
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => { setShowExitConfirm(false); setPaused(false); goMenu(); }}
        />
      )}

      <GameHeader
        screen={screen}
        isFS={isFS}
        isPlaying={isPlaying}
        practiceMode={practiceMode}
        snapshot={snapshot}
        dust={dust}
        onPause={pauseGame}
        onToggleSettings={() => setShowSettings(s => !s)}
        onLogoClick={() => { if (screen !== "menu" && screen !== "playing" && screen !== "gameover") setScreen("menu"); }}
      />

      {(screen === "leaderboard" || screen === "howto" || screen === "shop") && (
        <button className="universal-back-btn" onClick={() => setScreen("menu")}>← Back</button>
      )}

      {screen === "leaderboard" && (
        <ChunkErrorBoundary name="Leaderboard">
        <Suspense fallback={<div className="loading-placeholder">Loading leaderboard...</div>}>
        <LeaderboardPanel
          mode={lbMode}
          onClose={() => setScreen("menu")}
          fetchGlobalScores={fbFetchTop20Global}
          classicStorageKey={LS_KEYS.LB_CLASSIC}
          evolveStorageKey={LS_KEYS.LB_EVOLVE}
          personalBest={lbMode === "classic" ? best1 : best2}
          playerName={playerName}
          onScoresFetched={checkTop10Achievement}
        />
        </Suspense>
        </ChunkErrorBoundary>
      )}
      {screen === "howto" && <HowToPlay onClose={() => setScreen("menu")} />}
      {screen === "shop" && (
        <ChunkErrorBoundary name="Shop">
        <Suspense fallback={<div className="loading-placeholder">Loading shop...</div>}>
        <ShopPanel
          dust={dust}
          onDustChange={(d: number) => { setDust(d); setShopDataState(loadShopData()); }}
          onClose={() => setScreen("menu")}
          devMode={devMode}
           gameMode={gameMode}
          loadShopData={loadShopData}
          saveShopData={saveShopDataState}
          loadStoredPowerups={loadStoredPwr}
          saveStoredPowerups={saveStoredPwr}
          persistDust={persistDust}
        />
        </Suspense>
        </ChunkErrorBoundary>
      )}

      {screen === "gamemaster" && <GameMaster onBack={() => setScreen("menu")} />}

      {screen === "menu" && (
        <StartScreen
          playerName={playerName}
          isFeatureUnlocked={(f) => machine.isFeatureUnlocked(f, devMode)}
          dailyObjectives={dailyObjectives}
          energyCount={energyData.count}
          energyLastRegen={energyData.lastRegen}
          dust={dust}
          devMode={devMode}
          gameMode={gameMode}
          setGameMode={setGameMode}
          numPlayers={numPlayers}
          setNumPlayers={setNumPlayers}
          inputMode={inputMode}
          setInputMode={setInputMode}
          practiceMode={practiceMode}
          setPracticeMode={setPracticeMode}
          onPlay={startGame}
          onHowTo={() => { if (!hasSeenHowTo) { localStorage.setItem('dtp:howto-seen', 'true'); setHasSeenHowTo(true); } setScreen("howto"); }}
          onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
          onShop={() => setScreen("shop")}
          onKeybind={() => setScreen("keybind")}
          onRefillEnergy={() => refillEnergy(1, GAME.DUST_PER_ENERGY)}
          onSwitchPlayer={switchPlayer}
          onOpenRewardsHub={() => setShowRewardsHub(true)}
          onGameMaster={() => setScreen("gamemaster")}
          rewardsBadgeCount={rewardsBadgeCount}
          dustWidget={<DustWidget dust={dust} />}
          energyBar={<EnergyBar energy={energyData.count} energyLastRegen={energyData.lastRegen} onRefill={() => refillEnergy(1, GAME.DUST_PER_ENERGY)} onRefillFull={() => {
             const needed = GAME.MAX_ENERGY - energyData.count;
             if (needed <= 0) return;
             const cost = needed * GAME.DUST_PER_ENERGY;
             if (dustRef.current < cost) { toast$("💜 Not enough dust!"); return; }
             spendDust(cost);
             refillEnergy(needed, cost);
             toast$("⚡ Energy full!");
           }} onEnergyIconClick={() => setShowEnergyPopup(true)} dust={dust} />}
          pendingReplaySeed={pendingReplaySeed}
          onClearReplaySeed={clearReplaySeed}
          onToast={toast$}
        />
      )}

      {/* Dev Panel — lightweight overlay, Ctrl+Shift+D to toggle */}
      {showDevPanel && (
        <div className="dtp-dev-overlay" aria-hidden="true">
          <h4>Dev Mode</h4>
          <div className="dtp-dev-grid">
            <label><input type="checkbox" checked={showFps} onChange={() => setShowFps(!showFps)} /> FPS</label>
            <label><input type="checkbox" checked={showDevPanel} onChange={() => { setShowDevPanel(false); localStorage.removeItem('dtp:dev'); }} /> Disable Dev</label>
            <button onClick={() => { if (!confirm('Clear ALL local progress, settings & cache? This cannot be undone.')) return; privacyManager.deleteAll(); location.reload(); }} className="dtp-dev-btn">Clear Storage & Reload</button>
            <button onClick={() => settingsManager.set({ ...settingsManager.get() })} className="dtp-dev-btn">Re-apply Settings</button>
          </div>
          <small>Ctrl+Shift+D to toggle</small>
        </div>
      )}

      {/* DevOverlay — available in dev and production */}
      {devMode && (
        <Suspense fallback={null}>
        <DevOverlay
          p1={snapshot?.p1 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 } as PlayerState}
          p2={snapshot?.p2 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 } as PlayerState}
          tick={snapshot?.tick || 0}
          gameMode={gameMode}
          numPlayers={numPlayers}
          rareMode={snapshot?.rareMode || { active: false, color: "purple", cssColor: "#c026d3", turnsLeft: 0, shape: "circle", emoji: "" }}
          cellShape={snapshot?.cellShape || "square"}
          paused={paused}
          screen={screen}
          onClose={() => setDevMode(false)}
          godMode={godMode}
          onGodModeToggle={() => setGodMode(g => !g)}
          speedMult={speedMult}
          onSpeedMult={v => { setSpeedMult(v); }}
          rotationSpeed={devRotationSpeed}
          onRotationSpeed={v => setDevRotationSpeed(v)}
          freezeTime={devFreezeTime}
          onFreezeTimeToggle={() => setDevFreezeTime(f => !f)}
          dust={dust}
          onDustAdd={amount => addDust(amount, 'Dev')}
          onSpawnPowerup={devSpawnPowerup}
          onSpawnSpecialCell={devSpawnSpecialCell}
          onTriggerBotTap={devTriggerBotTap}
          onToggleBotAssist={devToggleBotAssist}
          gameSeed={snapshot?.gameSeed || 0}
          autoPlay={devAutoPlay}
          onAutoPlayToggle={() => setDevAutoPlay(v => !v)}
          heatmap={devHeatmap}
          onResetHeatmap={() => setDevHeatmap({})}
          gridCols={snapshot?.grid?.cols ?? 3}
          gridRows={snapshot?.grid?.rows ?? 3}
        />
        </Suspense>
      )}

      {isPlaying && snapshot && (
         <div className="hud">
          <div className={`hud-card hud-card--score${snapshot.p1.streak >= 10 ? " streak--high" : snapshot.p1.streak >= 5 ? " streak--mid" : ""}`}>
            <div className="hud-lbl">Score</div>
            <div className="hud-score-row">
              <div data-testid="hud-score" className={`hud-val${snapshot.p1.score > (gameMode === "classic" ? best1 : best2) && snapshot.p1.score > 0 ? " hud-val--pb" : ""}`}>
                {snapshot.p1.score}
              </div>
              {snapshot.p1.streak >= 3 && <div className="combo-wrap">×{snapshot.p1.streak}</div>}
            </div>
          </div>
          <div className="hud-card">
            <div className="hud-lbl">Best</div>
            <div className="hud-val">{gameMode === "classic" ? best1 : best2}</div>
          </div>
          <div className="hud-card">
            <div className="hud-lbl">Speed</div>
            <div className="hud-val hud-val--sm">{speedLabel(snapshot.tick, snapshot.p1.freezeEnd > Date.now())}</div>
          </div>
          <div className="hud-card hud-card--hearts">
            <Hearts health={snapshot.p1.health} anim={heartAnimP1} shieldCount={snapshot.p1.shieldCount} />
          </div>
          {/* Bot assist pill — Evolve 1P only, lives in HUD row never near grid */}
          {!is2P && gameMode === "evolve" && (() => {
            const botOn = isBotActive();
            return (
              <button
                className={`bot-hud-btn${botOn ? " bot-hud-btn--on" : ""}${dust < 30 ? " bot-hud-btn--off" : ""}`}
                onClick={() => { if (dust >= 30) handleBotToggle(1); }}
                title={dust < 30 ? "Need 30+ dust" : botOn ? "Bot ON - tap to stop" : "Bot assist (30💜/use)"}
                aria-label="Toggle bot assist"
                aria-pressed={botOn}
              >
                {botOn ? "🤖 ON" : "🤖"}
              </button>
            );
          })()}
        </div>
      )}

       {isPlaying && snapshot && (
         <div className="spd-wrap">
          <div className="spd-track"><div className="spd-fill" style={{width: speedPct(snapshot.tick) + "%"}} /></div>
        </div>
      )}

        {isPlaying && snapshot && (
          <GameArea
            snapshot={snapshot}
            screen={screen}
            gameMode={gameMode}
            is2P={is2P}
            numPlayers={numPlayers}
            isPlaying={isPlaying}
            reducedMotion={reducedMotion}
            screenShake={screenShake}
            shakeGrid1={shakeGrid1}
            shakeGrid2={shakeGrid2}
            heartAnimP1={heartAnimP1}
            heartAnimP2={heartAnimP2}
            best1={best1}
            best2={best2}
            engineWinner={engineWinner}
            shareMsg={shareMsg}
            gameSeedState={gameSeedState}
            dust={dust}
            dustAtStart={dustAtStartRef.current}
            gameOverProgress={gameOverProgress}
            p1Keys={p1Keys}
            p2Keys={p2Keys}
            inputMode={inputMode}
            pressing1={pressP1}
            pressing2={pressP2}
            cbActive={cbActive}
            cbFilter={cbFilter}
            shopData={shopData}
            pwrToastP1={pwrToastP1}
            pwrToastP2={pwrToastP2}
            levelUpBadge={levelUpBadge}
            practiceMode={practiceMode}
            botAssistActive={botAssistActive}
            botTapHighlights={botTapHighlights}
            scoreFloats={scoreFloats}
            isFS={isFS}
            devHeatmap={devHeatmap}
            onRestart={() => { goMenu(); setTimeout(startGame, 100); }}
            onStartGame={startGame}
            onTap={(p, i) => { handleTap(p, i); if (devMode) setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
            onHoldStart={handleHoldStart}
            onHoldEnd={handleHoldEnd}
            onPause={pauseGame}
            onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
            onMenu={goMenu}
            onActivateFreeze={activateStoredFreeze}
            onActivateShield={activateStoredShield}
            onToggleBot={handleBotToggle}
          />
      )}

      {gamepadActive && <div className="dtp-gamepad-badge">🎮 Gamepad Active</div>}

      {achievementQueue.length > 0 && (
        <div className="dtp-toast-stack" aria-live="polite">
          {achievementQueue.map((a, i) => (
            <div key={a.id} className="dtp-toast-achievement" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="dtp-toast-icon">
                {ACHIEVEMENT_ICON_MAP[a.icon] && !reducedMotion
                  ? <LottiePlayer
                      src={`/assets/lottie/${ACHIEVEMENT_ICON_MAP[a.icon]}.json`}
                      autoplay
                      reducedMotion={reducedMotion}
                      style={{ width: 32, height: 32 }}
                    />
                  : ACHIEVEMENT_ICON_MAP[a.icon]
                    ? <Icon name={ACHIEVEMENT_ICON_MAP[a.icon]} size={24} />
                    : a.icon}
              </span>
              <div className="dtp-toast-content">
                <strong><Icon name="trophy" size={16} /> {a.name}</strong>
                <small>{a.desc}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRotatePrompt && <RotatePrompt />}

      {screen === "menu" && (
        <footer className="credit">
          {loginStreakCount >= 2 && (
            <span className="daily-streak-badge">🗓 Day {loginStreakCount} streak</span>
          )}
          <span>By Mohammed Ahmed Siddiqui · <a href="https://mscarabia.com" target="_blank" rel="noopener noreferrer" className="credit-link">mscarabia.com</a></span>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="credit-link" style={{marginLeft:6}}>Privacy</a>
        </footer>
      )}

      {showRewardsHub && (
        <RewardsHub
          loginStreak={loginStreakCount}
          loginReward={loginStreakReward}
          loginClaimedToday={loginClaimedToday}
          onClaimLogin={() => {
            handleLoginStreakClaim();
          }}
          dailyChallenges={dailyChallenges}
          onClaimChallenge={handleChallengeClaim}
          weeklyTasks={weeklyTasks}
          onClaimWeekly={handleClaimWeekly}
          onClose={() => setShowRewardsHub(false)}
        />
      )}

      {showEnergyPopup && (
        <EnergyPopup
          energyCount={energyData.count}
          dust={dust}
          onClose={() => setShowEnergyPopup(false)}
          onRefill1={() => {
            spendDust(GAME.DUST_PER_ENERGY);
            refillEnergy(1, GAME.DUST_PER_ENERGY);
            toast$("⚡ Energy refilled!");
          }}
          onRefillFull={() => {
            const needed = GAME.MAX_ENERGY - energyData.count;
            const cost = needed * GAME.DUST_PER_ENERGY;
            spendDust(cost);
            refillEnergy(needed, cost);
            toast$("⚡ Energy full!");
            setShowEnergyPopup(false);
          }}
        />
      )}
    </div>
    </>
  );
}




```

## FILE: engine/GameEngine.ts
```typescript
/**
 * CLOCK DOMAIN CONVENTION:
 * - Date.now(): Used for real-time game state (energy regen, bomb expiry, login streaks)
 * - performance.now(): Used for sub-frame timing (FPS measurement, animation deltas)
 * - Game ticks: Internal engine clock, advances once per tick interval
 *
 * Do NOT mix domains. When a value crosses domains, convert explicitly.
 */
import { GAME } from "../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../config/gridPatterns";
import { computeMs, makeGameSeed, getSpinConfig, mulberry32, speedLabel } from "./DifficultyScaler";
import { logError } from "../utils/devLog";
import { InputBuffer } from "../utils/input-smoothing";
import { haptics } from "../utils/haptics";
import { scoreSync } from "../utils/score-sync";
import { audioEngine } from "../utils/audio";
import { analytics } from "../utils/analytics";
import { gamepadManager } from "../utils/gamepad";
import { configManager } from "../utils/game-config";
import { errorTracker } from "../utils/error-tracker";
import { DynamicDifficulty } from "../utils/dda";
import { seedManager } from "../utils/seed-manager";
import { bossEngine } from "../utils/boss-engine";
import { achievementSystem } from "../utils/achievements";
import { ACHIEVEMENT_DEFS } from "../config/achievementDefs";
import { DailyChallenge } from "../utils/seed-challenge";
import { perfMonitor } from "../utils/perf-monitor";
import { scoreCardGen } from "../utils/score-card";
import { rhythmFeedback } from "../utils/feedback-rhythm";
import type {
  ActiveCell, CellShape, GameConfig, GameEvent,
  GameSnapshot, PlayerState, RareColorMode, Winner,
  BossEvent, HoldCell, IceCell,
} from "./types";
import {
  activeToCellsP, spawnActive,
} from "./subsystems/CellLifecycle";
import { calculateStreakBonus, calculateTapScore, checkStreakMilestone } from "./subsystems/ScoreTracker";
import { challengeLink } from "../utils/challenge-link";
import { TickProcessor, type TickContext } from "./subsystems/TickProcessor";
import { BotController } from "./subsystems/BotController";
import { getBossDoneLabel } from "./subsystems/EventOrchestrator";

function makePS(bonusHearts: number, hasMult: boolean, stored: { freeze: number; shield: number; mult: number; heart: number }): PlayerState {
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: GAME.MAX_HEARTS + bonusHearts,
    shield: false, shieldCount: 0, freezeEnd: 0,
    multiplierEnd: hasMult ? Date.now() + 24000 : 0,
    gridStage: 0, stageProgress: 0, patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
    nextShuffleTick: 0,
  };
}

// ΓöÇΓöÇΓöÇ GameEngine class ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export class GameEngine {
  private rafId: number | null = null;
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickCount  = 0;
  private evolveTick = 0;
  private iMult      = 1;
  private paused     = false;
  private phase: GameSnapshot["phase"] = "playing";
  private holdTimers = new Map<string, { cell: ActiveCell, player: 1 | 2, generation: number }>();
  private holdGeneration = 0;
  private dirty      = true;

  private rng: () => number = () => Math.random();
  private p1!: PlayerState;
  private p2!: PlayerState;
  private cellShape: CellShape    = "square";
  private rareMode: RareColorMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
  private spinLevel  = 0;
  private gameSeed   = makeGameSeed();
  private tapBuffer: Record<1 | 2, { idx: number; ts: number } | null> = { 1: null, 2: null };
  private static readonly TAP_BUFFER_MS = GAME.TAP_BUFFER_MS;
  private   devGodMode     = false;
  private devFreezeTime  = false;
  private devForcedPwr: "shield" | "freeze" | "heart" | null = null;
  private devRotationSpeed = 1;
  private botAssistActive: { 1: boolean; 2: boolean } = { 1: false, 2: false };

  private listeners: Set<(e: GameEvent) => void> = new Set();
  private _pauseListeners: Array<() => void> = [];
  private _resumeListeners: Array<() => void> = [];
  private inputBuffer = new InputBuffer();

  private fpsHistory: number[] = [];
  private fpsIdx = 0;
  private autoLowQuality = false;
  private lowQualityThreshold = 40;
  // Snapshot cache fields
  private _cachedMask: number[] | null = null;
  private _cachedMaskSrc: number[] | null = null;
  private _cachedSpinCfg: { duration: number; direction: 1 | -1 } | null = null;
  private _cachedSpinLevel = -1;
  private _cachedSpinSeed = -1;
  private _cachedRotationSpeed = 1;
  // K1: cell shuffle state
  // nextShuffleTick moved to PlayerState for per-player tracking
  private readonly SHUFFLE_DURATION_MS = 200; // K3: slide animation duration
  // Boss/Bomb state
  private bossEvent: BossEvent | null = null;
  private nextBossTriggerScore = 500;
  private activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null = null;
  private _settingsUnsub: (() => void) | null = null;
  private _gamepadUnsub: (() => void) | null = null;
  private _bossCompleteHandler: (() => void) | null = null;
  private _bossShieldBreakHandler: (() => void) | null = null;
  private _difficultyEmergencyHandler: (() => void) | null = null;
  private _lastFocusedCell = '0';
  private _config = configManager.get();
  private _configUnsub: (() => void) | null = null;
  private dda = new DynamicDifficulty(1200);
  private daily = new DailyChallenge();
  private _lastTapTime = 0;
  private _sessionStartTime = performance.now();
  private _isDisposed = false;
  private _isInverted = false;
  private _isBlackout = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private _tickSoundCounter = 0;
  private _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }> = [];
  private _lastTickTs = performance.now();
  private _hitPauseUntil = 0; // Hit pause: freeze game briefly on impactful moments
  private _deathSlowdown = false; // Slow-motion on death before game over
  private _deathCleanupTimer: ReturnType<typeof setTimeout> | null = null; // Track death cleanup timeout
  private _cachedNow = Date.now(); // Cached Date.now() per tick — avoids 10+ syscalls per frame
  private _bossActive = false;
  private _shieldCollected = 0;
  private _tookDamage = false;
  private _freezeCollected = 0;
  private _purpleTaps = 0;
  private _tickProcessor = new TickProcessor();
  private _tickCtx!: TickContext;
  private _bot: BotController;

  constructor(private config: GameConfig) {
    perfMonitor.observe();
    this._sessionStartTime = performance.now();
    this.iMult = config.speedMult;
    this.devGodMode = config.godMode ?? false;
    achievementSystem.load();
    for (const def of ACHIEVEMENT_DEFS) {
      achievementSystem.register({ ...def, unlocked: false });
    }
    audioEngine.init();
    import('../utils/settings').then(m => {
      this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
    }).catch(e => logError('Settings module failed', e));
    this._configUnsub = configManager.subscribe(cfg => { this._config = cfg; });
    this._bossCompleteHandler = () => {
      this._bossActive = false;
      achievementSystem.unlock('boss_defeat');
    };
    this._bossShieldBreakHandler = () => { this.hitPause(80); this.emit({ type: "shake", player: 1 }); this.emit({ type: "sound", name: "powerup" }); };
    this._difficultyEmergencyHandler = () => {
      if (!this.p1 || this.phase !== 'playing') return;
      const bonus = Math.round(50 * rhythmFeedback.state.multiplier);
      this.p1.score += bonus;
      this.emit({ type: "toast", message: ` Difficulty adjusted! +${bonus} pts` });
      document.documentElement.setAttribute('data-dda-emergency', 'true');
      setTimeout(() => document.documentElement.removeAttribute('data-dda-emergency'), 2200);
    };
    window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    window.addEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    window.addEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    gamepadManager.init();
    this._gamepadUnsub = gamepadManager.on((btn, state) => {
      if (state !== 'press') return;
      if (btn === 'a' || btn === 'dpad_up') { const v = parseInt(this._lastFocusedCell); this.handleTap(1, Number.isFinite(v) ? v : 0); }
      if (btn === 'start') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._tickCtx = {
      get config() { return self.config; },
      get phase() { return self.phase; }, set phase(v) { self.phase = v; },
      get tickCount() { return self.tickCount; }, set tickCount(v) { self.tickCount = v; },
      get evolveTick() { return self.evolveTick; }, set evolveTick(v) { self.evolveTick = v; },
      get cellShape() { return self.cellShape; }, set cellShape(v) { self.cellShape = v; },
      get rareMode() { return self.rareMode; }, set rareMode(v) { self.rareMode = v; },
      get spinLevel() { return self.spinLevel; }, set spinLevel(v) { self.spinLevel = v; },
      get p1() { return self.p1; },
      get p2() { return self.p2; },
      get bossEvent() { return self.bossEvent; }, set bossEvent(v) { self.bossEvent = v; },
      get _bossActive() { return self._bossActive; }, set _bossActive(v) { self._bossActive = v; },
      get _isInverted() { return self._isInverted; }, set _isInverted(v) { self._isInverted = v; },
      get _isBlackout() { return self._isBlackout; }, set _isBlackout(v) { self._isBlackout = v; },
      get nextBossTriggerScore() { return self.nextBossTriggerScore; }, set nextBossTriggerScore(v) { self.nextBossTriggerScore = v; },
      get activeBomb() { return self.activeBomb; }, set activeBomb(v) { self.activeBomb = v; },
      get dirty() { return self.dirty; }, set dirty(v) { self.dirty = v; },
      get _tickSoundCounter() { return self._tickSoundCounter; }, set _tickSoundCounter(v) { self._tickSoundCounter = v; },
      get _lastTickTs() { return self._lastTickTs; }, set _lastTickTs(v) { self._lastTickTs = v; },
      get now() { return self._cachedNow; },
      get numPlayers() { return self.config.numPlayers; },
      get _deltaTimers() { return self._deltaTimers; }, set _deltaTimers(v) { self._deltaTimers = v; },
      get devGodMode() { return self.devGodMode; }, set devGodMode(v) { self.devGodMode = v; },
      get devFreezeTime() { return self.devFreezeTime; }, set devFreezeTime(v) { self.devFreezeTime = v; },
      get devForcedPwr() { return self.devForcedPwr; }, set devForcedPwr(v) { self.devForcedPwr = v; },
      get dda() { return self.dda; },
      emit: (e) => self.emit(e),
      _flushTapBuffer: (p) => self._flushTapBuffer(p),
      checkStageProgress: (p) => self.checkStageProgress(p),
      triggerGameOver: (w) => self.triggerGameOver(w),
      scheduleTimeout: (cb, ms) => self.scheduleTimeout(cb, ms),
      addDeltaTimer: (id, dur, cb) => self.addDeltaTimer(id, dur, cb),
      removeDeltaTimer: (id) => self.removeDeltaTimer(id),
      get rng() { return self.rng; },
    };
    this._bot = new BotController({
      getDangerColor:  () => this.rareMode?.active ? this.rareMode.color : 'purple',
      isInverted:      () => this.bossEvent?.type === 'inversion' && Date.now() < (this.bossEvent?.endsAt ?? 0),
      handleTap:       (player, idx) => this.handleTap(player, idx),
      emit:            (event) => this.emit(event as unknown as GameEvent),
      getActiveCells:  (player) => (player === 1 ? this.p1 : this.p2).active,
      isPlaying:       () => this.phase === 'playing',
    });
  }

  private _applySettings(s: { reducedMotion?: boolean; liteMode?: boolean }) {
    if (s.reducedMotion !== undefined) {
      this.devRotationSpeed = s.reducedMotion ? 0.5 : 1;
    }
  }

  setConfig(cfg: typeof this._config) { this._config = cfg; }

  handleError(err: Error, phase: string) {
    errorTracker.capture(err, { phase, tick: this.tickCount, p1Score: this.p1?.score, p2Score: this.p2?.score });
    if (this.phase === "playing") {
      this.pause();
    }
  }

  getDDASpawnRate() { return this.dda.spawnRate; }
  isDailyComplete() { return this.daily.isTodayComplete(); }

  async generateScoreCard(score: number): Promise<string> {
    if (this._isDisposed) return "";
    return scoreCardGen.generate({
      score,
      hearts: this.p1?.health ?? 0,
      time: Math.round(this.tickCount / 2),
      rank: score > 5000 ? 'S' : score > 3000 ? 'A' : score > 1000 ? 'B' : 'C',
      seed: this.daily.getSeed() || 'casual'
    });
  }

  start(forceSeed?: number): void {
    if (this._isDisposed) return; // Fix #2: Uninitialized/Disposed guard
    this.stop();
    // Issue 15: Temporarily detach boss complete handler to prevent
    // the boss_defeat achievement from firing on cleanup deactivation.
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    bossEngine.deactivate();
    if (this._bossCompleteHandler) window.addEventListener('dtp:boss:complete', this._bossCompleteHandler);
    rhythmFeedback.reset();
    this.tickCount  = 0;
    this.evolveTick = 0;
    this.iMult      = this.config.speedMult;
    this.devGodMode = this.config.godMode ?? false;
    this.paused     = false;
    this.phase      = "playing";
    this.cellShape  = "square";
    this.spinLevel  = 0;
    this._lastTickTs = performance.now();
    this._deltaTimers = [];
    this.clearAllTimeouts();
    this._bossActive = false;
    this._deathSlowdown = false;
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;
    this.inputBuffer.clear();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.gameSeed   = forceSeed ?? seedManager.initOrRestore();
    this.rng        = mulberry32(this.gameSeed);
    this._bot.setRng(this.rng);
    this.rareMode        = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    this.bossEvent = null;
    this.nextBossTriggerScore = 500;
    this.activeBomb = null;
    // Load stored once, compute deductions, call saveStoredPowerups once for mult deduction if hasMult, once for heart reset if bonusHearts
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    const bonusHearts = (this.config.mode === "evolve" && stored.heart > 0) ? stored.heart : 0;
    const hasMult = (this.config.mode === "evolve" && (stored.mult ?? 0) > 0);
    if (hasMult || bonusHearts > 0) {
      const updated = { ...stored };
      if (hasMult) updated.mult = (stored.mult ?? 1) - 1;
      if (bonusHearts > 0) updated.heart = 0;
      this.config.storage?.saveStoredPowerups(updated);
    }
    this.p1 = makePS(bonusHearts, hasMult, stored);
    this.p2 = makePS(bonusHearts, hasMult, this.config.numPlayers === 2 ? { freeze: 0, shield: 0, mult: 0, heart: 0 } : stored);
    this.p1.nextShuffleTick = 40 + Math.floor(this.rng() * 20); // K2: first shuffle at tick 40-60
    this.p2.nextShuffleTick = 40 + Math.floor(this.rng() * 20);
    this.tapBuffer  = { 1: null, 2: null };
    this.dirty = true;
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
    this.scheduleTick();
    this.startSnapshotRaf();
    analytics.track('game_start', { mode: this.config.mode, seed: this.gameSeed });
  }

  stop(): void {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._bot.dispose();
  }

  private lastFrameTime = 0;

  private startSnapshotRaf(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId); // Fix #1: Prevent RAF leak
    this.lastFrameTime = performance.now();
    const loop = (timestamp: number) => {
      if (this.rafId === null) return;
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        if (this.phase === "playing") {
          this.updatePerformanceMetrics(frameTime);
        }
      }
      this.lastFrameTime = timestamp;
      if (this.dirty && this.phase !== "gameover") {
        this.dirty = false;
        this.emitSnapshot();
      }
      if (this.phase !== "gameover") {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private scheduleTick(): void {
    if (this.phase !== "playing") return;
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    const ddaFactor = Math.max(0.75, Math.min(1.25, this.dda.compute() / 1200));
    const ms = computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult * ddaFactor;
    // Add hit pause delay if active, and apply death slowdown
    const hitPauseRemaining = Math.max(0, this._hitPauseUntil - performance.now());
    const slowdownMult = this._deathSlowdown ? 3 : 1;
    const delay = (ms * slowdownMult) + hitPauseRemaining;
    this.tickTimer = setTimeout(() => {
      if (this.phase !== "playing") return;
      this.processTick();
      this.scheduleTick();
    }, delay);
  }

  private scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this._timeouts = this._timeouts.filter(t => t !== id);
      // FIX-04: Fire during pause too — animation cleanups are harmless,
      // and the tick loop is already stopped so no game state mutation occurs.
      // Dropped callbacks during tab-switch pauses caused stale animation state.
      if (this.phase !== 'gameover') cb();
    }, ms);
    this._timeouts.push(id);
    return id;
  }

  private clearAllTimeouts(): void {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  }

  addDeltaTimer(id: string, durationMs: number, callback: () => void) {
    this.removeDeltaTimer(id);
    this._deltaTimers.push({ id, remaining: durationMs, duration: durationMs, callback });
  }

  removeDeltaTimer(id: string) {
    this._deltaTimers = this._deltaTimers.filter(t => t.id !== id);
  }

  clearAllDeltaTimers() { this._deltaTimers = []; }

  pause(): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing" || !this.p1 || !this.p2) return;
    this.paused = true;
    this.phase  = "paused";
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.dirty = true;
    this._pauseListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "paused" });
    this.emitSnapshot();
  }

  resume(): void {
    if (this._isDisposed) return;
    if (this.phase !== "paused") return;
    if (!this.p1?.alive) return; // Fix #7: Validation

    // Clear stale boss event that expired while paused
    if (this.bossEvent && this.bossEvent.endsAt <= Date.now()) {
      const expiredType = this.bossEvent.type;
      this.bossEvent = null;
      this._bossActive = false;
      window.dispatchEvent(new Event('dtp:boss:complete'));
      this.emit({ type: "toast", message: getBossDoneLabel(expiredType) });
      if (expiredType === 'inversion') {
        achievementSystem.unlock('boss_inversion');
      }
    }

    this.paused = false;
    this.phase  = "playing";
    this.scheduleTick();
    this.startSnapshotRaf(); // Restart RAF loop
    this.dirty = true;
    this._resumeListeners.forEach(fn => fn());
    this.emit({ type: "phaseChange", phase: "playing" });
    this.emitSnapshot();
  }

  onPause(cb: () => void): void { this._pauseListeners.push(cb); }
  onResume(cb: () => void): void { this._resumeListeners.push(cb); }

  /** Hit pause: briefly freeze the game on impactful moments (damage, boss, milestones) */
  hitPause(ms: number): void {
    this._hitPauseUntil = performance.now() + ms;
  }

  /** Check if currently in hit pause */
  get isHitPaused(): boolean {
    return performance.now() < this._hitPauseUntil;
  }

destroy(): void {
    this._isDisposed = true;
    this._settingsUnsub?.();
    this._configUnsub?.();
    this._gamepadUnsub?.();
    if (this._bossCompleteHandler) window.removeEventListener('dtp:boss:complete', this._bossCompleteHandler);
    if (this._bossShieldBreakHandler) window.removeEventListener('dtp:boss:shield-break', this._bossShieldBreakHandler);
    if (this._difficultyEmergencyHandler) window.removeEventListener('dtp:difficulty:emergency', this._difficultyEmergencyHandler);
    bossEngine.dispose();
    this.holdTimers.clear();
    this.tapBuffer = { 1: null, 2: null };
    this.clearAllTimeouts();
    this.clearAllDeltaTimers();
    if (this._deathCleanupTimer) { clearTimeout(this._deathCleanupTimer); this._deathCleanupTimer = null; }
    this.stop();
    this.listeners.clear();
    this._pauseListeners = [];
    this._resumeListeners = [];
  }

  safeReset(keepSettings = false) {
    if (this._isDisposed) return;
    if (!keepSettings) {
      this._settingsUnsub?.();
      this._settingsUnsub = null;
      // Re-subscribe to settings after reset
      import('../utils/settings').then(m => {
        this._settingsUnsub = m.settingsManager.subscribe(s => this._applySettings(s));
      }).catch(e => logError('Settings module failed', e));
    }
    this.start();
  }

  subscribe(fn: (e: GameEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(fn => fn(event));
  }

  private emitSnapshot(): void {
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
    this.dirty = false;
  }

  private _currentTickMs(): number {
    const now = Date.now();
    const frozen = this.p1.freezeEnd > now || (this.config.numPlayers === 2 && this.p2.freezeEnd > now);
    const tickForCalc = this.devFreezeTime ? 0 : this.tickCount;
    return computeMs(tickForCalc, frozen ? 1.4 : 1) * this.iMult;
  }

  private processTick(): void {
    try {
      this._cachedNow = Date.now(); // Cache once per tick
      this._tickProcessor.processTick(this._tickCtx);
    } catch (e) {
      // Fix #6: Error handling to prevent engine lockup
      this.handleError(e as Error, "processTick");
    }
  }

  handleTap(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const cellId = `p${player}-${idx}`;
    if (!this.inputBuffer.register(cellId)) return;
    haptics.tap();
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref || !ref.alive) return;
    this.tapBuffer[player] = { idx, ts: Date.now() };
    this._flushTapBuffer(player);
  }

  private _flushTapBuffer(player: 1 | 2): void {
    const entry = this.tapBuffer[player];
    if (!entry || Date.now() - entry.ts > GameEngine.TAP_BUFFER_MS) { this.tapBuffer[player] = null; return; }
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === entry.idx);
    if (!cell || cell.clicked) return;
    this.tapBuffer[player] = null;
    this._processTap(player, entry.idx);
  }

  private _processTap(player: 1 | 2, idx: number): void {
    const ref = player === 1 ? this.p1 : this.p2;
    const cell = ref.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    if (!(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)).includes(idx)) return;

    if (cell.type === "ice") { this._processTapIce(player, ref, cell as IceCell, idx, pat); return; }
    if (cell.type === "hold") return;
    if (cell.type === "bomb") { this._processTapBomb(player, ref, cell, idx, pat); return; }
    if (["medpack","shield","freeze","multiplier"].includes(cell.type)) { this._processTapPowerup(player, ref, cell, idx, pat); return; }

    const isInvertedTap = this.bossEvent?.type === "inversion" && Date.now() < (this.bossEvent?.endsAt ?? 0);
    const danger = this.rareMode.active ? this.rareMode.color : "purple";
    const tappedIsDanger = isInvertedTap ? cell.type !== danger : cell.type === danger;
    if (tappedIsDanger) {
      this._processTapDanger(player, ref, cell, idx, pat);
    } else {
      this._processTapSafe(player, ref, cell, idx, pat);
    }
  }

  private _processTapIce(player: 1 | 2, ref: PlayerState, cell: IceCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    const rem = (cell.iceCount ?? 1) - 1;
    this.triggerCellAnim(player, idx, rem <= 0 ? "pop" : "shake");
    this.emit({ type: "sound", name: rem <= 0 ? "ok" : "tick" });
    if (rem <= 0) {
      haptics.success();
      cell.clicked = true;
      const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
      const nextStreak = ref.streak + 1;
      ref.score += mult + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.dirty = true; this.emitSnapshot(); return; }
    } else cell.iceCount = rem;
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapBomb(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    if (this.activeBomb?.idx === idx && this.activeBomb?.player === player) this.activeBomb = null;
    this.triggerCellAnim(player, idx, "pop");
    this.emit({ type: "sound", name: "powerup" });
    this.emit({ type: "bombDefused", player });
    this.emit({ type: "toast", message: "💣 Defused! +3" });
    this.hitPause(30);
    const { mult } = calculateTapScore(Date.now() < ref.multiplierEnd, false, 1);
    const nextStreak = ref.streak + 1;
    ref.score += (mult * 3) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
    this.checkStageProgress(player);
    const lifetime = (parseInt(localStorage.getItem('dtp_lifetime_bomb_defuses') ?? '0') || 0) + 1;
    try { localStorage.setItem('dtp_lifetime_bomb_defuses', String(lifetime)); } catch {}
    achievementSystem.check('bomb_defuse', () => lifetime >= 10);
    achievementSystem.check('bomb_master', () => lifetime >= 50);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapPowerup(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    this.emit({ type: "sound", name: "powerup" });
    this.triggerCellAnim(player, idx, "pop");
    if (cell.type === "medpack") haptics.medpack();
    else if (cell.type === "shield") haptics.shield();
    else if (cell.type === "freeze") haptics.freeze();
    else if (cell.type === "multiplier") haptics.multiplier();
    if (cell.type === "medpack") {
      if (ref.health >= GAME.MAX_HEARTS) {
        ref.shieldCount += 1; ref.shield = true;
        this.emit({ type: "pwrToast", message: `🛡 Overheal! +1 Shield`, player });
      } else {
        ref.health = Math.min(GAME.MAX_HEARTS, ref.health + 1);
        this.emit({ type: "toast", message: "♥ +1 Heart!" });
      }
    }
    if (cell.type === "shield") { ref.shieldCount += 1; ref.shield = true; this._shieldCollected++; }
    if (cell.type === "freeze") { ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000; this._freezeCollected++; }
    if (cell.type === "multiplier") ref.multiplierEnd = Date.now() + 24000;
    if (cell.type === "shield") {
      this.emit({ type: "pwrToast", message: `🛡 Shield ×${ref.shieldCount}!`, player });
    } else if (cell.type === "multiplier") {
      this.emit({ type: "pwrToast", message: "×2 multiplier!", player });
    } else if (cell.type === "freeze") {
      this.emit({ type: "pwrToast", message: "❄ Freeze activated!", player });
    }
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapDanger(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    const dmg = this.config.mode === "evolve" ? 0.5 : 1;
    cell.clicked = true;
    if (!this.devGodMode) {
      if (ref.shieldCount > 0) {
        this.dda.recordAttempt(false, 0, false);
        ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0;
        this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
        this.triggerCellAnim(player, idx, "pop");
      } else {
        this.dda.recordAttempt(false, 0, true);
        if (ref.streak >= 5) this.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
        ref.health = Math.max(0, ref.health - dmg); ref.shield = false; ref.streak = 0; this._tookDamage = true;
        this.emit({ type: "sound", name: "bad" }); this.triggerCellAnim(player, idx, "shake");
        this.emit({ type: "damage", player }); this.emit({ type: "shake", player });
        this.hitPause(ref.health <= 0 ? 200 : 40);
        if (ref.health <= 0) { ref.alive = false; this.triggerGameOver(this.config.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1")); }
      }
    } else {
      this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
      this.triggerCellAnim(player, idx, "pop");
    }
    this._purpleTaps = (this._purpleTaps ?? 0) + (cell.type === 'purple' ? 1 : 0);
    achievementSystem.check('secret_purple_tap', () => (this._purpleTaps ?? 0) >= 10);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _processTapSafe(player: 1 | 2, ref: PlayerState, cell: ActiveCell, idx: number, pat: { cols: number; rows: number; mask: number[] | null }): void {
    cell.clicked = true;
    this.emit({ type: "sound", name: "ok", pitchMult: 1 + ref.streak * 0.015 });
    this.triggerCellAnim(player, idx, "pop");
    if (this._bossActive) bossEngine.onSafeTap();
    rhythmFeedback.recordTap();
    const { mult, bossMult } = calculateTapScore(Date.now() < ref.multiplierEnd, this._bossActive, bossEngine.combo.multiplier);
    const nextStreak = ref.streak + 1;
    const tapScore = (mult * bossMult) + calculateStreakBonus(nextStreak);
    ref.score += tapScore; ref.streak = nextStreak; ref.stageProgress += 1;
    this.emit({ type: "scoreFloat", player, idx, amount: tapScore });
    if (checkStreakMilestone(ref.streak)) { this.emit({ type: "toast", message: `🔥 ${ref.streak} Streak!` }); this.hitPause(25); haptics.combo(ref.streak); }
    if (ref.health === 1 && !this.devGodMode) this.emit({ type: "toast", message: "❤️ Last heart!" });
    this.checkStageProgress(player);
    const now = performance.now();
    const reaction = this._lastTapTime ? now - this._lastTapTime : 0;
    this._lastTapTime = now;
    if (reaction > 0) this.dda.recordAttempt(true, reaction, false);
    this._checkTapAchievements(ref);
    ref.cells = activeToCellsP(ref.active, pat);
    this.dirty = true;
    this.emitSnapshot();
  }

  private _checkTapAchievements(ref: PlayerState): void {
    achievementSystem.check('first_blood', () => true);
    achievementSystem.check('survivor', () => ref.health <= 1 && this.tickCount > 300);
    achievementSystem.check('score_100', () => ref.score >= 100);
    achievementSystem.check('score_500', () => ref.score >= 500);
    achievementSystem.check('score_1000', () => ref.score >= 1000);
    achievementSystem.check('score_2500', () => ref.score >= 2500);
    achievementSystem.check('score_5000', () => ref.score >= 5000);
    achievementSystem.check('score_9999', () => ref.score >= 9999);
    achievementSystem.check('streak_10', () => ref.streak >= 10);
    achievementSystem.check('streak_25', () => ref.streak >= 25);
    achievementSystem.check('streak_50', () => ref.streak >= 50);
    const currentSpeed = parseFloat(speedLabel(this.tickCount, ref.freezeEnd > Date.now()));
    achievementSystem.check('speed_2x', () => currentSpeed >= 2.0);
    achievementSystem.check('speed_3x', () => currentSpeed >= 3.0);
    achievementSystem.check('shield_5', () => (this._shieldCollected ?? 0) >= 5);
    achievementSystem.check('freeze_5', () => (this._freezeCollected ?? 0) >= 5);
    achievementSystem.check('secret_speed_run', () => ref.score >= 500 && currentSpeed >= 3.0);
  }

  private checkStageProgress(player: 1 | 2): void {
    const ref = player === 1 ? this.p1 : this.p2;
    if (this.config.mode === "evolve" && ref.stageProgress >= GAME.STAGE_TAPS_NEEDED && ref.gridStage < STAGES.length - 1) ref.pendingStageUpdate = true;
  }

  private triggerCellAnim(player: 1 | 2, idx: number, anim: "pop" | "shake"): void {
    const ref = player === 1 ? this.p1 : this.p2;
    ref.anim[idx] = anim;
    this.emit({ type: "cellAnim", player, idx, anim });
    this.scheduleTimeout(() => { if (ref.anim[idx] === anim) { ref.anim = { ...ref.anim }; delete ref.anim[idx]; } }, GAME.CELL_ANIM_MS);
  }

  handleHoldStart(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    (cell as HoldCell).holdStart = Date.now();
    const key = `${player}_${idx}`;
    if (this.holdTimers.has(key)) {
      this.removeDeltaTimer(`hold_${key}`);
      this.holdTimers.delete(key);
    }
    const gen = ++this.holdGeneration;
    this.addDeltaTimer(`hold_${key}`, GAME.HOLD_TIMEOUT_MS, () => {
      const entry = this.holdTimers.get(key);
      if (!entry || entry.generation !== gen || entry.cell.clicked) return;
      (entry.cell as HoldCell).holdStart = undefined;
      this.dirty = true;
      this.triggerCellAnim(entry.player, entry.cell.idx, "shake");
      this.emitSnapshot();
      this.holdTimers.delete(key);
    });
    this.holdTimers.set(key, { cell, player, generation: gen });
    this.dirty = true;
    this.emitSnapshot();
  }

  handleHoldEnd(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    if (this.phase !== "playing") return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive) return;
    const cell = ref.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || cell.type !== "hold") return;
    const key = `${player}_${idx}`;
    const entry = this.holdTimers.get(key);
    if (entry) { this.removeDeltaTimer(`hold_${key}`); this.holdTimers.delete(key); }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[ref.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const elapsed = Date.now() - ((cell as HoldCell).holdStart ?? Date.now());
    if (elapsed >= (cell as HoldCell).holdRequired) {
      cell.clicked = true; this.triggerCellAnim(player, idx, "pop");
      this.emit({ type: "sound", name: "powerup" });
      const mult = Date.now() < ref.multiplierEnd ? 2 : 1;
      const nextStreak = ref.streak + 1;
      ref.score += (mult * 2) + calculateStreakBonus(nextStreak); ref.streak = nextStreak; ref.stageProgress += 1;
      this.checkStageProgress(player);
      this.emit({ type: "toast", message: "≡ƒÆ¬ Hold! +2" });
      if (ref.active.every(c => c.clicked || (c.type as string) === "void")) { ref.cells = activeToCellsP(ref.active, pat); this.emitSnapshot(); return; }
    } else { (cell as HoldCell).holdStart = undefined; this.triggerCellAnim(player, idx, "shake"); }
    ref.cells = activeToCellsP(ref.active, pat);
    this.emitSnapshot();
  }

  activateStoredFreeze(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedFreezeCharges <= 0) return;
    ref.storedFreezeCharges -= 1;
    ref.freezeEnd = Math.max(ref.freezeEnd, Date.now()) + 15000;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: "Γ¥ä Freeze activated!" });
    this.emitSnapshot();
  }

  activateStoredShield(player: 1 | 2): void {
    if (this._isDisposed) return;
    const ref = player === 1 ? this.p1 : this.p2;
    if (!ref.alive || ref.storedShieldCharges <= 0) return;
    ref.storedShieldCharges -= 1;
    ref.shieldCount += 1;
    ref.shield = true;
    const stored = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
    this.config.storage?.saveStoredPowerups({ freeze: ref.storedFreezeCharges, shield: ref.storedShieldCharges, mult: stored.mult, heart: stored.heart });
    this.emit({ type: "toast", message: `≡ƒ¢í Shield ├ù${ref.shieldCount}!` });
    this.emitSnapshot();
  }

  devForceStage(stage: number): void {
    const validPatterns = EVOLVE_PATTERNS.map((p, i) => ({ p, i })).filter(({ p }) => p.minStage <= stage);
    const pick = validPatterns[Math.floor(this.rng() * validPatterns.length)];
    this.p1.gridStage = stage; this.p1.stageProgress = 0; this.p1.patternIdx = pick?.i ?? 0;
    this.p2.gridStage = stage; this.p2.stageProgress = 0; this.p2.patternIdx = pick?.i ?? 0;
    this.emitSnapshot();
  }

  devForcePattern(idx: number): void {
    this.p1.patternIdx = idx; this.p2.patternIdx = idx;
    const pat = EVOLVE_PATTERNS[idx] ?? EVOLVE_PATTERNS[0];
    const rareColor = this.rareMode.active ? this.rareMode.color : undefined;
    const rareShape = this.rareMode.active ? this.rareMode.shape : undefined;
    this.p1.active = spawnActive(this.rng, this.p1.gridStage, this.p1.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p1.cells = activeToCellsP(this.p1.active, pat);

    this.p2.active = spawnActive(this.rng, this.p2.gridStage, this.p2.health, pat, this.config.mode === "evolve", rareColor, rareShape, this.tickCount, this.devGodMode);
    this.p2.cells  = activeToCellsP(this.p2.active, pat);
    this.emitSnapshot();
  }

  devForceRare(r: { color: string; cssColor: string; shape?: CellShape; emoji?: string } | null): void {
    if (!r) this.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
    else { this.rareMode = { active: true, color: r.color, cssColor: r.cssColor, turnsLeft: 10, shape: r.shape ?? "circle", emoji: r.emoji ?? "" }; this.emit({ type: "rareStart", color: r.color, cssColor: r.cssColor }); this.emit({ type: "sound", name: "rareStart" }); }
    this.emitSnapshot();
  }

  devSetGodMode(v: boolean): void { this.devGodMode = v; }
  devSetFreezeTime(v: boolean): void { this.devFreezeTime = v; }
  devSetRotationSpeed(v: number): void { this.devRotationSpeed = Math.max(0.1, v); }
  devSpawnPowerup(type: "shield" | "freeze" | "heart"): void { this.devForcedPwr = type; }
  getDevRotationSpeed(): number { return this.devRotationSpeed; }

  devSpawnSpecialCell(player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number): void {
    const target = player === 1 ? this.p1 : this.p2;
    if (!target.alive) return;
    const slot = idx !== undefined ? idx : Math.floor(this.rng() * Math.max(target.active.length, 1));
    const existing = target.active[slot];
    if (existing) {
      const cellType = type === "rare"
        ? (this.rareMode.active ? this.rareMode.color : "purple")
        : type;
      const mutable = existing as Record<string, unknown>;
      mutable.type = cellType;
      if (type === "ice") { mutable.iceCount = 3; }
      if (type === "hold") { mutable.holdRequired = 3000; mutable.spawnedAt = Date.now(); }
      if (type === "bomb") { mutable.expiresAt = Date.now() + 3000; }
    }
    this.emitSnapshot();
  }

  devTriggerBotTap(player: 1 | 2, idx: number, dustCost = 3): void {
    this.emit({ type: "botTap", player, idx, dustCost });
  }

  devToggleBotAssist(player: 1 | 2, enabled: boolean): void {
    this.setBotAssist(player, enabled);
  }

  updatePerformanceMetrics(frameTime: number): void {
    const fps = 1000 / Math.max(frameTime, 1);
    if (this.fpsHistory.length < 60) { this.fpsHistory.push(fps); } else { this.fpsHistory[this.fpsIdx] = fps; this.fpsIdx = (this.fpsIdx + 1) % 60; }
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (!this.autoLowQuality && avgFps < this.lowQualityThreshold) {
      this.autoLowQuality = true;
      document.documentElement.style.setProperty('--particles-enabled', '0');
      document.documentElement.style.setProperty('--motion-scale', '0.5');
      this.emit({ type: "qualityDowngrade", reason: "fps-drop", avgFps });
    } else if (this.autoLowQuality && avgFps > 50) {
      this.autoLowQuality = false;
      document.documentElement.style.setProperty('--particles-enabled', '1');
      document.documentElement.style.setProperty('--motion-scale', '1');
      this.emit({ type: "qualityUpgrade", avgFps });
    }
  }

  getAutoLowQuality(): boolean { return this.autoLowQuality; }

  submitScoreToLeaderboard(score: number): void {
    if (this._isDisposed) return;
    scoreSync.queue(score, this.config.mode, this.tickCount);
  }

  async generateChallengeUrl(): Promise<string> {
    return challengeLink.generate(this.p1.score, this.gameSeed.toString(), this.p1.health);
  }

  getSnapshot(): GameSnapshot {
    // Guard against uninitialized engine
    if (!this.p1 || !this.p2) {
      return {
        tick: 0, evolveTick: 0, gameSeed: 0,
        p1: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        p2: { cells: Array(25).fill('inactive'), active: [], score: 0, streak: 0, alive: false, anim: {}, health: 0, shield: false, shieldCount: 0, freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0, patternIdx: 0, storedFreezeCharges: 0, storedShieldCharges: 0, nextShuffleTick: 0 },
        cellShape: 'square', rareMode: { active: false, color: '', cssColor: '', turnsLeft: 0, shape: 'circle', emoji: '' },
        spinLevel: 0, paused: false, phase: 'playing',
        grid: { cols: 3, rows: 3, mask: null }, spinCfg: null, devRotationSpeed: 1,
        bossEvent: null, activeBomb: null, isInverted: false, isBlackout: false,
      } as GameSnapshot;
    }
    const pat = this.config.mode === "evolve" ? (EVOLVE_PATTERNS[this.p1.patternIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
    const cloneActive = (active: ActiveCell[]): ActiveCell[] => active.map(c => ({ ...c }));

    // Cache mask array — only re-copy when the source reference changes
    if (pat.mask !== this._cachedMaskSrc) {
      this._cachedMaskSrc = pat.mask ?? null;
      this._cachedMask = pat.mask ? [...pat.mask] : null;
    }

    // Memoize spinCfg — only recompute when spinLevel or gameSeed changes
    let spinCfg: { duration: number; direction: 1 | -1 } | null = null;
    if (this.config.mode === "evolve" && this.spinLevel >= 3) {
      if (this._cachedSpinLevel !== this.spinLevel || this._cachedSpinSeed !== this.gameSeed || this._cachedRotationSpeed !== this.devRotationSpeed) {
        const cfg = getSpinConfig(this.spinLevel, this.gameSeed);
        this._cachedSpinCfg = { ...cfg, duration: cfg.duration * this.devRotationSpeed };
        this._cachedSpinLevel = this.spinLevel;
        this._cachedSpinSeed = this.gameSeed;
        this._cachedRotationSpeed = this.devRotationSpeed;
      }
      spinCfg = this._cachedSpinCfg;
    } else {
      this._cachedSpinCfg = null;
      this._cachedSpinLevel = -1;
      this._cachedSpinSeed = -1;
    }

    return {
      tick:       this.tickCount,
      evolveTick: this.evolveTick,
      gameSeed:   this.gameSeed,
      p1:         { ...this.p1, cells: [...this.p1.cells], active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, cells: [...this.p2.cells], active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
      cellShape:  this.cellShape,
      rareMode:   { ...this.rareMode },
      spinLevel:  this.spinLevel,
      paused:     this.paused,
      phase:      this.phase,
      grid: { cols: pat.cols, rows: pat.rows, mask: this._cachedMask },
      spinCfg,
      devRotationSpeed: this.devRotationSpeed,
      bossEvent:  this.bossEvent ? { ...this.bossEvent } : null,
      activeBomb: this.activeBomb ? { ...this.activeBomb } : null,
      isInverted: this._isInverted,
      isBlackout: this._isBlackout,
    };
  }

  getSpinConfig(level: number): { duration: number; direction: 1 | -1 } { return getSpinConfig(level, this.gameSeed); }

  // Session methods removed — resume feature deleted

private triggerGameOver(winner: Winner): void {
    // Prevent double game over
    if (this._deathSlowdown || this.phase === "gameover") return;
    // Immediately set phase and emit game over events (logical end)
    this._deathSlowdown = true;
    this.hitPause(200); // Brief freeze on death
    this.phase = "gameover";
    this.emitSnapshot();
    this.emit({ type: "phaseChange", phase: "gameover" });
    this.emit({ type: "gameOver", winner });

    // Mode win achievements
    if (winner === "p1" || winner === "tie") {
      if (this.config.mode === "classic") achievementSystem.unlock('classic_win');
      if (this.config.mode === "evolve") achievementSystem.unlock('evolve_win');
    }

    // Game count achievements — read current count; hook layer handles the localStorage increment
    const gamesPlayed = Math.max(0, Math.min(99999, parseInt(localStorage.getItem('dtp-games-played') || '0') || 0)) + 1;
    achievementSystem.check('games_50', () => gamesPlayed >= 50);
    achievementSystem.check('games_200', () => gamesPlayed >= 200);

    // Perfect round — no damage taken
    achievementSystem.check('perfect_round', () => !this._tookDamage && this.tickCount > 100);

    // ORDERING DEPENDENCY: achievement checks MUST happen before counter resets.
    // games_50/games_200/perfect_round read counters that are zeroed below.
    // If you move resets above this line, those achievements will always see 0.

    // Reset per-game counters
    this._shieldCollected = 0;
    this._freezeCollected = 0;
    this._purpleTaps = 0;
    this._tookDamage = false;

    // Death slow-motion: visually slow for 600ms before cleanup
    if (this._deathCleanupTimer) clearTimeout(this._deathCleanupTimer);
    this._deathCleanupTimer = setTimeout(() => {
      this._deathCleanupTimer = null;
      if (this.phase !== 'gameover') return; // New game started during cleanup window
      this._deathSlowdown = false;
      this.tapBuffer = { 1: null, 2: null };
      this.holdTimers.clear();
      this.clearAllDeltaTimers();
      this.stop();
      // Only p1's charges are persisted — p2 charges are ephemeral (default 0, never saved).
      const cur = this.config.storage?.loadStoredPowerups() ?? { freeze: 0, shield: 0, mult: 0, heart: 0 };
      this.config.storage?.saveStoredPowerups({
        freeze: Math.max(0, this.p1.storedFreezeCharges ?? 0),
        shield: Math.max(0, this.p1.storedShieldCharges ?? 0),
        mult: cur.mult,
        heart: cur.heart,
      });
    }, 600);
    analytics.track('game_over', { score: this.p1.score, mode: this.config.mode, winner });
    this.dda.reset(this._config.grid.spawnRateMs);
    if (!this.daily.isTodayComplete()) {
      this.daily.markComplete(this.p1.score, this.tickCount);
      // daily_master unlock moved to useDailyProgress — only fires when checkObjective confirms completion
    }
  }

  startBot(): void { this._bot.start(this.config.mode, this.config.botAssist); }

  stopBot(): void { this._bot.stop(); }

  isBotActive(): boolean { return this._bot.isActive(); }

  setBotAssist(player: 1 | 2, enabled: boolean): void {
    this._bot.setAssist(player, enabled);
    if (player === 1 && enabled) this._bot.start(this.config.mode, this.config.botAssist);
  }

  getBotAssistActive(): { 1: boolean; 2: boolean } { return this._bot.getAssistState(); }
}

```

## FILE: engine/subsystems/TickProcessor.ts
```typescript
import { GAME } from "../../config/difficulty";
import { BALANCE } from "../../config/gameBalance";
import { EVOLVE_PATTERNS, RARE_COLORS } from "../../config/gridPatterns";
import { logError } from "../../utils/devLog";
import { haptics } from "../../utils/haptics";
import { errorTracker } from "../../utils/error-tracker";
import { bossEngine } from "../../utils/boss-engine";
import { rhythmFeedback } from "../../utils/feedback-rhythm";
import { spawnActive, activeToCellsP, pickPattern, pickCellShape } from "./CellLifecycle";
import {
  getNextBossEventType, getBossDuration, getBossLabel, getBossDoneLabel,
  getNextBossTriggerScore, shouldTriggerShieldBoss,
} from "./EventOrchestrator";
import type { ActiveCell, CellShape, GameConfig, GameEvent, GameSnapshot, PlayerState, RareColorMode, Winner, BombCell, BossEvent, NumPlayers } from "../types";

export interface TickContext {
  config: GameConfig;
  phase: GameSnapshot["phase"];
  tickCount: number;
  evolveTick: number;
  cellShape: CellShape;
  rareMode: RareColorMode;
  spinLevel: number;
  p1: PlayerState;
  p2: PlayerState;
  bossEvent: BossEvent | null;
  _bossActive: boolean;
  _isInverted: boolean;
  _isBlackout: boolean;
  nextBossTriggerScore: number;
  activeBomb: { idx: number; expiresAt: number; player: 1 | 2 } | null;
  dirty: boolean;
  _tickSoundCounter: number;
  _lastTickTs: number;
  now: number; // Cached Date.now() for the current tick
  numPlayers: NumPlayers;
  _deltaTimers: Array<{ id: string; remaining: number; duration: number; callback: () => void }>;
  devGodMode: boolean;
  devFreezeTime: boolean;
  devForcedPwr: "shield" | "freeze" | "heart" | null;
  dda: { recordAttempt(success: boolean, reaction: number, miss: boolean): void; spawnRate: number };

  emit(event: GameEvent): void;
  _flushTapBuffer(player: 1 | 2): void;
  checkStageProgress(player: 1 | 2): void;
  triggerGameOver(winner: Winner): void;
  scheduleTimeout(cb: () => void, ms: number): ReturnType<typeof setTimeout>;
  addDeltaTimer(id: string, durationMs: number, callback: () => void): void;
  removeDeltaTimer(id: string): void;
  readonly rng: () => number;
}

const _slotsCache = new WeakMap<{ cols: number; rows: number; mask: number[] | null }, Set<number>>();

export class TickProcessor {
  processTick(ctx: TickContext): void {
    try {
    if (ctx.phase !== "playing") return;
    const now = performance.now();
    const delta = Math.min(now - ctx._lastTickTs, 100);
    ctx._lastTickTs = now;
    // Snapshot current timers; callbacks may add/remove via addDeltaTimer/removeDeltaTimer
    const snapshot = [...ctx._deltaTimers];
    const expiredCallbacks: Array<() => void> = [];
    const kept: typeof ctx._deltaTimers = [];

    for (const timer of snapshot) {
      timer.remaining -= delta;
      if (timer.remaining <= 0) {
        expiredCallbacks.push(timer.callback);
      } else {
        kept.push(timer);
      }
    }

    // Fire expired callbacks (may modify ctx._deltaTimers via add/removeDeltaTimer)
    for (const cb of expiredCallbacks) cb();

    // After callbacks: newly added timers are those NOT in the snapshot (by reference)
    const snapshotSet = new Set(snapshot);
    const newlyAdded = ctx._deltaTimers.filter(t => !snapshotSet.has(t));

    // kept = non-expired from snapshot MINUS any removed by callbacks via removeDeltaTimer
    const currentSet = new Set(ctx._deltaTimers);
    ctx._deltaTimers = [...kept.filter(t => currentSet.has(t)), ...newlyAdded];

    // If a delta timer callback triggered game over, bail out of the rest of the tick
    if (ctx.phase !== "playing") return;

    const mode = ctx.config.mode;
    ctx._flushTapBuffer(1);
    if (ctx.numPlayers === 2) ctx._flushTapBuffer(2);
    ctx.evolveTick += 1;
    if (mode === "evolve") ctx.cellShape = pickCellShape(ctx.evolveTick);

    if (mode === "evolve") {
      if (ctx.rareMode.active) {
        ctx.rareMode.turnsLeft -= 1;
        if (ctx.rareMode.turnsLeft <= 0) {
          ctx.rareMode = { active: false, color: "", cssColor: "", turnsLeft: 0, shape: "circle", emoji: "" };
          ctx.emit({ type: "toast", message: "🟣 Back to Purple!" });
        }
      } else {
        // Rare color events — already inside mode === "evolve" guard
        const s1 = ctx.p1.score;
        const { triggerInterval, warnThreshold, minScore, modCheck, chance, minTurns, bonusTurns } = BALANCE.rare;
        if (
          s1 > 0 &&
          (s1 % triggerInterval) === (triggerInterval - warnThreshold)
        ) {
          ctx.emit({ type: "toast", message: "⚠️ Danger color changing soon!" });
        }
        if (s1 >= minScore && s1 % 50 < modCheck && ctx.rng() < chance) {
          const pick = RARE_COLORS[Math.floor(ctx.rng() * RARE_COLORS.length)];
          ctx.rareMode = { active: true, color: pick.color, cssColor: pick.cssColor, turnsLeft: minTurns + Math.floor(ctx.rng() * bonusTurns), shape: pick.shape, emoji: pick.emoji };
          ctx.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          ctx.emit({ type: "sound", name: "rareStart" });
          ctx.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });
        }
      }
    }

    const players: Array<{ ref: PlayerState; pi: 0 | 1 }> = [{ ref: ctx.p1, pi: 0 }, { ref: ctx.p2, pi: 1 }];
    for (const { ref, pi } of players) {
      if (!ref.alive || (pi === 1 && ctx.numPlayers === 1)) continue;
      if (ref.pendingStageUpdate) {
        ref.pendingStageUpdate = false; ref.gridStage += 1; ref.stageProgress = 0;
        if (ctx.config.inputMode !== 'keys') {
          ctx.spinLevel += 1;
        }
        ctx.emit({ type: "sound", name: "levelup" });
        ctx.emit({ type: "levelUp", player: (pi + 1) as 1 | 2, stage: ref.gridStage });
        haptics.levelUp();
      }
      const curStage = ref.gridStage;
      const patIdx = ref.patternIdx;
      const pat = mode === "evolve" ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      if (!pat || pat.cols === 0) { logError("[DTP-002]"); continue; }
      let validSlots = _slotsCache.get(pat);
      if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }
      const dangerColor = ctx.rareMode.active ? ctx.rareMode.color : "purple";
      ctx._isInverted = ctx.bossEvent?.type === "inversion" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      ctx._isBlackout  = ctx.bossEvent?.type === "blackout"  && ctx.now < (ctx.bossEvent?.endsAt ?? 0);

      const player = (pi + 1) as 1 | 2;

      ref.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        // All 7 special types — immune to expiry damage. This list covers all spawnable
        // types from CellLifecycle.spawnActive(). GameEngine._processTap has a separate,
        // intentionally narrower list for tap handling (4 collectible types); ice/hold/bomb
        // have their own dedicated tap blocks. Both must stay in sync with CellLifecycle.
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold","bomb"].includes(c.type);
        const isMiss = ctx._isInverted ? c.type === "purple" : c.type !== dangerColor && !isPwr;
        if (isMiss) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (!ctx.devGodMode) {
            if (ref.shieldCount > 0) { ctx.dda.recordAttempt(false, 0, false); ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
            else {
              ctx.dda.recordAttempt(false, 0, true);
              ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
              ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
              if (ref.health <= 0) {
                ref.alive = false;
                const other = ctx.numPlayers === 2 ? (pi === 0 ? ctx.p2.alive : ctx.p1.alive) : false;
                ctx.triggerGameOver(ctx.numPlayers === 1 ? null : other ? (pi === 0 ? "p2" : "p1") : "tie");
              }
            }
          }
          haptics.damage();
          if (ref.streak >= 5) ctx.emit({ type: "toast", message: `🔥 ${ref.streak} streak lost!` });
          ref.streak = 0;
        }
      });
      if (!ref.alive) continue;

if (ref.active.some(c => !c.clicked && c.type === "ice")) { ref.cells = activeToCellsP(ref.active, pat); continue; }
      const nextPatIdx = mode === "evolve" ? pickPattern(ctx.rng, curStage, patIdx, ref.score) : 0;
      ref.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve" ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0]) : { cols: 3, rows: 3, mask: null as number[] | null };
      const rareColor = ctx.rareMode.active ? ctx.rareMode.color : undefined;
      const rareShape = ctx.rareMode.active ? ctx.rareMode.shape : undefined;
      const spawnStage = mode === "evolve" ? curStage : Math.min(Math.floor(ctx.tickCount / 12), 7);
      const newActive = spawnActive(ctx.rng, spawnStage, ref.health, nextPat, mode === "evolve", rareColor, rareShape, ctx.tickCount, ctx.devGodMode);
      if (ctx.devForcedPwr && newActive.length > 0) {
        newActive[0] = { ...newActive[0], type: (ctx.devForcedPwr === "heart" ? "medpack" : ctx.devForcedPwr) } as ActiveCell;
        if (pi === 0) ctx.devForcedPwr = null;
      }
      ref.active = newActive;
      ref.cells = activeToCellsP(newActive, nextPat);
      for (const c of newActive) {
        if (["medpack", "shield", "freeze", "multiplier"].includes(c.type)) {
          ref.anim[c.idx] = "pwr-drop";
          ctx.scheduleTimeout(() => { if (ref.anim[c.idx] === "pwr-drop") { ref.anim = { ...ref.anim }; delete ref.anim[c.idx]; } }, 600);
        }
      }
    }

    // Cell shuffle + boss event + bomb spawn
    if (mode === "evolve") {
      const stormActive = ctx.bossEvent?.type === "storm" && ctx.now < (ctx.bossEvent?.endsAt ?? 0);
      const shufflePat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
      if (stormActive) {
        ctx.p1.nextShuffleTick = 0;
        ctx.p2.nextShuffleTick = 0;
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      } else {
        if (ctx.p1.alive) this._tryShuffleCells(ctx, ctx.p1, shufflePat, 1);
        if (ctx.numPlayers === 2 && ctx.p2.alive) {
          const p2Pat = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
          this._tryShuffleCells(ctx, ctx.p2, p2Pat, 2);
        }
      }

      const effectiveScore = ctx.numPlayers === 2 ? ctx.p1.score + ctx.p2.score : ctx.p1.score;
      if (effectiveScore >= ctx.nextBossTriggerScore) this._triggerBossEvent(ctx);

      if (ctx.p1.alive) {
        const bombPat = EVOLVE_PATTERNS[ctx.p1.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p1, 1, bombPat);
      }
      if (ctx.numPlayers === 2 && ctx.p2.alive) {
        const bombPat2 = EVOLVE_PATTERNS[ctx.p2.patternIdx] ?? EVOLVE_PATTERNS[0];
        this._trySpawnBomb(ctx, ctx.p2, 2, bombPat2);
      }
    }

    if (shouldTriggerShieldBoss(ctx.p1.score, ctx._bossActive, ctx.bossEvent !== null, mode, ctx.rng)) {
      ctx._bossActive = true;
      bossEngine.activate(BALANCE.boss.shieldBaseHits + Math.floor(ctx.rng() * BALANCE.boss.shieldBonusHits));
    }

    ctx.tickCount += 1;
    if (ctx.phase === "playing" && ctx.tickCount >= GAME.HUMAN_LIMIT_TICK) { ctx.phase = "humanlimit"; ctx.emit({ type: "phaseChange", phase: "humanlimit" }); }
    if (ctx.tickCount > GAME.SURVIVAL_BONUS_START_TICK && ctx.tickCount % BALANCE.survival.interval === 0) {
      const bonus = ctx.tickCount > BALANCE.survival.lateThreshold ? BALANCE.survival.lateAmount : ctx.tickCount > BALANCE.survival.midThreshold ? BALANCE.survival.midAmount : BALANCE.survival.earlyAmount;
      const multBonus = Math.round(bonus * rhythmFeedback.state.multiplier);
      if (ctx.p1.alive) ctx.p1.score += multBonus;
      if (ctx.numPlayers === 2 && ctx.p2.alive) ctx.p2.score += multBonus;
      ctx.emit({ type: "toast", message: `🔵 Survival +${multBonus}!` });
    }
    ctx.dirty = true;
    ctx._tickSoundCounter++;
    if (ctx._tickSoundCounter % 4 === 0) {
      ctx.emit({ type: "sound", name: "tick" });
    }
    } catch (err) {
      logError("[TickProcessor] processTick crashed:", err);
      errorTracker.capture(err instanceof Error ? err : new Error(String(err)), { phase: 'processTick', tick: ctx.tickCount });
      ctx.emit({ type: "toast", message: "⚠️ Engine error — game ended" });
      try { ctx.triggerGameOver(null); } catch (inner) {
        logError("[TickProcessor] triggerGameOver failed in catch:", inner);
      }
    }
  }

  // Shuffle cells — 1-2 cells slide to adjacent empty positions
  private _tryShuffleCells(ctx: TickContext, ref: PlayerState, pat: { cols: number; rows: number; mask: number[] | null }, player: 1 | 2): void {
    if (ctx.config.mode !== "evolve" || ref.gridStage < 3) return;
    if (ctx.tickCount < ref.nextShuffleTick) return;

    ref.nextShuffleTick = ctx.tickCount + BALANCE.shuffle.minInterval + Math.floor(ctx.rng() * BALANCE.shuffle.bonusInterval);

    const { cols, rows } = pat;
    let validSlots = _slotsCache.get(pat);
    if (!validSlots) { validSlots = new Set(pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i)); _slotsCache.set(pat, validSlots); }

    const occupied = new Set<number>(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const empty = [...validSlots].filter(i => !occupied.has(i));
    if (empty.length === 0) return;

    const shuffleCount = 1 + (ctx.rng() < BALANCE.shuffle.secondShuffleChance ? 1 : 0);
    const candidates = ref.active.filter(c =>
      !c.clicked &&
      validSlots.has(c.idx) &&
      c.type !== "hold" &&
      c.type !== "ice" &&
      c.type !== "bomb"
    );

    if (candidates.length === 0) return;

    const moved: number[] = [];
    for (let i = 0; i < Math.min(shuffleCount, candidates.length); i++) {
      if (empty.length === 0) break;

      // Pick a candidate that hasn't been moved yet (retry up to candidates.length times)
      let cell: typeof candidates[number] | null = null;
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const cIdx = Math.floor(ctx.rng() * candidates.length);
        if (!moved.includes(candidates[cIdx].idx)) { cell = candidates[cIdx]; break; }
      }
      if (!cell) continue;

      const adjacent = this._getAdjacentSlots(cell.idx, cols, rows, validSlots)
        .filter(s => !occupied.has(s) && !moved.includes(s));
      const targetPool = adjacent.length > 0 ? adjacent : empty.filter(s => !moved.includes(s));
      if (targetPool.length === 0) continue;

      const toIdx = targetPool[Math.floor(ctx.rng() * targetPool.length)];

      const fromIdx = cell.idx;
      cell.idx = toIdx;
      occupied.delete(fromIdx);
      occupied.add(toIdx);
      const emptyI = empty.indexOf(toIdx);
      if (emptyI !== -1) empty.splice(emptyI, 1);
      empty.push(fromIdx);
      moved.push(toIdx);

      if (!ref.slideAnim) ref.slideAnim = {};
      const gen = (ref.slideAnim[toIdx]?.gen ?? -1) + 1;
      ref.slideAnim[toIdx] = { fromIdx, startMs: Date.now(), gen };

      ctx.scheduleTimeout(() => {
        // Only delete if no newer animation was placed at this index
        if (ref.slideAnim?.[toIdx]?.gen === gen) {
          ref.slideAnim = { ...ref.slideAnim }; delete ref.slideAnim[toIdx];
        }
        ctx.dirty = true;
      }, BALANCE.shuffle.slideCleanupMs);

      ctx.emit({ type: "cellShuffle", player, fromIdx, toIdx });
      ctx.emit({ type: "sound", name: "shuffle" });
    }

    if (moved.length > 0) {
      ref.cells = activeToCellsP(ref.active, pat);
      ctx.dirty = true;
    }
  }

  private _getAdjacentSlots(idx: number, cols: number, rows: number, validSlots: Set<number>): number[] {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const adj: number[] = [];
    if (row > 0)        { const n = idx - cols; if (validSlots.has(n)) adj.push(n); }
    if (row < rows - 1) { const n = idx + cols; if (validSlots.has(n)) adj.push(n); }
    if (col > 0)        { const n = idx - 1;    if (validSlots.has(n)) adj.push(n); }
    if (col < cols - 1) { const n = idx + 1;    if (validSlots.has(n)) adj.push(n); }
    return adj;
  }

  private _trySpawnBomb(ctx: TickContext, ref: PlayerState, player: 1 | 2, pat: { cols: number; rows: number; mask: number[] | null }): void {
    if (ctx.activeBomb) return;
    if (ref.score < BALANCE.bomb.minScore) return;
    if (ctx.rng() > BALANCE.bomb.spawnChance) return;

    const validSlots = pat.mask ?? Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    const occupied = new Set(ref.active.filter(c => !c.clicked).map(c => c.idx));
    const free = validSlots.filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const idx = free[Math.floor(ctx.rng() * free.length)];
    const expiresAt = Date.now() + BALANCE.bomb.fuseTimeMs;
    const bomb: BombCell = { idx, clicked: false, type: "bomb", expiresAt };
    ref.active = [...ref.active, bomb];
    ref.cells = activeToCellsP(ref.active, pat);
    ctx.activeBomb = { idx, expiresAt, player };
    ctx.dirty = true;
    ctx.emit({ type: "bombSpawn", player, idx, expiresAt });
    haptics.bomb();
    ctx.emit({ type: "sound", name: "bomb" });
    ctx.emit({ type: "toast", message: "💣 BOMB! Tap it!" });

    ctx.addDeltaTimer(`bomb_${player}_${idx}`, BALANCE.bomb.fuseTimeMs, () => {
      if (!ctx.activeBomb || ctx.activeBomb.idx !== idx || ctx.activeBomb.player !== player) return;
      const stillActive = ref.active.find(c => c.idx === idx && c.type === "bomb" && !c.clicked);
      if (!stillActive) { if (ctx.activeBomb?.idx === idx) ctx.activeBomb = null; return; }
      stillActive.clicked = true;
      ctx.activeBomb = null;
      if (!ctx.devGodMode) {
        if (ref.shieldCount > 0) { ref.shieldCount -= 1; ref.shield = ref.shieldCount > 0; }
        else {
          const dmg = ctx.config.mode === "evolve" ? 0.5 : 1;
          ref.health = Math.max(0, ref.health - dmg); ref.shield = false;
          ctx.emit({ type: "damage", player }); ctx.emit({ type: "shake", player });
          if (ref.health <= 0) {
            ref.alive = false;
            ctx.triggerGameOver(ctx.numPlayers === 1 ? null : (player === 1 ? "p2" : "p1"));
          }
        }
      }
      ctx.emit({ type: "bombExplode", player });
      ctx.emit({ type: "toast", message: "💥 Bomb exploded!" });
      // Use the pattern captured at spawn time (pat), not the current one,
      // because the grid may have changed during the fuse delay.
      ref.cells = activeToCellsP(ref.active, pat);
      ctx.dirty = true;
    });
  }

  private _triggerBossEvent(ctx: TickContext): void {
    const prevType = ctx.bossEvent?.type ?? null;
    const type = getNextBossEventType(prevType);
    const durationMs = getBossDuration(type);
    ctx.bossEvent = { type, endsAt: Date.now() + durationMs };
    ctx.nextBossTriggerScore = getNextBossTriggerScore(ctx.nextBossTriggerScore);
    ctx.emit({ type: "bossStart", bossType: type });
    ctx.emit({ type: "sound", name: "bossStart" });
    ctx.emit({ type: "toast", message: getBossLabel(type) });
    ctx.scheduleTimeout(() => {
      if (ctx.bossEvent?.type === type) {
        const completedType = type;
        ctx.bossEvent = null;
        ctx.dirty = true;
        ctx.emit({ type: "toast", message: getBossDoneLabel(completedType) });
        // Inversion survival achievement
        if (completedType === "inversion") {
          // Dynamic import to avoid circular dependency
          import('../../utils/achievements').then(m => m.achievementSystem.unlock('boss_inversion')).catch(() => {});
        }
      }
    }, durationMs);
  }
}

```

## FILE: engine/subsystems/CellLifecycle.ts
```typescript
import { GAME } from "../../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../../config/gridPatterns";
import { POWERUP_TABLE } from "../../config/powerupWeights";
import type { ActiveCell, CellType, CellShape } from "../types";

// PERF-006: Cache valid slots per pattern to avoid per-tick array allocation
const _slotsCache = new WeakMap<{ cols: number; rows: number; mask: number[] | null }, number[]>();

const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

function randCell(rng: () => number, tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (rng() < purpleChance) return "purple";
  return SAFE[Math.floor(rng() * SAFE.length)];
}

export function pickCellShape(tick: number): CellShape {
  const cycle = Math.floor(tick / 6) % 8;
  if (cycle === 0) return "square";
  if (cycle === 1) return "triangle";
  if (cycle === 2) return "circle";
  if (cycle === 3) return "roundedTriangle";
  if (cycle === 4) return "mixed";
  if (cycle === 5) return "triangle";
  if (cycle === 6) return "square";
  return "mixed";
}

export function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  const cells: CellType[] = new Array(25).fill("inactive");
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) cells[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked && c.idx >= 0 && c.idx < cells.length) cells[c.idx] = c.type; });
  return cells;
}

// Pre-computed base powerup table (health-independent portion)
const BASE_POWERUP_TABLE = POWERUP_TABLE.filter(p => p.type !== 'medpack');
const BASE_POWERUP_WEIGHT = BASE_POWERUP_TABLE.reduce((s, p) => s + p.weight, 0);
const MEDPACK_BASE_WEIGHT = POWERUP_TABLE.find(p => p.type === 'medpack')?.weight ?? 7;

export function spawnActive(
  rng: () => number,
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  rareShape?: CellShape,
  tick = 0,
  godMode = false
): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length - 1)];
  let validSlots = _slotsCache.get(pat);
  if (!validSlots) {
    validSlots = pat.mask ? [...pat.mask] : Array.from({ length: pat.cols * pat.rows }, (_, i) => i);
    _slotsCache.set(pat, validSlots);
  }
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5));
  const count = Math.max(1, minCount + Math.floor(rng() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  let powerup: CellType | null = null;
  const powerupEligible = isEvolve ? stage >= 2 : true;
  // Use pre-computed base table — only adjust medpack weight dynamically
  const medpackWeight = (!godMode && health < GAME.MAX_HEARTS) ? MEDPACK_BASE_WEIGHT + 10 : (godMode ? 0 : MEDPACK_BASE_WEIGHT);
  const totalWeight = BASE_POWERUP_WEIGHT + medpackWeight;
  if (powerupEligible && totalWeight > 0) {
    const roll = rng() * 100;
    if (roll < totalWeight) {
      let cursor = 0;
      // Check medpack first
      if (medpackWeight > 0) {
        cursor += medpackWeight;
        if (roll < cursor) { powerup = 'medpack' as CellType; }
      }
      if (!powerup) {
        for (const p of BASE_POWERUP_TABLE) {
          cursor += p.weight;
          if (roll < cursor) { powerup = p.type as CellType; break; }
        }
      }
    }
  }

  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 2) { // Special cells start at stage 2 (was 3 — reduces difficulty spike)
    const r = rng();
    if (r < 0.12) evolveSpecial = "ice"; // Only ice — hold cells removed (contradict tap-based core)
  }

  return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup } as ActiveCell;
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice", iceCount: 2 + Math.floor(rng() * 3) };
    }
    const baseType = randCell(rng, tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor, shape: rareShape } as ActiveCell;
    return { idx, clicked: false, type: baseType } as ActiveCell;
  });
}

export function pickPattern(rng: () => number, stage: number, lastIdx: number, score: number): number {
  const valid = EVOLVE_PATTERNS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.minStage <= stage)
    .filter(({ p }) => {
      if (score < 20)  return p.cols <= 2 && p.rows <= 2;
      if (score < 50)  return p.cols <= 3 && p.rows <= 3;
      if (score < 120) return p.cols <= 3 && p.rows <= 4;
      if (score < 250) return p.cols <= 4 && p.rows <= 4;
      return true;
    });
  if (valid.length <= 1) return valid[0]?.i ?? 0;
  const filtered = valid.filter(({ i }) => i !== lastIdx);
  const pick = filtered[Math.floor(rng() * filtered.length)];
  return pick?.i ?? valid[0].i;
}

```

## FILE: components/Cell/index.tsx
```tsx
// components/Cell/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ActiveCell } from '../../engine/types';
import { getRareModeConfig } from '../../config/gridPatterns';
import { Icon } from '../UI/Icon';

interface CellProps {
  cell: ActiveCell;
  onTap: (idx: number) => void;
  onHoldStart?: (idx: number) => void;
  onHoldEnd?: (idx: number) => void;
  colorblindMode?: string;
  showKeyLabel?: boolean;
  keyLabel?: string;
  isPressing?: boolean;
  botPulse?: boolean;
  botDustCost?: number;
  holdProgress?: number;
  bombFuse?: number;
}

function BombTimer({ expiresAt }: { expiresAt: number }) {
  const TOTAL_MS = 2000; // matches BALANCE.bomb.fuseTimeMs
  const [ms, setMs] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setMs(remaining);
      if (remaining > 0) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [expiresAt]);

  const pct = Math.max(0, Math.min(1, ms / TOTAL_MS));
  const R = 20;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - pct); // drains clockwise
  const isUrgent = pct < 0.35;

  return (
    <svg className="bomb-ring" viewBox="0 0 52 52" width="100%" height="100%">
      {/* Track */}
      <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      {/* Draining arc */}
      <circle
        cx="26" cy="26" r={R}
        fill="none"
        stroke={isUrgent ? "#ff2200" : "#ff6600"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.06s linear, stroke 0.3s ease" }}
      />
      {/* Center label */}
      <text
        x="26" y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#fff"
        fontFamily="monospace"
        style={{ filter: isUrgent ? "drop-shadow(0 0 4px #ff2200)" : "none" }}
      >
        {(ms / 1000).toFixed(1)}
      </text>
    </svg>
  );
}

export default React.memo(function Cell({
  cell,
  onTap,
  onHoldStart,
  onHoldEnd,
  colorblindMode = '',
  showKeyLabel = false,
  keyLabel = '',
  isPressing = false,
  botPulse = false,
  botDustCost,
  holdProgress,
  bombFuse,
}: CellProps) {

  const isBomb = cell.type === 'bomb';
  const bombUrgent = isBomb && (bombFuse !== undefined ? bombFuse < 700 : false); // last 700ms = urgent
  const isClicked = cell.clicked;
  const shape = cell.shape || 'circle';
  const shapeClass = `cell-shape--${shape}`;

  const rareConfig = cell.shape && colorblindMode !== '' 
    ? getRareModeConfig(cell.type) 
    : null;

  const isHold = cell.type === 'hold';
  const isIce = cell.type === 'ice';

  // ── Touch feedback: immediate visual response on pointer down ──
  const [isTouched, setIsTouched] = useState(false);

  // ── ClickSpark: canvas spark burst on tap ──
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<{ x: number; y: number; angle: number; startTime: number }[]>([]);

  // Spark rendering is driven by emitSparks — no idle RAF loop needed
  useEffect(() => {
    return () => { if (sparkRafRef.current) cancelAnimationFrame(sparkRafRef.current); };
  }, []);

  const sparkRafRef = useRef(0);
  const emitSparks = useCallback((e: React.PointerEvent) => {
    const canvas = sparkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const count = 8;
    sparksRef.current.push(...Array.from({ length: count }, (_, i) => ({
      x, y, angle: (2 * Math.PI * i) / count, startTime: now,
    })));
    // Restart RAF loop if it was idle
    if (!sparkRafRef.current && ctx) {
      const SPARK_DURATION = 350;
      const draw = (ts: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sparksRef.current = sparksRef.current.filter(s => {
          const elapsed = ts - s.startTime;
          if (elapsed >= SPARK_DURATION) return false;
          const p = elapsed / SPARK_DURATION;
          const eased = p * (2 - p);
          const dist = eased * 14;
          const len = 8 * (1 - eased);
          ctx.strokeStyle = cell.type === 'purple' ? '#ff2200' : '#c026d3';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - eased;
          ctx.beginPath();
          ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
          ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
          ctx.stroke();
          ctx.globalAlpha = 1;
          return true;
        });
        if (sparksRef.current.length > 0) sparkRafRef.current = requestAnimationFrame(draw);
        else sparkRafRef.current = 0;
      };
      sparkRafRef.current = requestAnimationFrame(draw);
    }
  }, [cell.type]);

  // ── Ice hit flash tracking ──
  const prevIceCount = useRef(cell.type === 'ice' ? cell.iceCount : undefined);
  const [iceFlash, setIceFlash] = useState(false);
  useEffect(() => {
    if (cell.type === 'ice' && prevIceCount.current !== undefined && (cell.iceCount ?? 0) < prevIceCount.current) {
      setIceFlash(true);
      const t = setTimeout(() => setIceFlash(false), 200);
      prevIceCount.current = cell.iceCount;
      return () => clearTimeout(t);
    }
    if (cell.type === 'ice') prevIceCount.current = cell.iceCount;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell.type === 'ice' ? cell.iceCount : false]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isClicked) return;
    setIsTouched(true); // Instant visual feedback
    emitSparks(e);
    if (isHold && onHoldStart) {
      onHoldStart(cell.idx);
    } else {
      onTap(cell.idx);
    }
  };

  const handlePointerUp = () => {
    setIsTouched(false);
    if (isHold && onHoldEnd) {
      onHoldEnd(cell.idx);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap(cell.idx);
    }
  };

  const cbClass = colorblindMode ? `cb-pattern cb-${cell.type}` : '';

  return (
    <div
      className={`
        cell
        ${cell.type || ''}
        ${isClicked ? 'clicked inactive' : ''}
        ${shapeClass}
        ${cell.shape ? 'rare-danger' : ''}
        ${isPressing || isTouched ? 'pressing' : ''}
        ${botPulse ? 'bot-assisted' : ''}
        ${bombUrgent ? 'bomb--urgent' : ''}
        ${cbClass}
      `.trim()}
      data-testid="grid-cell"
      role="gridcell"
      tabIndex={isClicked ? -1 : 0}
      aria-label={`${cell.type === 'purple' ? 'Danger: purple cell' : cell.type === 'bomb' ? 'Bomb cell' : `Tap ${cell.type} cell`}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={() => { setIsTouched(false); if (isHold && onHoldEnd) onHoldEnd(cell.idx); }}
      onKeyDown={handleKeyDown}
      data-shape={shape}
      style={{ '--cb-type': cell.type } as React.CSSProperties}
    >
      {/* ClickSpark canvas overlay */}
      <canvas
        ref={sparkCanvasRef}
        width={120}
        height={120}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
      />

      {/* Shape background layer */}
      <div className={`cell-shape-overlay ${shapeClass}`} />

      {/* Ice hit flash overlay */}
      {iceFlash && <div className="ice-hit-flash" />}

      {/* Powerup / Special icons */}
      <div className="cell-icon">
        {(cell.type === 'medpack' || cell.type === 'shield' || cell.type === 'freeze' || cell.type === 'multiplier') ? (
          <span className="cell-icon-spring">
            {cell.type === 'medpack' && <Icon name="medpack" size={26} />}
            {cell.type === 'shield' && <Icon name="shield" size={26} />}
            {cell.type === 'freeze' && <Icon name="freeze" size={26} />}
            {cell.type === 'multiplier' && <Icon name="multiplier" size={26} />}
          </span>
        ) : null}
        {isHold && <Icon name="clock" size={22} />}
        {isIce && (
          <div className="multi-tap-visual" aria-hidden="true">
            <div className="multi-tap-core"><Icon name="ice" size={20} /></div>
            <div className="multi-tap-count">{cell.iceCount || 1}</div>
            <div className="multi-tap-pips">
              {Array.from({ length: Math.max(1, Math.min(4, cell.iceCount || 1)) }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
        )}
        {cell.type === 'bomb' && (
          <BombTimer expiresAt={cell.expiresAt} />
        )}
      </div>

      {/* Ice pips (bottom) */}
      {isIce && cell.iceCount !== undefined && (
        <div className="ice-pip-container" aria-label={`Ice: ${cell.iceCount} taps remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`ice-pip ${i < cell.iceCount! ? 'active' : 'spent'}`} />
          ))}
        </div>
      )}

      {/* Hold cell SVG progress ring */}
      {isHold && holdProgress !== undefined && (
        <svg className="hold-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
          <path className="hold-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path
            className="hold-fill"
            strokeDasharray={`${holdProgress * 100}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      )}

      {/* Bomb escalation ring */}
      {isBomb && bombFuse !== undefined && (
        <div
          className="bomb-timer-ring"
          style={{ '--bomb-remaining': `${Math.max(0, bombFuse / 3000)}` } as React.CSSProperties}
        />
      )}

      {/* Rare danger symbol */}
      {cell.shape && (
        <span className="rare-danger-symbol" aria-label="Rare danger">
          <Icon name="warning" size={20} />
        </span>
      )}

      {botPulse && (
        <div className="bot-tap-fx" aria-hidden="true">
          <span className="bot-tap-orbit" />
          <span className="bot-tap-label">BOT</span>
        </div>
      )}

      {botDustCost !== undefined && (
        <div className="bot-dust-marker" aria-label={`Bot spent ${botDustCost} dust`}>
          -{botDustCost}
        </div>
      )}

      {/* Rare mode emoji for colorblind players */}
      {rareConfig && (
        <div className="cell-rare-emoji">
          {rareConfig.emoji}
        </div>
      )}

      {/* Keyboard label */}
      {showKeyLabel && keyLabel && (
        <div className="cell-key-label">{keyLabel}</div>
      )}
    </div>
  );
});

```

## FILE: components/HUD/GameArea.tsx
```tsx
import React, { useCallback, useMemo } from "react";
import type { GameSnapshot, GameMode } from "../../engine/types";
import type { ShopData } from "../../utils/shop-storage";
import { PwrBar } from "./PwrBar";
import { PlayerPanel } from "./PlayerPanel";
import { GridErrorBoundary } from "./GridErrorBoundary";
import { ShieldDrop } from "../Animations/ShieldDrop";
import { FreezeDrop } from "../Animations/FreezeDrop";
import { EnergyDrop } from "../Animations/EnergyDrop";
import { GameOver } from "../Screens/GameOver";

interface GameAreaProps {
  snapshot: GameSnapshot;
  screen: string;
  gameMode: GameMode;
  is2P: boolean;
  numPlayers: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  screenShake: boolean;
  shakeGrid1: boolean;
  shakeGrid2: boolean;
  heartAnimP1: boolean;
  heartAnimP2: boolean;
  best1: number;
  best2: number;
  engineWinner: "p1" | "p2" | "tie" | null;
  shareMsg: string;
  gameSeedState: number;
  dust: number;
  dustAtStart: number;
  gameOverProgress: number;
  p1Keys: string[];
  p2Keys: string[];
  inputMode: string;
  pressing1: Set<number>;
  pressing2: Set<number>;
  cbActive: boolean;
  cbFilter: string;
  shopData: ShopData;
  pwrToastP1: string | null;
  pwrToastP2: string | null;
  levelUpBadge: string | null;
  practiceMode: boolean;
  botAssistActive: { 1: boolean; 2: boolean };
  botTapHighlights: { 1: Record<number, number>; 2: Record<number, number> };
  scoreFloats: { id: number; player: 1 | 2; idx: number; amount: number }[];
  isFS: boolean;
  devHeatmap: Record<number, number>;
  onRestart: () => void;
  onStartGame: () => void;
  onTap: (player: 1 | 2, idx: number) => void;
  onHoldStart: (player: 1 | 2, idx: number) => void;
  onHoldEnd: (player: 1 | 2, idx: number) => void;
  onPause: () => void;
  onLeaderboard: () => void;
  onMenu: () => void;
  onActivateFreeze: (player: 1 | 2) => void;
  onActivateShield: (player: 1 | 2) => void;
  onToggleBot: (player: 1 | 2) => void;
}

export const GameArea = React.memo(function GameArea({
  snapshot, screen, gameMode, is2P, numPlayers, isPlaying: _isPlaying, reducedMotion,
  screenShake, shakeGrid1, shakeGrid2, heartAnimP1, heartAnimP2,
  best1, best2, engineWinner, shareMsg, gameSeedState,
  dust, dustAtStart, gameOverProgress,
  p1Keys, p2Keys, inputMode, pressing1, pressing2,
  cbActive, cbFilter, shopData, pwrToastP1, pwrToastP2,
  levelUpBadge, practiceMode, botAssistActive, botTapHighlights,
  scoreFloats, isFS, devHeatmap: _devHeatmap,
  onRestart: _onRestart, onStartGame, onTap, onHoldStart, onHoldEnd, onPause,
  onLeaderboard, onMenu,
  onActivateFreeze, onActivateShield, onToggleBot,
}: GameAreaProps) {
  const onTapP1 = useCallback((i: number) => onTap(1, i), [onTap]);
  const onHoldStartP1 = useCallback((i: number) => onHoldStart(1, i), [onHoldStart]);
  const onHoldEndP1 = useCallback((i: number) => onHoldEnd(1, i), [onHoldEnd]);
  const onActivateFreezeP1 = useCallback(() => onActivateFreeze(1), [onActivateFreeze]);
  const onActivateShieldP1 = useCallback(() => onActivateShield(1), [onActivateShield]);
  const onToggleBotP1 = useCallback(() => onToggleBot(1), [onToggleBot]);
  const onTapP2 = useCallback((i: number) => onTap(2, i), [onTap]);
  const onHoldStartP2 = useCallback((i: number) => onHoldStart(2, i), [onHoldStart]);
  const onHoldEndP2 = useCallback((i: number) => onHoldEnd(2, i), [onHoldEnd]);
  const onActivateFreezeP2 = useCallback(() => onActivateFreeze(2), [onActivateFreeze]);
  const onActivateShieldP2 = useCallback(() => onActivateShield(2), [onActivateShield]);
  const onToggleBotP2 = useCallback(() => onToggleBot(2), [onToggleBot]);

  const scoreFloatsP1 = useMemo(() => scoreFloats.filter(f => f.player === 1), [scoreFloats]);

  return (
    <div className="game-area">
      <GridErrorBoundary onRestart={() => { onMenu(); setTimeout(onStartGame, 100); }}>
        {snapshot?.isBlackout && screen === "playing" && (
          <div className="blackout-overlay" />
        )}
        <PwrBar ps={snapshot.p1} rareMode={snapshot.rareMode} />

        {screen === "gameover" && (
          <div className="go-overlay" data-testid="gameover">
            <GameOver
              p1Score={snapshot.p1.score}
              p2Score={snapshot.p2?.score || 0}
              best={gameMode === "classic" ? best1 : best2}
              winner={engineWinner}
              mode={gameMode}
              is2P={numPlayers === 2}
              shareMsg={shareMsg}
              gameSeed={gameSeedState || 0}
              tick={snapshot.tick}
              p1={snapshot.p1}
              onAgain={onStartGame}
              onLeaderboard={onLeaderboard}
              onMenu={onMenu}
              spinLevel={snapshot.spinLevel}
              isHumanLimit={snapshot.phase === "humanlimit"}
              dustEarned={Math.max(0, isNaN(dust - dustAtStart) ? 0 : dust - dustAtStart)}
              objectiveProgress={gameOverProgress}
            />
          </div>
        )}

        <ShieldDrop active={pwrToastP1?.includes("Shield") ?? false} />
        <FreezeDrop active={pwrToastP1?.includes("Freeze") ?? false} />
        <EnergyDrop active={pwrToastP1?.includes("⚡") ?? false} />
        {is2P && <ShieldDrop active={pwrToastP2?.includes("Shield") ?? false} />}
        {is2P && <FreezeDrop active={pwrToastP2?.includes("Freeze") ?? false} />}
        {is2P && <EnergyDrop active={pwrToastP2?.includes("⚡") ?? false} />}

        <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim}
          onTap={onTapP1}
          onHoldStart={onHoldStartP1} onHoldEnd={onHoldEndP1}
          keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={pressing1}
          label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
          colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid1}
          cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
          onPause={onPause} isFS={isFS}
          equippedSkin={shopData.equippedSkin} snapshot={snapshot}
          pwrToast={pwrToastP1}
          levelUpBadge={levelUpBadge}
          storedFreezeCharges={snapshot.p1.storedFreezeCharges}
          storedShieldCharges={snapshot.p1.storedShieldCharges}
          onActivateFreeze={onActivateFreezeP1}
          onActivateShield={onActivateShieldP1}
          showStoredPwr={screen === "playing"}
          practiceMode={practiceMode}
          onToggleBotAssist={onToggleBotP1}
          showBotAssist={screen === "playing"}
          isBotActive={botAssistActive[1]}
          botTapHighlights={botTapHighlights[1]}
          dust={dust}
          scoreFloats={scoreFloatsP1} />
        {is2P && (
          <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim}
            onTap={onTapP2}
            onHoldStart={onHoldStartP2} onHoldEnd={onHoldEndP2}
            keyLabels={p2Keys} showKeys={inputMode === "keyboard"} pressing={pressing2}
            label="P2" heartAnim={heartAnimP2} mode={gameMode}
            colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid2}
            cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
            onPause={onPause} isFS={isFS}
            equippedSkin={shopData.equippedSkin} snapshot={snapshot}
            pwrToast={pwrToastP2}
            storedFreezeCharges={snapshot.p2.storedFreezeCharges}
            storedShieldCharges={snapshot.p2.storedShieldCharges}
            onActivateFreeze={onActivateFreezeP2}
            onActivateShield={onActivateShieldP2}
            showStoredPwr={screen === "playing"}
            practiceMode={practiceMode}
            onToggleBotAssist={onToggleBotP2}
            showBotAssist={screen === "playing" && is2P}
            isBotActive={botAssistActive[2]}
            botTapHighlights={botTapHighlights[2]}
            dust={dust} />
        )}
      </GridErrorBoundary>
    </div>
  );
});

```

## FILE: components/HUD/PlayerPanel.tsx
```tsx
import React, { memo } from "react";
import gsap from "gsap";
import Cell from "../Cell";
import { Hearts } from "./Hearts";
import { useRef, useEffect, useState } from "react";
import { animateDustClaim } from "../../utils/dustAnimation";
import type { PlayerState, CellShape, RareColorMode, GameMode, GameSnapshot, ActiveCell } from "../../engine/types";
import type { BotTapFx } from "../../hooks/useGameEngine";
import { useTranslation } from "../../hooks/useTranslation";


// ─── Dynamic cell size ────────────────────────────────────────────
function getDynamicCellVar(cols: number, rows: number, is2P: boolean, mode?: string): string {
  const maxDim = Math.max(cols, rows);
  if (is2P) {
    if (mode === "classic") return "clamp(62px, 18vw, 90px)";
    return "clamp(48px, 9vw, 56px)";
  }
  if (maxDim <= 2) return "clamp(100px, 28vw, 140px)";
  if (maxDim <= 3) return "clamp(80px, 22vw, 110px)";
  if (maxDim <= 4) return "clamp(60px, 16vw, 84px)";
  return "clamp(48px, 13vw, 66px)";
}

// ─── Props ────────────────────────────────────────────────────────
export interface PlayerPanelProps {
  ps:           PlayerState;
  anim:         Record<number, string>;
  onTap:        (i: number) => void;
  onHoldStart:  (i: number) => void;
  onHoldEnd:    (i: number) => void;
  keyLabels:    string[];
  showKeys:     boolean;
  pressing:     Set<number>;
  label:        string | null;
  heartAnim:    boolean;
  mode:         GameMode;
  colorblind:   boolean;
  cbFilter:     string;
  is2P:         boolean;
  practiceMode?: boolean;
  shakeGrid:    boolean;
  cellShape:    CellShape;
  rareMode:     RareColorMode;
  onPause:      () => void;
  isFS:         boolean;
  equippedSkin?: string;
  levelUpBadge?: string | null;
  snapshot?:    GameSnapshot;
  pwrToast?:    string | null;
  storedFreezeCharges?: number;
  storedShieldCharges?: number;
  onActivateFreeze?: () => void;
  onActivateShield?: () => void;
  showStoredPwr?: boolean;
  onStartBot?:   () => void;
  onStopBot?:    () => void;
  isBotActive?:  boolean;
  botTapHighlights?: Record<number, number>;
  botTapFx?: BotTapFx[];
  onToggleBotAssist?: () => void;
  showBotAssist?: boolean;
  dust?:         number;
  scoreFloats?: { id: number; player: 1 | 2; idx: number; amount: number }[];
}

// ─── PlayerPanel ──────────────────────────────────────────────────
export const PlayerPanel = memo(function PlayerPanel({
  ps, anim: _anim, onTap, onHoldStart, onHoldEnd,
  keyLabels, showKeys, pressing,
  label, heartAnim, mode,
  colorblind, cbFilter, is2P, shakeGrid,
  cellShape: _cellShape, rareMode, onPause: _onPause, isFS: _isFS,
  equippedSkin,
  levelUpBadge: _levelUpBadge, snapshot,
  pwrToast: _pwrToast,
  storedFreezeCharges: _storedFreezeCharges = 0,
  storedShieldCharges: _storedShieldCharges = 0,
  onActivateFreeze: _onActivateFreeze,
  onActivateShield: _onActivateShield,
  showStoredPwr: _showStoredPwr = false,
  practiceMode = false,
  onStartBot: _onStartBot,
  onStopBot: _onStopBot,
  isBotActive = false,
  botTapHighlights = {},
  botTapFx,
  onToggleBotAssist,
  showBotAssist = false,
  dust = 0,
}: PlayerPanelProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const { cols, rows, mask } = snapshot?.grid ?? { 
    cols: 3, 
    rows: 3, 
    mask: null 
  };
  const gridTotal = cols * rows;
  const frozen    = ps.freezeEnd > now;
  const maskSet   = mask ? new Set(mask) : null;

  // Pre-compute botTapFx map for O(1) per-cell lookup instead of O(n) findLast
  const botTapFxMap = React.useMemo(() => {
    if (!botTapFx?.length) return null;
    const m = new Map<number, number>();
    // Iterate forward so last value wins (findLast semantics)
    for (const fx of botTapFx) m.set(fx.idx, fx.dustCost);
    return m;
  }, [botTapFx]);

  // Stable callback refs to avoid re-renders breaking Cell memo
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onHoldStartRef = useRef(onHoldStart);
  onHoldStartRef.current = onHoldStart;
  const onHoldEndRef = useRef(onHoldEnd);
  onHoldEndRef.current = onHoldEnd;
  const stableOnTap = React.useCallback((idx: number) => onTapRef.current(idx), []);
  const stableOnHoldStart = React.useCallback((idx: number) => onHoldStartRef.current?.(idx), []);
  const stableOnHoldEnd = React.useCallback((idx: number) => onHoldEndRef.current?.(idx), []);

  const gridRef = useRef<HTMLDivElement>(null);
  const botBtnRef = useRef<HTMLButtonElement>(null);
  const dustCleanupRef = useRef<(() => void) | null>(null);
  const prevStageRef = useRef(ps.gridStage);
  useEffect(() => () => { dustCleanupRef.current?.(); }, []);

  // GSAP stagger on grid stage change — center-out entrance for all cells
  useEffect(() => {
    if (!gridRef.current || ps.gridStage === prevStageRef.current) return;
    prevStageRef.current = ps.gridStage;
    const cells = gridRef.current.querySelectorAll('.cell:not(.cell-void)');
    if (cells.length === 0) return;
    gsap.from(cells, {
      scale: 0,
      opacity: 0,
      duration: 0.35,
      stagger: { amount: 0.25, from: "center" },
      ease: "back.out(1.7)",
      clearProps: "scale,opacity",
    });
  }, [ps.gridStage]);

  const spinClass = snapshot?.spinCfg
    ? (snapshot.spinCfg.direction === 1 ? "gpanel--cw" : "gpanel--ccw")
    : "";

  const skinClass = equippedSkin && equippedSkin !== "default" ? `grid-skin--${equippedSkin}` : "";

  const cellVar = getDynamicCellVar(cols, rows, is2P, mode);

  return (
    <div className={`ppanel${!ps.alive ? " ppanel--dead" : ""}`}>
      {label && (
        <div className="plabel-row">
          <div className="plabel">{label}</div>
        </div>
      )}
      {is2P && (
        <div className={`phud${mode === "classic" ? " phud--classic" : ""}`}>
          <div className="phud-pill phud-pill--score">
            <div className="phud-score-row">
              <div className="phud-score">{ps.score}</div>
              {ps.streak >= 3 && <div className="combo-wrap combo-wrap--sm">×{ps.streak}</div>}
            </div>
          </div>
          <div className="phud-pill phud-pill--hearts">
            <Hearts health={ps.health} anim={heartAnim} shieldCount={ps.shieldCount} practiceMode={practiceMode} />
          </div>
        </div>
      )}
      <div className="gpanel-wrap" style={{ "--cell": cellVar } as React.CSSProperties}>
        <div className={shakeGrid ? "gpanel-shake-wrap shake-grid" : "gpanel-shake-wrap"}>
          <div
            ref={gridRef}
            role="grid"
            aria-label={`Game grid ${cols} by ${rows}`}
            data-testid="game-grid"
            className={`gpanel${skinClass ? " " + skinClass : ""} ${spinClass}${showKeys ? " keyboard-mode" : ""}${isBotActive ? " gpanel--bot-active" : ""}`}
            style={{
              "--cell": cellVar,
              gridTemplateColumns: `repeat(${cols}, var(--cell))`,
              gridTemplateRows:    `repeat(${rows}, var(--cell))`,
              animationDuration: snapshot?.spinCfg ? `${snapshot.spinCfg.duration}s` : undefined,
              ...(frozen        ? { outline: "2px solid var(--color-freeze, #60a5fa)" } : {}),
              ...(ps.health === 1 && !frozen ? { outline: "2px solid var(--color-danger, #ef4444)", animation: "heartDanger 0.75s ease-in-out infinite" } : {}),
              ...(cbFilter      ? { filter: cbFilter } : {}),
              ...(rareMode.active ? { outline: `2px solid ${rareMode.cssColor}` } : {}),
            } as React.CSSProperties}>
            {/* Pre-build active cell map for O(1) lookup instead of O(n) find per cell */}
            {(() => {
              const activeMap = new Map(ps.active.map(c => [c.idx, c]));
              return Array.from({ length: gridTotal }, (_, i) => {
              const isVoid = maskSet && !maskSet.has(i);
              if (isVoid) return <div key={i} className="cell-void" />;

              const type = ps.cells[i] ?? "inactive";
              if (type === "inactive" || type === "void") return <div key={i} className="cell-void" />;

              const activeCell = activeMap.get(i) || {
              idx: i,
              clicked: true,
              type,
              shape: undefined,
            } as unknown as ActiveCell;

            const keyIdx = Math.floor(i / cols) * 4 + (i % cols);

            const bombFuse = activeCell.type === 'bomb' && 'expiresAt' in activeCell
              ? Math.max(0, activeCell.expiresAt - now)
              : undefined;

            return (
              (() => {
                if (activeCell.type === "hold") {
                  return (
                    <HoldCellDisplay
                      key={i}
                      idx={activeCell.idx}
                      holdRequired={activeCell.holdRequired ?? 800}
                      holdStart={activeCell.holdStart}
                      onHoldStart={onHoldStart}
                      onHoldEnd={onHoldEnd}
                    />
                  );
                }
                // K5: Apply slide animation if cell was shuffled
                const slideInfo = ps.slideAnim?.[activeCell.idx];

                return slideInfo ? (
                  <SlidingCell
                    key={i}
                    idx={activeCell.idx}
                    fromIdx={slideInfo.fromIdx}
                    startMs={slideInfo.startMs}
                    cols={cols}
                    durationMs={200}
                  >
                    <Cell
                      cell={activeCell}
                      onTap={stableOnTap}
                      onHoldStart={stableOnHoldStart}
                      onHoldEnd={stableOnHoldEnd}
                      colorblindMode={colorblind ? 'colorblind' : ''}
                      showKeyLabel={showKeys}
                      keyLabel={keyLabels[keyIdx] || ''}
                      isPressing={pressing.has(i)}
                      botPulse={Boolean(botTapHighlights[i])}
                      botDustCost={botTapFxMap?.get(i)}
                      bombFuse={bombFuse}
                    />
                  </SlidingCell>
                ) : (
                  <div key={i}>
                  <Cell
                    cell={activeCell}
                    onTap={stableOnTap}
                    onHoldStart={stableOnHoldStart}
                    onHoldEnd={stableOnHoldEnd}
                    colorblindMode={colorblind ? 'colorblind' : ''}
                    showKeyLabel={showKeys}
                    keyLabel={keyLabels[keyIdx] || ''}
                    isPressing={pressing.has(i)}
                    botPulse={Boolean(botTapHighlights[i])}
                    botDustCost={botTapFxMap?.get(i)}
                    bombFuse={bombFuse}
                  />
                  </div>
                );
              })()
            );
          });
          })()}
          </div>
        </div>
      </div>
      {showBotAssist && !practiceMode && onToggleBotAssist && (
        <button
          ref={botBtnRef}
          className={`bot-icon-btn${isBotActive ? " bot-icon-btn--active" : ""}${(dust ?? 0) < 30 ? " bot-icon-btn--disabled" : ""}`}
          onClick={() => {
            if ((dust ?? 0) >= 30 && !isBotActive && botBtnRef.current) {
              dustCleanupRef.current?.();
              dustCleanupRef.current = animateDustClaim(botBtnRef.current, '.dust-counter', 30, true);
            }
            if ((dust ?? 0) >= 30) {
              onToggleBotAssist();
            }
          }}
          title={(dust ?? 0) < 30 ? t('player.need_dust') : isBotActive ? t('player.bot_on') : t('player.bot_off')}
          aria-label={isBotActive ? t('player.bot_active') : t('player.bot_inactive')}
        >
          🤖
        </button>
      )}
    </div>
  );
});

// ─── Sliding Cell (K5) — GSAP-driven slide animation ─────────────
function SlidingCell({
  idx, fromIdx, startMs, cols, durationMs, children,
}: {
  idx: number; fromIdx: number; startMs: number; cols: number; durationMs: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dCol = (fromIdx % cols) - (idx % cols);
    const dRow = Math.floor(fromIdx / cols) - Math.floor(idx / cols);
    const elapsed = (Date.now() - startMs) / 1000;
    const dur = Math.max(0.01, durationMs / 1000 - elapsed);
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { xPercent: dCol * 100, yPercent: dRow * 100 },
        { xPercent: 0, yPercent: 0, duration: dur, ease: 'power2.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, [idx, fromIdx, cols, startMs, durationMs]);

  return <div ref={ref} className="cell--sliding" style={{ zIndex: 5 }}>{children}</div>;
}

// ─── Hold Cell Display (I2) ───────────────────────────────
function HoldCellDisplay({
  holdRequired,
  holdStart,
  idx,
  onHoldStart,
  onHoldEnd,
}: {
  holdRequired: number;
  holdStart?: number;
  idx: number;
  onHoldStart: (idx: number) => void;
  onHoldEnd: (idx: number) => void;
}) {
  const [pct, setPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (holdStart === undefined) { setPct(0); return; }
    const animate = () => {
      const elapsed = Date.now() - holdStart;
      const p = Math.min(1, elapsed / holdRequired);
      setPct(p);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [holdStart, holdRequired]);

  return (
    <div
      className={`hold-cell${pct > 0 ? ' is-holding' : ''}`}
      onPointerDown={(e) => { e.preventDefault(); onHoldStart(idx); }}
      onPointerUp={() => onHoldEnd(idx)}
      onPointerLeave={() => onHoldEnd(idx)}
      onPointerCancel={() => onHoldEnd(idx)}
    >
      <svg className="hold-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
        <path className="hold-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path
          className="hold-fill"
          strokeDasharray={`${pct * 100}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="hold-icon">⏳</div>
    </div>
  );
}

```

## FILE: components/HUD/EnergyBar.tsx
```tsx
import React, { useEffect, useState } from "react";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";

interface EnergyBarProps {
  energy: number;
  energyLastRegen: number;
  onRefill: () => void;
  onRefillFull: () => void;
  onEnergyIconClick?: () => void;
  dust: number;
}

export function EnergyBar({
  energy,
  energyLastRegen,
  onRefill,
  onRefillFull,
  onEnergyIconClick,
  dust,
}: EnergyBarProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const isFull = energy >= GAME.MAX_ENERGY;

  useEffect(() => {
    if (isFull) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isFull]);

  const remaining = GAME.ENERGY_REGEN_MS - ((now - energyLastRegen) % GAME.ENERGY_REGEN_MS);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const costFull = GAME.DUST_PER_ENERGY * (GAME.MAX_ENERGY - energy);

  return (
    <div className="energy-bar-wrap">
      <div className="energy-pips" onClick={onEnergyIconClick} style={{ cursor: onEnergyIconClick ? "pointer" : "default" }}>
        {Array.from({ length: GAME.MAX_ENERGY }, (_, i) => (
          <span
            key={i}
            className={`energy-pip${i < energy ? " energy-pip--full" : " energy-pip--empty-click"}`}
            onClick={(e) => {
              if (i >= energy && dust >= GAME.DUST_PER_ENERGY) {
                e.stopPropagation();
                onRefill();
              }
            }}
            title={i >= energy && dust >= GAME.DUST_PER_ENERGY ? `${t('energy.refill_pip')} - 💜${GAME.DUST_PER_ENERGY}` : undefined}
          >
            ⚡
          </span>
        ))}
      </div>
      {energy < GAME.MAX_ENERGY && (
        <div className="energy-regen-row">
          <span className="energy-timer">{t('energy.plus_one', { mins, secs: String(secs).padStart(2, "0") })}</span>
          {dust >= GAME.DUST_PER_ENERGY && (
            <button className="energy-refill-btn" onClick={onRefill}>
              💜{GAME.DUST_PER_ENERGY}→+1
            </button>
          )}
          {dust >= costFull && energy < GAME.MAX_ENERGY - 1 && (
            <button className="energy-refill-btn" onClick={onRefillFull} style={{ marginLeft: 2 }}>
              💜{costFull}→{t('energy.full')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

```

## FILE: components/Screens/StartScreen.tsx
```tsx
import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GameMode, NumPlayers } from "../../engine/types";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";
import { Icon } from "../UI/Icon";

// ─── Types local to menu ──────────────────────────────────────────
type InputMode = "touch" | "keyboard";

// ─── PillRow ──────────────────────────────────────────────────────
function PillRow<T extends string | number>({
  options, value, onChange, disabledOptions = [], onDisabledClick,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabledOptions?: T[]; onDisabledClick?: (v: T) => void }) {
  const selIdx   = options.findIndex(o => o.value === value);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rowRef   = useRef<HTMLDivElement>(null);

  const isDisabled = (optValue: T) => disabledOptions.includes(optValue);

  const reposition = useCallback(() => {
    const row   = rowRef.current;
    const thumb = thumbRef.current;
    if (!row || !thumb) return;
    const btns = row.querySelectorAll<HTMLButtonElement>(".pill-opt");
    const btn  = btns[selIdx];
    if (!btn) return;
    thumb.style.left  = btn.offsetLeft + "px";
    thumb.style.width = btn.offsetWidth + "px";
  }, [selIdx]);

  useEffect(() => {
    reposition();
    let raf2: number;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(reposition); });
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined")
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    const ro = new ResizeObserver(() => { reposition(); requestAnimationFrame(reposition); });
    ro.observe(row);
    if (row.parentElement) ro.observe(row.parentElement);
    return () => { ro.disconnect(); cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [reposition, selIdx]);

  return (
    <div className="pill-row" ref={rowRef} role="radiogroup">
      <div className="pill-thumb" ref={thumbRef} />
      {options.map((o, i) => {
        const locked = isDisabled(o.value);
        return (
          <button key={String(o.value)}
            className={`pill-opt${i === selIdx ? " pill-opt--on" : ""}${locked ? " pill-opt--locked" : ""}`}
            role="radio"
            aria-checked={i === selIdx}
            onClick={() => locked && onDisabledClick ? onDisabledClick(o.value) : onChange(o.value)}
            title={locked ? "Tap for hint" : undefined}>
            {o.label}{locked && " 🔒"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Magnetic Button (React Bits Magnet pattern) ──────────────────
function MagneticButton({ children, onClick, className = "", disabled = false }: {
  children: React.ReactNode; onClick: () => void; className?: string; disabled?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const isFinePointer = useRef(false);

  useEffect(() => {
    isFinePointer.current = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
    const mq = window.matchMedia?.("(pointer: fine)");
    const handleChange = (e: MediaQueryListEvent) => { isFinePointer.current = e.matches; };
    mq?.addEventListener("change", handleChange);

    const handleMove = (e: MouseEvent) => {
      if (!isFinePointer.current || !wrapperRef.current) return;
      const { left, top, width, height } = wrapperRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);
      const padding = 20;

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        const rawX = (e.clientX - centerX) / 6;
        const rawY = (e.clientY - centerY) / 6;
        setPosition({ x: Math.max(-8, Math.min(8, rawX)), y: Math.max(-8, Math.min(8, rawY)) });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      mq?.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        className={className}
        onClick={onClick}
        disabled={disabled}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: isActive ? "transform 0.3s ease-out" : "transform 0.5s ease-in-out",
          willChange: "transform",
        }}
      >
        {children}
      </button>
    </div>
  );
}

// ─── Energy countdown ──────────────────────────────────────────────
function getNextRegenMs(energyLastRegen: number): number {
  const elapsed   = Date.now() - energyLastRegen;
  const remaining = GAME.ENERGY_REGEN_MS - (elapsed % GAME.ENERGY_REGEN_MS);
  return remaining;
}

function EnergyCountdown({ energyLastRegen }: { energyLastRegen: number }) {
  const [ms, setMs] = useState(() => getNextRegenMs(energyLastRegen));
  useEffect(() => {
    const id = setInterval(() => setMs(getNextRegenMs(energyLastRegen)), 250);
    return () => clearInterval(id);
  }, [energyLastRegen]);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return <div className="no-energy-timer">Next energy in {mins}:{String(secs).padStart(2, "0")}</div>;
}

// ─── Props ────────────────────────────────────────────────────────
export interface StartScreenProps {
  gameMode:        GameMode;
  setGameMode:     (m: GameMode) => void;
  numPlayers:      NumPlayers;
  setNumPlayers:   (n: NumPlayers) => void;
  inputMode:       InputMode;
  setInputMode:    (m: InputMode) => void;
  practiceMode:    boolean;
  setPracticeMode: (v: boolean) => void;
  energyCount:     number;
  energyLastRegen: number;
  dust:            number;
  devMode:         boolean;
  playerName:      string | null;
  isFeatureUnlocked: (id: import('../../utils/featureGates').FeatureId) => boolean;
  onPlay:          () => void;
  onHowTo:         () => void;
  onLeaderboard:   () => void;
  onShop:          () => void;
  onKeybind:       () => void;
  onRefillEnergy:  () => void;
  onSwitchPlayer:  () => void;
  onOpenRewardsHub: () => void;
  onGameMaster?: () => void;
  rewardsBadgeCount?: number;
  dustWidget:      React.ReactNode;
  energyBar:       React.ReactNode;
  dailyObjectives?: import("../../config/dailyObjective").DailyObjective[];
  pendingReplaySeed?: string | null;
  onClearReplaySeed?: () => void;
  onToast?: (message: string) => void;
}

// ─── StartScreen ──────────────────────────────────────────────────
export function StartScreen({
  gameMode, setGameMode,
  numPlayers, setNumPlayers,
  inputMode, setInputMode,
  practiceMode, setPracticeMode,
  energyCount, energyLastRegen,
  dust, devMode,
  playerName,
  isFeatureUnlocked,
  onPlay, onHowTo, onLeaderboard, onShop, onKeybind,
  onRefillEnergy, onSwitchPlayer, onOpenRewardsHub, onGameMaster: _onGameMaster, rewardsBadgeCount: _rewardsBadgeCount,
  dustWidget: _dustWidget, energyBar,
  dailyObjectives: _dailyObjectives,
  pendingReplaySeed, onClearReplaySeed,
  onToast,
}: StartScreenProps) {
  const { t } = useTranslation();
  const isKbd = inputMode === "keyboard";
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Cursor-tracking glow on menu card
  const handleCardPointer = useCallback((e: React.PointerEvent) => {
    const glow = glowRef.current;
    const card = cardRef.current;
    if (!glow || !card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glow.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, rgba(192,38,211,0.12), transparent 70%)`;
    glow.style.opacity = "1";
  }, []);

  const handleCardLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle navigation when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onPlay();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          onHowTo();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          onLeaderboard();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          onShop();
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          onKeybind();
          break;
        case '1':
          e.preventDefault();
          setGameMode('classic');
          break;
        case '2':
          if (isFeatureUnlocked('evolve_mode') || devMode) {
            e.preventDefault();
            setGameMode('evolve');
          }
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          setNumPlayers(numPlayers === 1 ? 2 : 1);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setInputMode('touch');
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          setInputMode(inputMode === 'touch' ? 'keyboard' : 'touch');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, numPlayers, gameMode, isFeatureUnlocked, devMode, onPlay, onHowTo, onLeaderboard, onShop, onKeybind, setGameMode, setInputMode, setNumPlayers]);

  return (
    <>
      <div ref={cardRef} className="menu-card screen-slide" role="main" aria-label="Game menu" data-testid="menu-card" id="menu-card"
        onPointerMove={handleCardPointer} onPointerLeave={handleCardLeave}>
      <div ref={glowRef} className="menu-card-glow" />
      <div className="menu-header">
        <h1 className="menu-title">Don't Touch Purple</h1>
        <p className="menu-sub">Tap fast. Survive longer.</p>
      </div>
      {pendingReplaySeed && (
        <div className="replay-banner">
          <span>▶ Replay Seed: <strong>{pendingReplaySeed}</strong></span>
          <button className="btn-ghost btn-sm" onClick={onClearReplaySeed}>Clear</button>
        </div>
      )}
      {/* Top row: player pill + energy pips */}
      <div className="menu-top-row">
        <button className="player-pill" onClick={onSwitchPlayer} aria-label="Switch player">
          <span className="player-pill-icon">{devMode ? "🔧" : "👤"}</span>
          <span className="player-pill-name">{playerName || t('menu.guest')}{devMode ? " [DEV]" : ""}</span>
          <span className="player-pill-edit">✎</span>
        </button>
        <div className="energy-inline">{energyBar}</div>
      </div>

      <div className="opt-grid" role="group" aria-label={t('menu.settings')}>
        <div className="opt-section">
          <div className="opt-label" id="game-mode-label">{t('menu.game')}</div>
          <PillRow<GameMode>
            options={[
              { value: "classic", label: t('menu.classic') },
              { value: "evolve", label: t('menu.evolve') }
            ]}
            value={gameMode}
            disabledOptions={(!isFeatureUnlocked('evolve_mode') && !devMode) ? ['evolve'] : []}
            onDisabledClick={(_m) => onToast?.(t('menu.locked_evolve'))}
            onChange={(m) => setGameMode(m)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.players')}</div>
          <PillRow<NumPlayers>
            options={[
              { value: 1, label: t('menu.solo') },
              { value: 2, label: t('menu.duo') }
            ] as { value: NumPlayers; label: string }[]}
            value={numPlayers}
            disabledOptions={(!isFeatureUnlocked('two_player') && !devMode) ? [2] : []}
            onDisabledClick={(_n) => onToast?.(t('menu.locked_duo'))}
            onChange={(n) => setNumPlayers(n)}
          />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.input')}</div>
          <PillRow<InputMode>
            options={[{ value: "touch", label: t('menu.touch') }, { value: "keyboard", label: t('menu.keys') }]}
            value={inputMode} onChange={setInputMode} />
        </div>
        <div className="opt-section">
          <div className="opt-label">{t('menu.mode')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('menu.practice') }, { value: "off", label: t('menu.normal') }]}
            value={practiceMode ? "on" : "off"}
            onChange={(v) => setPracticeMode(v === "on")} />
        </div>
      </div>

      {(devMode || energyCount > 0) ? (
        <MagneticButton className="btn-play" onClick={onPlay}>
          {t('menu.play_btn')}
        </MagneticButton>
      ) : (
        <div className="no-energy-block">
          <EnergyCountdown energyLastRegen={energyLastRegen} />
          <button className="btn-ghost" onClick={onRefillEnergy} disabled={dust < GAME.DUST_PER_ENERGY}>{t('menu.refill')}</button>
        </div>
      )}

      <div className="menu-links" role="navigation" aria-label="Game navigation">
        <button className="btn-icon-sm" onClick={onHowTo} title={t('menu.how_to_play')} aria-label={t('menu.how_to_play')}><Icon name="info" size={20} /></button>
        <button className="btn-icon-sm" onClick={onShop} title={t('menu.shop')} aria-label={t('menu.shop')}><Icon name="bolt" size={20} /></button>
        <button className="btn-icon-sm" onClick={onLeaderboard} disabled={!isFeatureUnlocked('leaderboard') && !devMode} title={t('menu.leaderboard')} aria-label={t('menu.leaderboard')}><Icon name="trophy" size={20} /></button>
        <button className="btn-icon-sm" onClick={onOpenRewardsHub} disabled={!isFeatureUnlocked('daily_challenges') && !devMode} title={t('menu.rewards')} aria-label={t('menu.rewards')}><Icon name="star" size={20} /></button>
        {isKbd && <button className="btn-icon-sm" onClick={onKeybind} title={t('menu.keys')} aria-label={t('menu.keys')}>⌨</button>}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use keyboard shortcuts: Enter/Space to play, H for help, L for leaderboard, S for shop, K for keys.
        Use 1/2 to switch game modes, arrow keys to change players and input mode.
      </div>
    </div>
    </>
  );
}

```

## FILE: components/Screens/GameOver.tsx
```tsx
import React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import type { GameMode, Winner } from "../../engine/types";
import { useTranslation } from "../../hooks/useTranslation";
import { Icon } from "../UI/Icon";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const MESSAGES: { min: number; max: number; texts: string[] }[] = [
  { min: 0,   max: 4,   texts: ["Bro couldn't avoid ONE color. 💀","The grid had 12 safe colors. You still lost. 🫠","Have you considered... not touching purple?","A goldfish would've scored higher. Scientifically.","Congratulations on finding the worst possible score.","Purple: 1. You: somehow less than 1.","Even accidentally tapping would've been better.","Did you mean to play a different game? 🙃"] },
  { min: 5,   max: 9,   texts: ["Single digits. Your fingers need a firmware update.","That was painful to watch. 😬","You tapped purple like it was the goal.","Somewhere, a purple cell is laughing at you.","Basic difficulty called. It wants a refund.","Bold strategy. Terrible execution.","The tutorial is embarrassed on your behalf."] },
  { min: 10,  max: 19,  texts: ["Double digits. The minimum bar cleared. Barely.","You made it to double digits. The grid is unimpressed.","10+ - technically not a complete disaster.","Your thumbs are getting warmed up, apparently.","Progress! You avoided purple... some of the time.","Not bad for your first conscious attempt.","The grid acknowledges your existence. Faintly."] },
  { min: 20,  max: 34,  texts: ["Now we're cooking. Medium rare. 🔥","The grid is starting to take you seriously.","20+ - you have actual reflexes. Interesting.","You're in the zone. Stay there.","Your thumbs are having a moment.","The purple is slightly nervous. Good.","Something resembling skill detected."] },
  { min: 35,  max: 49,  texts: ["Serious reflexes detected. 🔥","35+? Tell your friends. Brag a little.","Your fingers are professionally trained, apparently.","The grid didn't see that coming.","Almost 50. The threshold of greatness.","You tapped so fast the purple forgot its job.","We're getting somewhere. Keep going."] },
  { min: 50,  max: 74,  texts: ["FIFTY. You're a natural. 🏆","Half-century! Legendary energy.","50+ means fast hands and questionable hobbies.","The grid can't stop you. It's accepted this.","Your mom would be proud. Probably.","50+ and counting. You're becoming the grid.","Genuine talent spotted. Finally."] },
  { min: 75,  max: 99,  texts: ["75+ is elite territory. 👑","Approaching triple digits. A god awakens.","Your fingers are a biological miracle.","The purple filed a formal complaint. About you.","At this point just go pro.","75+ - researchers want to study your hands.","The grid is scared. Keep it scared."] },
  { min: 100, max: 149, texts: ["TRIPLE DIGITS. Frame this. 🤯","100+. You've transcended the average human.","The game is genuinely afraid of you now.","Are you using one hand?? Impressive.","100+ - this score belongs in a museum.","The grid has filed for emotional damages.","Absolute specimen. This is real now."] },
  { min: 150, max: 9999, texts: ["ARE YOU HUMAN?? 👾","150+ - we need to talk about your reflexes.","Legend. Myth. Tap god. You.","The purple has retired. Because of you.","Scientists want to study your nervous system.","You broke the intended difficulty curve. Congratulations.","This score should not be possible. And yet.","GOAT status confirmed. No debate."] },
];

export function getMessage(score: number): string {
  const bucket = MESSAGES.find(b => score >= b.min && score <= b.max) ?? MESSAGES[MESSAGES.length - 1];
  return bucket.texts[Math.floor(Math.random() * bucket.texts.length)];
}

function NewBestBanner() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { scale: 0, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "var(--font-game)",
        fontSize: 14, letterSpacing: 3, textTransform: "uppercase" as const,
        background: "linear-gradient(90deg, #f9bd22, #f59e0b, #f9bd22)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 0 12px rgba(249,189,34,0.8))",
        animation: "humanLimitPulse 1s ease-in-out infinite, goldShimmer 2s linear infinite",
        backgroundSize: "200% 100%",
      }}
    >
      ✨ {t('gameover.new_best')} ✨
    </div>
  );
}

export interface GameOverProps {
  p1Score: number; p2Score: number; best: number;
  winner: Winner; mode: GameMode; is2P: boolean;
  shareMsg: string; gameSeed: number; tick: number;
  p1: { gridStage: number; patternIdx: number; health: number; streak: number; alive: boolean };
  onAgain: () => void; onLeaderboard: () => void; onMenu: () => void;
  spinLevel: number; isHumanLimit?: boolean;
  dustEarned?: number; objectiveProgress?: number;
}

export function GameOver({
  p1Score, p2Score, best, winner, mode, is2P,
  shareMsg, gameSeed, tick, p1,
  onAgain, onLeaderboard, onMenu, spinLevel,
  isHumanLimit, dustEarned, objectiveProgress = 0,
}: GameOverProps) {
  const { t } = useTranslation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTrapRef = useFocusTrap<HTMLDivElement>(showShareModal);
  const finalScoreRef = useRef(p1Score);
  useEffect(() => { finalScoreRef.current = p1Score; }, [p1Score]); // BUG-NEW-001: keep ref in sync
  const [displayScore, setDisplayScore] = useState(0);
  const isNewBest = !is2P && p1Score > 0 && p1Score >= best;
  const actionsRef = useRef<HTMLDivElement>(null);
  const scoreObj = useRef({ val: 0 });

  useEffect(() => {
    const score = finalScoreRef.current;
    if (is2P || score === 0) { setDisplayScore(score); return; }

    const ctx = gsap.context(() => {
      // Score count-up
      scoreObj.current.val = 0;
      gsap.to(scoreObj.current, {
        val: score,
        duration: Math.min(1.2, 0.4 + score * 0.008),
        ease: "power3.out",
        snap: { val: 1 },
        onUpdate: () => setDisplayScore(Math.round(scoreObj.current.val)),
      });

      // Button stagger entrance
      if (actionsRef.current) {
        const buttons = actionsRef.current.querySelectorAll(".btn-primary, .btn-ghost, .go-small-actions");
        gsap.from(buttons, {
          opacity: 0, y: 20,
          duration: 0.4,
          stagger: 0.08,
          ease: "back.out(1.5)",
          delay: 0.2,
        });
      }
    });

    return () => ctx.revert();
  }, [is2P]);

  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);

  const bugHref = React.useMemo(() => `mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
    `Score: ${p1Score}\nMode: ${mode}\nSeed: ${gameSeed}\nTick: ${tick}\nHealth: ${p1.health}\nSpin: ${spinLevel}\nStreak: ${p1.streak}\n\nUA: ${navigator.userAgent}\nURL: ${window.location.pathname}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\n(describe what happened)\n`
  )}`, [p1Score, mode, gameSeed, tick, p1.health, spinLevel, p1.streak]);

  return (
    <>
      <div className="go-eyebrow">{is2P ? t('gameover.round_over') : t('gameover.game_over')}</div>

      {is2P ? (
        <>
          <div className="go-winner">
            {winner === "p1" ? t('gameover.p1_wins') : winner === "p2" ? t('gameover.p2_wins') : t('gameover.tie')}
          </div>
          <div className="go-pair">
            <div className="go-col"><div className="go-plbl" style={{ color: "#60a5fa" }}>P1</div><div className="go-score">{p1Score}</div></div>
            <div className="go-sep" />
            <div className="go-col"><div className="go-plbl" style={{ color: "#f472b6" }}>P2</div><div className="go-score">{p2Score}</div></div>
          </div>
        </>
      ) : (
        <>
          {isHumanLimit && <div className="go-humanlimit">{t('gameover.human_limit')}</div>}
          {isNewBest && <NewBestBanner />}
          <div className="go-score-row">
            <div className={`go-num go-num--anim${isNewBest ? " hud-val--pb" : ""}`}>{displayScore}</div>
            {(dustEarned ?? 0) > 0 && <div className="go-dust-inline">+{dustEarned} 💜</div>}
          </div>
          <div className="go-msg">&ldquo;{shareMsg}&rdquo;</div>
          <div className="go-objective-progress">
            <div className="go-objective-header">
              <span>Daily</span>
              <span>{Math.round(objectiveProgress * 100)}%</span>
            </div>
            <div className="go-progress-track">
              <div className="go-progress-fill" style={{ width: `${Math.min(1, objectiveProgress) * 100}%` }} />
            </div>
          </div>
        </>
      )}

      <div className="go-actions" ref={actionsRef}>
        <button
          className="btn-primary btn-large"
          onClick={onAgain}
        >▶ {t('gameover.again')}</button>
        <button
          className="btn-ghost"
          onClick={() => setShowShareModal(true)}
        >🔗 {t('gameover.share')}</button>
        <div className="go-small-actions">
          <button className="btn-icon" onClick={onLeaderboard}><Icon name="trophy" size={20} /></button>
          <button className="btn-icon" onClick={onMenu}>☰</button>
        </div>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)} onKeyDown={e => { if (e.key === 'Escape') setShowShareModal(false); }} role="dialog" aria-modal="true" aria-label={t('gameover.share_title')} tabIndex={-1} ref={shareTrapRef}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{t('gameover.share_title')}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn-ghost" onClick={() => {
                const text = `I just scored ${p1Score} in Don't Touch Purple (${mode})! 🔥\nCan you beat me?\nSeed: ${gameSeed}\nhttps://dont-touch-purple.web.app`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}><Icon name="share" size={16} /> WhatsApp</button>
              <button className="btn-ghost" onClick={() => {
                const text = `Just dropped ${p1Score} in Don't Touch Purple (${mode.toUpperCase()}) 🔥 Beat my seed? ${gameSeed}\nhttps://dont-touch-purple.web.app`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}>𝕏 {t('gameover.challenge')}</button>
              <button className="btn-ghost" onClick={() => {
                try {
                  const W = 600, H = 315;
                  const canvas = document.createElement("canvas");
                  canvas.width = W; canvas.height = H;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const bg = ctx.createLinearGradient(0, 0, W, H);
                  bg.addColorStop(0, "#151028"); bg.addColorStop(1, "#1e0a46");
                  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
                  const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 220);
                  glow.addColorStop(0, "rgba(192,38,211,0.18)"); glow.addColorStop(1, "transparent");
                  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
                  ctx.strokeStyle = "rgba(192,38,211,0.5)"; ctx.lineWidth = 2;
                  ctx.strokeRect(1, 1, W-2, H-2);
                  ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px system-ui, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("DON'T TOUCH THE", W/2, 60);
                  ctx.fillStyle = "#c026d3"; ctx.font = "bold 26px system-ui, sans-serif";
                  ctx.fillText("PURPLE", W/2, 92);
                  ctx.fillStyle = "#ffffff"; ctx.font = "bold 88px system-ui, sans-serif";
                  ctx.fillText(String(p1Score), W/2, 200);
                  const ml = mode === "classic" ? "Classic" : "Evolve";
                  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "16px system-ui, sans-serif";
                  ctx.fillText(`${ml} Mode · Seed ${gameSeed}`, W/2, 235);
                  ctx.fillStyle = "rgba(192,38,211,0.9)"; ctx.font = "bold 14px system-ui, sans-serif";
                  ctx.fillText("Can you beat this? → game.mscarabia.com", W/2, 285);
                  // UX-001: Use toBlob for async non-blocking PNG encoding
                  canvas.toBlob((blob) => {
                    if (!blob) return;
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `dtp-score-${p1Score}.png`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }, "image/png");
                } catch { /* canvas not available */ }
              }}>🖼️ Save Card</button>
              <button className="btn-ghost" onClick={() => {
                const url = `https://dont-touch-purple.web.app/?seed=${gameSeed}&mode=${mode}`;
                navigator.clipboard.writeText(`I scored ${p1Score} in Don't Touch Purple! Can you beat me?\n${url}`).then(() => {
                  setCopied(true);
                  if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
                  copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
                }).catch(() => {});
              }}>{copied ? "✓ Copied!" : "📋 Copy Link"}</button>
              <button className="btn-ghost" onClick={() => setShowShareModal(false)}>{t('ui.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <a className="go-bug-icon" href={bugHref} target="_blank" rel="noopener noreferrer" title="Report a bug">🐛</a>
    </>
  );
}

```

## FILE: components/Screens/HowToPlay.tsx
```tsx
import { motion } from "framer-motion";
import { useTranslation } from "../../hooks/useTranslation";

interface HowToPlayProps {
  onClose: () => void;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

const row = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const BOSS_EVENTS = [
  { icon: "\u26A1", name: "Storm", desc: "Cells shuffle at lightning speed. Your muscle memory betrays you." },
  { icon: "\uD83D\uDD04", name: "Inversion", desc: "Safe and danger colors swap. Everything you learned is now wrong." },
  { icon: "\uD83C\uDF11", name: "Blackout", desc: "The grid goes completely dark. You tap from memory alone." },
];

const FEATURES = [
  { icon: "\uD83C\uDFAE", title: "Two Game Modes", desc: "Classic for quick reflex training. Evolve for progressive difficulty." },
  { icon: "\uD83C\uDFC6", title: "37 Achievements", desc: "Unlock badges and earn dust currency as you master challenges." },
  { icon: "\u2728", title: "12 Backgrounds", desc: "GPU-accelerated WebGL effects \u2014 nebula, aurora, digital rain, and more." },
  { icon: "\uD83E\uDD16", title: "AI Bot Assist", desc: "Activate a companion bot that costs dust to help you survive." },
  { icon: "\uD83D\uDCC5", title: "Daily Challenges", desc: "New objectives every day. Compete on the global leaderboard." },
  { icon: "\uD83D\uDCF1", title: "Installable PWA", desc: "Works on any device. Install as an app. Gamepad support included." },
];

const GITHUB_URL = "https://github.com/defaltadmin/donttouchpurple";

export function HowToPlay({ onClose: _onClose }: HowToPlayProps) {
  const { t } = useTranslation();

  return (
    <div className="how-wrap screen-slide scrollable-screen">
      <motion.h2
        className="how-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >{t('how.title')}</motion.h2>

      <motion.div className="how-grid" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#dde4ee" }}>⬜</span><div><b>{t('how.safe_cells')}</b><br />{t('how.safe_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#a855f7" }}>🟣</span><div><b>{t('how.danger')}</b><br />{t('how.danger_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fcd34d" }}>♥</span><div><b>{t('how.medpack')}</b><br />{t('how.medpack_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#67e8f9" }}>◈</span><div><b>{t('how.shield')}</b><br />{t('how.shield_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#bfdbfe" }}>❄</span><div><b>{t('how.freeze')}</b><br />{t('how.freeze_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#fb923c" }}>⚡</span><div><b>{t('how.multiplier')}</b><br />{t('how.multiplier_desc')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon" style={{ color: "#ff4400" }}>💣</span><div><b>{t('how.bomb')}</b><br />{t('how.bomb_desc')}</div></motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>⊞ {t('how.classic')}</b> - {t('how.classic_desc')}</motion.div>
        <motion.div className="how-mode" variants={row}><b>∞ {t('how.evolve')}</b> - {t('how.evolve_desc')}</motion.div>
      </motion.div>

      <motion.div className="how-modes" initial="hidden" animate="visible" variants={container}>
        <motion.div className="how-mode" variants={row}><b>{t('how.keyboard')}</b></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>Esc</kbd></span><div>{t('how.pause_key')}</div></motion.div>
        <motion.div className="how-row" variants={row}><span className="how-icon"><kbd>B</kbd></span><div>{t('how.bot_key')}</div></motion.div>
      </motion.div>

      <motion.p
        className="how-tip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >⚡ {t('how.tip')}</motion.p>

      {/* ── Boss Events Detail ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Boss Events</motion.h3>
        {BOSS_EVENTS.map((boss) => (
          <motion.div key={boss.name} className="how-row" variants={row}>
            <span className="how-icon" style={{ fontSize: "1.5rem" }}>{boss.icon}</span>
            <div><b>{boss.name}</b> - {boss.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Features ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Everything You Get</motion.h3>
        {FEATURES.map((f) => (
          <motion.div key={f.title} className="how-row" variants={row}>
            <span className="how-icon" style={{ fontSize: "1.3rem" }}>{f.icon}</span>
            <div><b>{f.title}</b> - {f.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Open Source ── */}
      <motion.div className="how-section" initial="hidden" animate="visible" variants={container}>
        <motion.h3 className="how-section-title" variants={row}>Open Source</motion.h3>
        <motion.div className="how-tech-badges" variants={row}>
          <span className="how-badge">React 19</span>
          <span className="how-badge">TypeScript</span>
          <span className="how-badge">Vite</span>
          <span className="how-badge">WebGL</span>
          <span className="how-badge">Firebase</span>
        </motion.div>
        <motion.div className="how-stats" variants={row}>
          <span><b>232</b> Tests</span>
          <span><b>MIT</b> License</span>
          <span><b>5</b> Languages</span>
        </motion.div>
        <motion.a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="how-github-link" variants={row}>
          View on GitHub
        </motion.a>
      </motion.div>
    </div>
  );
}

```

## FILE: components/Screens/WhatsNew.tsx
```tsx
import React, { useState } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

// Injected at build time via vite.config.ts define
declare const __APP_VERSION__: string;
const WHATS_NEW_VERSION = __APP_VERSION__;
const LS_KEY = "dtp_last_version";

interface WhatsNewProps {
  onClose: () => void;
}

const CHANGES = [
  { emoji: "💣", text: "Bomb cells now show a circular SVG countdown ring - tap before it drains!" },
  { emoji: "🔄", text: "Inversion boss event fully fixed - purple is safe to tap, safe colors are the threat" },
  { emoji: "🌀", text: "Storm boss event RNG fixed - seeded replays stay accurate through storms" },
  { emoji: "🎯", text: "Score display upgraded - smooth glow bloom per point, streak-heat color ramp" },
  { emoji: "🤖", text: "Bot assist button moved into HUD row - never overlaps the grid" },
  { emoji: "🎁", text: "Daily check-in panel animates closed after claiming dust" },
  { emoji: "🖼️", text: "Animated backgrounds now only show during gameplay - Shop and Menu stay clean" },
  { emoji: "💣", text: "Bombs now spawn in 2-player Evolve mode for both players" },
  { emoji: "∞",  text: "Evolve mode: grid grows 2×2 → 5×5 with named shape stages" },
  { emoji: "⚡", text: "Boss events: Storm, Inversion, Blackout - every 500 points in Evolve" },
  { emoji: "🏆", text: "Global leaderboard, daily streaks, dust economy, and cosmetic shop" },
];

export function WhatsNew({ onClose }: WhatsNewProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const [isNewVersion] = useState(() => {
    try {
      const last = localStorage.getItem(LS_KEY);
      return last !== WHATS_NEW_VERSION;
    } catch { return false; }
  });

  const handleClose = () => { markWhatsNewSeen(); onClose(); };

  return (
    <div className="whatsnew-overlay" role="dialog" aria-modal="true" aria-label="What's New" onClick={handleClose} ref={trapRef}>
      <div className="whatsnew-card" onClick={(e) => e.stopPropagation()}>
        <div className="whatsnew-header">
          <h2 className="whatsnew-title">What's New</h2>
          <span className="whatsnew-version">v{WHATS_NEW_VERSION}</span>
          {isNewVersion && <span className="whatsnew-badge">New!</span>}
          <button className="whatsnew-close" onClick={handleClose}>✕</button>
        </div>
        <div className="whatsnew-list">
          {CHANGES.map((c, i) => (
            <div key={i} className="whatsnew-item">
              <span className="whatsnew-emoji">{c.emoji}</span>
              <span className="whatsnew-text">{c.text}</span>
            </div>
          ))}
        </div>
        <button className="btn-play whatsnew-ok" onClick={handleClose}>Got it!</button>
      </div>
    </div>
  );
}

export function shouldShowWhatsNew(): boolean {
  try {
    const last = localStorage.getItem(LS_KEY);
    return last !== WHATS_NEW_VERSION;
  } catch {
    return true;
  }
}

export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(LS_KEY, WHATS_NEW_VERSION);
  } catch { /* ignore */ }
}

```

## FILE: components/Screens/EnergyPopup.tsx
```tsx
import React from "react";
import { GAME } from "../../config/difficulty";
import { useTranslation } from "../../hooks/useTranslation";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface EnergyPopupProps {
  energyCount: number;
  dust: number;
  onClose: () => void;
  onRefill1: () => void;
  onRefillFull: () => void;
}

export const EnergyPopup = React.memo(function EnergyPopup({
  energyCount, dust, onClose, onRefill1, onRefillFull,
}: EnergyPopupProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const needed = GAME.MAX_ENERGY - energyCount;
  const fullCost = needed * GAME.DUST_PER_ENERGY;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('ui.energy')} onClick={onClose} ref={trapRef}>
      <div className="modal-panel energy-popup" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">⚡ {t('ui.energy')}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "var(--font-score)" }}>
            {energyCount} / {GAME.MAX_ENERGY}
          </div>
          <div style={{ fontSize: 12, opacity: 0.55, fontFamily: "var(--font-ui)", marginTop: 4 }}>
            {t('ui.refill_1')} {Math.round(GAME.ENERGY_REGEN_MS / 60000)} min
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn-ghost" style={{ width: "100%" }}
            disabled={energyCount >= GAME.MAX_ENERGY || dust < GAME.DUST_PER_ENERGY}
            onClick={onRefill1}>
            {t('ui.refill_1')} - {GAME.DUST_PER_ENERGY} 💜
          </button>
          <button className="btn-primary" style={{ width: "100%" }}
            disabled={energyCount >= GAME.MAX_ENERGY || dust < fullCost}
            onClick={onRefillFull}>
            {t('ui.refill_full')} - {fullCost} 💜
          </button>
        </div>
      </div>
    </div>
  );
});

```

## FILE: components/Settings/SettingsDrawer.tsx
```tsx
import React, { useState, useCallback } from "react";
import { PillRow } from "./PillRow";
import { ElasticSlider } from "./ElasticSlider";
import { i18n, type Locale } from "../../utils/i18n";
import { useTranslation } from "../../hooks/useTranslation";
import { useFocusTrap } from "../../hooks/useFocusTrap";

type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

interface SettingsDrawerProps {
  colorblindMode: ColorblindMode;
  setColorblindMode: (mode: ColorblindMode) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  haptics: boolean;
  setHaptics: (enabled: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  screenShake: boolean;
  setScreenShake: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  isFS: boolean;
  toggleFS: () => void;
  onClose: () => void;
  onNameChange?: () => void;
  playerName?: string;
  onOpenBuildDeploy?: () => void;
  customSeed?: string;
  onCustomSeedChange?: (v: string) => void;
  onPlayWithSeed?: () => void;
  currentLocale?: Locale;
  setCurrentLocale?: (locale: Locale) => void;
}

export function SettingsDrawer({
  colorblindMode,
  setColorblindMode,
  theme,
  setTheme,
  muted,
  setMuted,
  haptics,
  setHaptics,
  volume,
  setVolume,
  screenShake,
  setScreenShake,
  reducedMotion,
  setReducedMotion,
  isFS,
  toggleFS,
  onClose,
  onNameChange,
  playerName,
  onOpenBuildDeploy: _onOpenBuildDeploy,
  customSeed,
  onCustomSeedChange,
  onPlayWithSeed,
  currentLocale,
  setCurrentLocale,
}: SettingsDrawerProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const [localVolume, setLocalVolume] = useState(volume);
  const commitVolume = useCallback((v: number) => { setVolume(v); }, [setVolume]);
  const handleLocaleChange = (lang: Locale) => {
    i18n.set(lang);
    setCurrentLocale?.(lang);
  };
  return (
    <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label={t('settings.title')} onClick={onClose} ref={trapRef}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">{t('settings.title')}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.appearance')}</div>
          <PillRow<"dark" | "light">
            options={[{ value: "dark", label: t('settings.dark') }, { value: "light", label: t('settings.light') }]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.sound')}</div>
          <div className="vol-row">
            <button
              className={`vol-mute-btn${muted ? " vol-mute-btn--muted" : ""}`}
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.7 ? "🔉" : "🔊"}
            </button>
            <div style={{ flex: 1 }}>
              <ElasticSlider
                value={muted ? 0 : Math.round(localVolume * 100)}
                onChange={(v) => {
                  const normalized = v / 100;
                  setLocalVolume(normalized);
                  commitVolume(normalized);
                }}
                min={0}
                max={100}
                step={5}
                disabled={muted}
                leftLabel="🔈"
                rightLabel="🔊"
              />
            </div>
            <span className="vol-pct">{muted ? t('settings.muted_label') : `${Math.round(volume * 100)}%`}</span>
          </div>
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.screen_shake')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('settings.on') }, { value: "off", label: t('settings.off') }]}
            value={screenShake ? "on" : "off"}
            onChange={(v) => setScreenShake(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.haptics')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "on", label: t('settings.on') }, { value: "off", label: t('settings.off') }]}
            value={haptics ? "on" : "off"}
            onChange={(v) => setHaptics(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.reduced_motion')}</div>
          <PillRow<"on" | "off">
            options={[{ value: "off", label: t('settings.arcade') }, { value: "on", label: t('settings.calm') }]}
            value={reducedMotion ? "on" : "off"}
            onChange={(v) => setReducedMotion(v === "on")}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.display')}</div>
          <PillRow<"window" | "full">
            options={[{ value: "window", label: t('settings.window') }, { value: "full", label: t('settings.fullscreen') }]}
            value={isFS ? "full" : "window"}
            onChange={() => toggleFS()}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.colorblind')}</div>
          <PillRow<ColorblindMode>
            options={[
              { value: "none", label: t('settings.none') },
              { value: "deuteranopia", label: t('settings.deuter') },
              { value: "protanopia", label: t('settings.protan') },
              { value: "tritanopia", label: t('settings.tritan') },
              { value: "monochrome", label: t('settings.mono') },
            ]}
            value={colorblindMode}
            onChange={setColorblindMode}
          />
        </div>

        <div className="opt-section">
          <div className="opt-label">{t('settings.language')}</div>
          <PillRow<Locale>
            options={i18n.getAvailable().map(lang => ({
              value: lang,
              label: lang === 'en' ? 'English' : lang === 'es' ? 'Español' : lang === 'ja' ? '日本語' : lang === 'pt' ? 'Português' : 'Français'
            }))}
            value={currentLocale ?? i18n.current}
            onChange={handleLocaleChange}
          />
        </div>

        {onNameChange && (
          <div className="opt-section">
            <div className="opt-label">{t('settings.player_name')}{playerName ? ` · ${playerName}` : ""}</div>
            <button
              className="btn-ghost"
              style={{ width: "100%", textAlign: "center", transition: "opacity 0.2s" }}
              onClick={() => { onClose(); setTimeout(onNameChange, 150); }}
            >
              {t('settings.change_name')}
            </button>
          </div>
        )}

        {onPlayWithSeed && (
          <div className="opt-section">
            <div className="opt-label">{t('settings.replay_seed')}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="name-input"
                style={{ flex: 1, minWidth: 0 }}
                placeholder={t('settings.enter_seed')}
                value={customSeed ?? ""}
                onChange={e => onCustomSeedChange?.(e.target.value.replace(/\D/g, ""))}
                maxLength={12}
              />
              <button
                className="btn-primary btn-sm"
                disabled={!customSeed}
                onClick={onPlayWithSeed}
              >▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

## FILE: components/Settings/BuildDeploySection.tsx
```tsx
import React, { useState, useCallback } from "react";
import { DIFFICULTY } from "../../config/difficulty";
import { applyOverride, clearOverrides } from "../../config/difficultyOverrides";

interface SliderDef {
  key: keyof typeof DIFFICULTY;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  help: string;
}

const SLIDERS: SliderDef[] = [
  { key: "INIT_MS",     label: "Initial Tick (ms)",   min: 500, max: 4000, step: 50,
    format: v => v + "ms", help: "Starting tick interval. Higher = slower start." },
  { key: "MIN_MS",      label: "Min Tick (ms)",        min: 200, max: 800,  step: 10,
    format: v => v + "ms", help: "Fastest possible tick. Higher = easier ceiling." },
  { key: "DECAY_EXP",   label: "Decay Exponent",       min: 0.90, max: 0.999, step: 0.001,
    format: v => v.toFixed(3), help: "Per-step speed multiplier. Lower = faster ramp." },
  { key: "DECAY_EVERY", label: "Decay Every N taps",   min: 1, max: 20, step: 1,
    help: "How many taps between each decay step." },
  { key: "SPIN_BASE_DURATION", label: "Spin Base (s)", min: 4, max: 30, step: 0.5,
    format: v => v + "s", help: "Base rotation period at spin level 0." },
  { key: "SPIN_SPEED_CAP",     label: "Spin Speed Cap", min: 1, max: 5, step: 0.1,
    format: v => v.toFixed(1) + "×", help: "Max spin speed multiplier." },
  { key: "SPIN_GROWTH",  label: "Spin Growth/level",   min: 0.01, max: 0.15, step: 0.005,
    format: v => "+" + (v * 100).toFixed(1) + "%", help: "Speed increase per spin level." },
  { key: "SPIN_EPOCH_LEVELS", label: "Direction Flip", min: 1, max: 10, step: 1,
    help: "Spin direction flips every N levels." },
];

interface BuildDeploySectionProps {
  onClose: () => void;
}

export function BuildDeploySection({ onClose }: BuildDeploySectionProps) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as Record<string, number>)[s.key]]))
  );
  const [livePreview, setLivePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = useCallback((key: string, v: number) => {
    setVals(prev => {
      const next = { ...prev, [key]: v };
      if (livePreview) {
        applyOverride(key as keyof typeof DIFFICULTY, v);
      }
      return next;
    });
  }, [livePreview]);

  const togglePreview = () => {
    setLivePreview(p => {
      if (!p) {
        // Apply all current vals
        SLIDERS.forEach(s => applyOverride(s.key, vals[s.key]));
      } else {
        clearOverrides();
      }
      return !p;
    });
  };

  const reset = () => {
    const defaults = Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as Record<string, number>)[s.key]]));
    setVals(defaults);
    clearOverrides();
    if (livePreview) {
      SLIDERS.forEach(s => applyOverride(s.key, (DIFFICULTY as Record<string, number>)[s.key]));
    }
  };

  const generateScript = () => {
    const lines = [
      "// ─── Difficulty scaling constants ──────────────────────────────────",
      "export const DIFFICULTY = {",
      ...SLIDERS.map(s => `  ${s.key}: ${
        Number.isInteger(vals[s.key]) ? vals[s.key] : vals[s.key].toFixed(
          s.key === "DECAY_EXP" ? 3 : s.key === "SPIN_GROWTH" ? 3 : 2
        )
      },`),
      "} as const;",
    ].join("\n");
    navigator.clipboard?.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">⚙ Difficulty Tuning</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">Live Preview</div>
          <button
            className={livePreview ? "btn-primary" : "btn-ghost"}
            style={{ width: "100%" }}
            onClick={togglePreview}
          >
            {livePreview ? "🟢 Preview ON - changes affect live game" : "⚫ Preview OFF - safe to tune"}
          </button>
        </div>

        {SLIDERS.map(s => (
          <div key={s.key} className="opt-section">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="opt-label" title={s.help}>{s.label} ⓘ</div>
              <div className="opt-label" style={{ opacity: 0.7 }}>
                {s.format ? s.format(vals[s.key]) : vals[s.key]}
              </div>
            </div>
            <input type="range"
              className="devs-range"
              min={s.min} max={s.max} step={s.step}
              value={vals[s.key]}
              onChange={e => set(s.key, Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
              <span>{s.min}</span>
              <span>default: {(DIFFICULTY as Record<string, number>)[s.key]}</span>
              <span>{s.max}</span>
            </div>
          </div>
        ))}

        <div className="opt-section" style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={reset}>↺ Reset Defaults</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={generateScript}>
            {copied ? "✅ Copied!" : "📋 Copy difficulty.ts snippet"}
          </button>
        </div>

        <div style={{ fontSize: 10, opacity: 0.3, textAlign: "center", padding: "8px 0 4px" }}>
          Paste output into src/config/difficulty.ts → rebuild → deploy
        </div>
      </div>
    </div>
  );
}

```

## FILE: components/Backgrounds/ElasticWarp.tsx
```tsx
// components/Backgrounds/ElasticWarp.tsx — Gravitational particle vortex
// Glowing stars/dots that continuously gravitate toward the mouse cursor
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  glowIntensity: number;
  glowPhase: number;
  opacity: number;
}

const PARTICLE_COUNT = 120;
const GRAVITY = 0.0008;
const DAMPING = 0.985;
const MOUSE_RADIUS = 300;
const MAX_SPEED = 3.5;

const COLORS = [
  'rgba(191, 64, 255,',   // purple
  'rgba(138, 43, 226,',   // blue-violet
  'rgba(255, 105, 180,',  // pink
  'rgba(100, 149, 237,',  // cornflower blue
  'rgba(200, 160, 255,',  // light lavender
  'rgba(160, 120, 240,',  // medium purple
  'rgba(255, 200, 255,',  // light pink
  'rgba(120, 180, 255,',  // sky blue
];

function createParticle(w: number, h: number): Particle {
  const x = Math.random() * w;
  const y = Math.random() * h;
  const baseRadius = 1 + Math.random() * 2.5;
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: baseRadius,
    baseRadius,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    glowIntensity: 0.3 + Math.random() * 0.7,
    glowPhase: Math.random() * Math.PI * 2,
    opacity: 0.4 + Math.random() * 0.6,
  };
}

export default function ElasticWarp({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || reducedMotion) return;

    const maybeCtx = canvasEl.getContext('2d');
    if (!maybeCtx) return;
    // Store in consts so TypeScript narrows inside nested closures
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const mouse = { x: w / 2, y: h / 2 };
    let animationId: number;
    const particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    // Initialize particles
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(w, h));
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }

    function draw(time: number) {
      if (document.hidden) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Dark background
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, w, h);

      const t = time * 0.001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gravitational pull toward mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 1) {
          // Gravity strength falls off with distance, capped at MOUSE_RADIUS
          const influence = Math.min(1, MOUSE_RADIUS / dist);
          const force = GRAVITY * influence;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        // Gentle return-to-rest force (prevents particles from orbiting forever)
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Pulse radius based on proximity to mouse
        const proximity = Math.max(0, 1 - dist / MOUSE_RADIUS);
        p.radius = p.baseRadius * (1 + proximity * 1.5);

        // Glow intensity pulses
        const glowPulse = Math.sin(t * 2 + p.glowPhase) * 0.3 + 0.7;
        const intensity = p.glowIntensity * glowPulse * (0.6 + proximity * 0.8);
        const alpha = p.opacity * (0.5 + proximity * 0.5);

        // Draw glow
        const glowRadius = p.radius * (3 + proximity * 4);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        gradient.addColorStop(0, p.color + (alpha * intensity * 0.8) + ')');
        gradient.addColorStop(0.4, p.color + (alpha * intensity * 0.3) + ')');
        gradient.addColorStop(1, p.color + '0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = p.color + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core for larger particles
        if (p.baseRadius > 2) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw connection lines between nearby particles near cursor
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const lineDist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (lineDist < 80) {
            const midDistToMouse = Math.sqrt(
              ((a.x + b.x) / 2 - mouse.x) ** 2 +
              ((a.y + b.y) / 2 - mouse.y) ** 2
            );
            const lineAlpha = (1 - lineDist / 80) * Math.min(1, MOUSE_RADIUS / midDistToMouse) * 0.15;
            ctx.strokeStyle = `rgba(180, 130, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas"
      aria-hidden="true"
    />
  );
}

```

## FILE: hooks/useGameEngine.ts
```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import { GameEngine } from "../engine/GameEngine";
import { logger } from "../utils/logger";
import type { GameConfig, GameEvent, GameSnapshot, Winner, StoredPowerups } from "../engine/types";
import { LS_KEYS, GAME } from "../config/difficulty";
import { haptics } from "../utils/haptics";
import {
  setAudioMuted,
  setAudioVolume,
  setHapticsEnabled,
  playVolumeChime,
  playSoundEffect,
  playSound,
} from "./useAudio";

export { setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime, playSoundEffect };
export function loadStoredPwr(): StoredPowerups {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) {
      const d = JSON.parse(r);
      return { freeze: d.freeze ?? 0, shield: d.shield ?? 0, mult: d.mult ?? 0, heart: d.heart ?? 0 };
    }
  } catch (e) {
    // Fix #8: Add logging for storage failures
    logger.error('Failed to load stored powerups', e);
  }
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

export function saveStoredPwr(d: StoredPowerups): void {
  try { 
    localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); 
  } catch (e) {
    logger.error('Failed to save stored powerups', e);
  }
}

// ─── Bot FX type ──────────────────────────────────────────────────
export type BotTapFx = { id: string; idx: number; dustCost: number; at: number; };

// ─── Hook return type ─────────────────────────────────────────────
export interface UseGameEngineReturn {
  snapshot:    GameSnapshot | null;
  snapshotRef: React.MutableRefObject<GameSnapshot | null>;
  heartAnimP1: boolean;
  heartAnimP2: boolean;
  shakeGrid1:  boolean;
  shakeGrid2:  boolean;
  toast:       string | null;
  pwrToastP1:  string | null;
  pwrToastP2:  string | null;
  levelUpBadge: string | null;
  rareSplash:  { color: string; cssColor: string } | null;
  winner:      Winner;
  start:       (forceSeed?: number) => void;
  pause:       () => void;
  resume:      () => void;
  handleTap:        (player: 1 | 2, idx: number) => void;
  handleHoldStart:  (player: 1 | 2, idx: number) => void;
  handleHoldEnd:    (player: 1 | 2, idx: number) => void;
  activateStoredFreeze: (player: 1 | 2) => void;
  activateStoredShield: (player: 1 | 2) => void;
  devForceStage:   (stage: number) => void;
  devForcePattern: (idx: number) => void;
  devForceRare:    (r: { color: string; cssColor: string } | null) => void;
  devSetGodMode:   (v: boolean) => void;
  devSetFreezeTime:(v: boolean) => void;
  devSetRotationSpeed: (v: number) => void;
  devSpawnPowerup: (type: "shield" | "freeze" | "heart") => void;
  devSpawnSpecialCell: (player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => void;
  devTriggerBotTap: (player: 1 | 2, idx: number, dustCost?: number) => void;
  devToggleBotAssist: (player: 1 | 2, enabled: boolean) => void;
  startBot: () => void;
  stopBot: () => void;
  isBotActive: () => boolean;
  setBotAssist: (player: 1 | 2, enabled: boolean) => void;
  botAssistActive: { 1: boolean; 2: boolean };
  botTapHighlights: { 1: Record<number, number>; 2: Record<number, number> };
  botTapFx: BotTapFx[];
  scoreFloats: { id: number; player: 1 | 2; idx: number; amount: number }[];
  lastGameScore: number | null;
  getAutoLowQuality: () => boolean;
  generateChallengeUrl: () => Promise<string>;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGameEngine(
  config: GameConfig,
  onGameOver: (winner: Winner, p1Score: number, p2Score: number, gameSeed?: number) => void,
  dustCallbacks?: {
    getDust: () => number;
    spendDust: (amount: number) => void;
    getAccuracy: () => number;
  },
  onDamage?: () => void,
  onBossEvent?: (bossType: string) => void,
  onBombDefused?: () => void,
): UseGameEngineReturn {
  const engineRef  = useRef<GameEngine | null>(null);
  const mountedRef = useRef(true);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const snapshotRef = useRef<GameSnapshot | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [heartAnimP1, setHA1]         = useState(false);
  const [heartAnimP2, setHA2]         = useState(false);
  const [shakeGrid1,  setShake1]      = useState(false);
  const [shakeGrid2,  setShake2]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [pwrToastP1,  setPwrToastP1]  = useState<string | null>(null);
  const [pwrToastP2,  setPwrToastP2]  = useState<string | null>(null);
  const [levelUpBadge, setLevelUpBadge] = useState<string | null>(null);
  const [rareSplash,  setRareSplash]  = useState<{ color: string; cssColor: string } | null>(null);
  const [winner,      setWinner]      = useState<Winner>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);
  const [botAssistActive, setBotAssistActiveState] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [botTapHighlights, setBotTapHighlights] = useState<{ 1: Record<number, number>; 2: Record<number, number> }>({ 1: {}, 2: {} });
  const [botTapFx, setBotTapFx] = useState<BotTapFx[]>([]);
  const [scoreFloats, setScoreFloats] = useState<{ id: number; player: 1 | 2; idx: number; amount: number }[]>([]);
  const scoreFloatIdRef = useRef(0);
  const pendingScoreFloatsRef = useRef<{ id: number; player: 1 | 2; idx: number; amount: number }[]>([]);
  const scoreFloatRafRef = useRef<number | null>(null);

  const toastTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rareSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwrToastP2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha1TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ha2TimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake1TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake2TimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botTapTimersRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const peakStreakRef     = useRef(0);

  const toast$ = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, GAME.TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const engineConfig: GameConfig = {
      ...config,
      storage: { loadStoredPowerups: loadStoredPwr, saveStoredPowerups: saveStoredPwr },
      ...(dustCallbacks ? {
        botAssist: {
          enabled: false,
          getDust: dustCallbacks.getDust,
          spendDust: dustCallbacks.spendDust,
          getAccuracy: dustCallbacks.getAccuracy,
        }
      } : {})
    };
    const engine = new GameEngine(engineConfig);
    engineRef.current = engine;

    const unsub = engine.subscribe((event: GameEvent) => {
      if (!mountedRef.current) return;

      switch (event.type) {
        case "tick": {
          // PERF-004: Always update ref for non-render consumers (bot, handlers)
          snapshotRef.current = event.snapshot;
          if (mountedRef.current) setSnapshot(event.snapshot);
          {
            const snap = event.snapshot;
            if (snap && snap.p1.streak > (peakStreakRef.current ?? 0)) {
              peakStreakRef.current = snap.p1.streak;
            }
          }
          break;
        }
        case "sound": playSound(event.name, event.pitchMult); break;
        case "scoreFloat": {
          // PERF-003: buffer floats and flush once per RAF frame to avoid per-tap re-renders
          const id = ++scoreFloatIdRef.current;
          pendingScoreFloatsRef.current.push({ id, player: event.player, idx: event.idx, amount: event.amount });
          if (!scoreFloatRafRef.current) {
            scoreFloatRafRef.current = requestAnimationFrame(() => {
              scoreFloatRafRef.current = null;
              const batch = pendingScoreFloatsRef.current.splice(0);
              if (batch.length && mountedRef.current)
                setScoreFloats(prev => [...prev.slice(-(10 - batch.length)), ...batch]);
            });
          }
          const floatTimer = setTimeout(() => {
            if (mountedRef.current) setScoreFloats(prev => prev.filter(f => f.id !== id));
            botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== floatTimer);
          }, 800);
          botTapTimersRef.current.push(floatTimer);
          break;
        }
        case "toast": toast$(event.message); break;
        case "pwrToast":
          if (event.player === 1) {
            setPwrToastP1(event.message);
            if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
            pwrToastP1TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP1(null); }, GAME.PWR_TOAST_DURATION_MS);
          } else {
            setPwrToastP2(event.message);
            if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
            pwrToastP2TimerRef.current = setTimeout(() => { if (mountedRef.current) setPwrToastP2(null); }, GAME.PWR_TOAST_DURATION_MS);
          }
          break;
      case "damage":
        if (event.player === 1) {
          setHA1(true);
          if (ha1TimerRef.current) clearTimeout(ha1TimerRef.current);
          ha1TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA1(false); }, GAME.HEART_ANIM_MS);
        } else {
          setHA2(true);
          if (ha2TimerRef.current) clearTimeout(ha2TimerRef.current);
          ha2TimerRef.current = setTimeout(() => { if (mountedRef.current) setHA2(false); }, GAME.HEART_ANIM_MS);
        }
        onDamage?.();
        break;
        case "shake":
          if (event.player === 1) {
            setShake1(true);
            if (shake1TimerRef.current) clearTimeout(shake1TimerRef.current);
            shake1TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake1(false); }, GAME.SHAKE_ANIM_MS);
          } else {
            setShake2(true);
            if (shake2TimerRef.current) clearTimeout(shake2TimerRef.current);
            shake2TimerRef.current = setTimeout(() => { if (mountedRef.current) setShake2(false); }, GAME.SHAKE_ANIM_MS);
          }
          break;
        case "levelUp":
          if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
          setLevelUpBadge(`Stage ${event.stage}`);
          levelUpTimerRef.current = setTimeout(() => { if (mountedRef.current) setLevelUpBadge(null); }, GAME.LEVELUP_BADGE_MS);
          break;
        case "rareStart":
          setRareSplash({ color: event.color, cssColor: event.cssColor });
          if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
          rareSplashTimerRef.current = setTimeout(() => { if (mountedRef.current) setRareSplash(null); }, GAME.RARE_SPLASH_MS);
          break;
        case "gameOver": {
          if (!engineRef.current) break;
          const snap2 = engine.getSnapshot(); const seedAtGameOver = snap2.gameSeed;
          // Death vignette flash + haptic burst
          document.body.classList.add('death-flash');
          if (deathFlashTimerRef.current) clearTimeout(deathFlashTimerRef.current);
          deathFlashTimerRef.current = setTimeout(() => document.body.classList.remove('death-flash'), 800);
          haptics.damage();
          if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
          gameOverTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setWinner(event.winner);
            setLastGameScore(config.numPlayers === 1 ? snap2.p1.score : Math.max(snap2.p1.score, snap2.p2?.score ?? 0));
            onGameOverRef.current(event.winner, snap2.p1.score, snap2.p2?.score ?? 0, seedAtGameOver);
          }, GAME.GAME_OVER_DELAY_MS);
          break;
        }
        case "botTap": {
          // dust spend is already done in engine, just trigger re-render via dustCallbacks
          if (dustCallbacks) dustCallbacks.spendDust(0);
          setBotTapHighlights(prev => ({
            ...prev,
            [event.player]: { ...prev[event.player], [event.idx]: Date.now() },
          }));
          const highlightTimer = setTimeout(() => {
            if (!mountedRef.current) return;
            setBotTapHighlights(prev => {
              const nextPlayer = { ...prev[event.player] };
              delete nextPlayer[event.idx];
              return { ...prev, [event.player]: nextPlayer };
            });
            botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== highlightTimer);
          }, 420);
          botTapTimersRef.current.push(highlightTimer);
          // Track per-tap dust cost for floating marker
          if (event.dustCost) {
            const fx: BotTapFx = {
              id: `bot-fx-${event.player}-${event.idx}-${Date.now()}`,
              idx: event.idx,
              dustCost: event.dustCost,
              at: Date.now(),
            };
            setBotTapFx(prev => [...prev, fx]);
            const fxTimer = setTimeout(() => {
              if (mountedRef.current) setBotTapFx(prev => prev.filter(f => f.id !== fx.id));
              botTapTimersRef.current = botTapTimersRef.current.filter(t => t !== fxTimer);
            }, 650);
            botTapTimersRef.current.push(fxTimer);
          }
          break;
        }
        case "bossStart":
          onBossEvent?.(event.bossType);
          break;
        case "bombDefused":
          onBombDefused?.();
          break;
        case "qualityDowngrade":
          toast$("📉 Performance mode: Particles disabled");
          break;
        case "qualityUpgrade":
          toast$("📈 Standard mode restored");
          break;
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
      engine.destroy();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally read the latest ref value in cleanup
      const rafId = rafIdRef.current;
      if (rafId) cancelAnimationFrame(rafId);
      if (scoreFloatRafRef.current) cancelAnimationFrame(scoreFloatRafRef.current);
      if (toastTimerRef.current)      clearTimeout(toastTimerRef.current);
      if (pwrToastP1TimerRef.current) clearTimeout(pwrToastP1TimerRef.current);
      if (pwrToastP2TimerRef.current) clearTimeout(pwrToastP2TimerRef.current);
      if (levelUpTimerRef.current)    clearTimeout(levelUpTimerRef.current);
      if (rareSplashTimerRef.current) clearTimeout(rareSplashTimerRef.current);
      if (ha1TimerRef.current)        clearTimeout(ha1TimerRef.current);
      if (ha2TimerRef.current)        clearTimeout(ha2TimerRef.current);
      if (shake1TimerRef.current)     clearTimeout(shake1TimerRef.current);
      if (shake2TimerRef.current)     clearTimeout(shake2TimerRef.current);
      if (gameOverTimerRef.current)   clearTimeout(gameOverTimerRef.current);
      if (deathFlashTimerRef.current) clearTimeout(deathFlashTimerRef.current);
      // Issue 16: Remove death-flash class on unmount in case component unmounts during animation
      document.body.classList.remove('death-flash');
      // Fix #9: Cap botTapTimersRef cleanup to prevent unbounded growth
      botTapTimersRef.current.forEach(clearTimeout);
      botTapTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config object excluded; individual fields tracked to avoid unnecessary engine re-creation
  }, [config.mode, config.numPlayers, config.speedMult, dustCallbacks, onBombDefused, onBossEvent, onDamage, toast$]);

  const startBot = useCallback(() => engineRef.current?.startBot(), []);
  const stopBot  = useCallback(() => engineRef.current?.stopBot(), []);
  const isBotActive = useCallback(() => engineRef.current?.isBotActive() ?? false, []);

  const setBotAssist = useCallback((player: 1 | 2, enabled: boolean) => {
    engineRef.current?.setBotAssist(player, enabled);
    setBotAssistActiveState(prev => ({ ...prev, [player]: enabled }));
  }, []);

  const pause  = useCallback(() => engineRef.current?.pause(),  []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const handleTap = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleTap(player, idx), []);
  const handleHoldStart = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldStart(player, idx), []);
  const handleHoldEnd = useCallback((player: 1 | 2, idx: number) => engineRef.current?.handleHoldEnd(player, idx), []);
  const activateStoredFreeze = useCallback((player: 1 | 2) => engineRef.current?.activateStoredFreeze(player), []);
  const activateStoredShield = useCallback((player: 1 | 2) => engineRef.current?.activateStoredShield(player), []);
  const devForceStage   = useCallback((s: number) => engineRef.current?.devForceStage(s),   []);
  const devForcePattern = useCallback((i: number) => engineRef.current?.devForcePattern(i),  []);
  const devForceRare    = useCallback((r: { color: string; cssColor: string } | null) => engineRef.current?.devForceRare(r), []);
  const devSetGodMode   = useCallback((v: boolean) => engineRef.current?.devSetGodMode(v), []);
  const devSetFreezeTime= useCallback((v: boolean) => engineRef.current?.devSetFreezeTime(v), []);
  const devSetRotationSpeed = useCallback((v: number) => engineRef.current?.devSetRotationSpeed(v), []);
  const devSpawnPowerup = useCallback((type: "shield" | "freeze" | "heart") => engineRef.current?.devSpawnPowerup(type), []);
  const devSpawnSpecialCell = useCallback((player: 1 | 2, type: "ice" | "hold" | "bomb" | "rare", idx?: number) => engineRef.current?.devSpawnSpecialCell(player, type, idx), []);
  const devTriggerBotTap = useCallback((player: 1 | 2, idx: number, dustCost?: number) => engineRef.current?.devTriggerBotTap(player, idx, dustCost), []);
  const devToggleBotAssist = useCallback((player: 1 | 2, enabled: boolean) => engineRef.current?.devToggleBotAssist(player, enabled), []);
  const getAutoLowQuality = useCallback(() => engineRef.current?.getAutoLowQuality() ?? false, []);

  const generateChallengeUrl = useCallback(async (): Promise<string> => {
    return (await engineRef.current?.generateChallengeUrl()) ?? '';
  }, []);

  const wrappedStart = useCallback((forceSeed?: number) => {
    setWinner(null);
    setLastGameScore(null);
    setRareSplash(null);
    setLevelUpBadge(null);
    setBotTapHighlights({ 1: {}, 2: {} });
    setScoreFloats([]);
    engineRef.current?.start(forceSeed);
  }, []);

  return {
    snapshot, snapshotRef, heartAnimP1, heartAnimP2, shakeGrid1, shakeGrid2, toast, pwrToastP1, pwrToastP2, levelUpBadge, rareSplash, winner, lastGameScore,
    start: wrappedStart, pause, resume, handleTap, handleHoldStart, handleHoldEnd,
    activateStoredFreeze, activateStoredShield, devForceStage, devForcePattern, devForceRare,
    devSetGodMode, devSetFreezeTime, devSetRotationSpeed, devSpawnPowerup,
    devSpawnSpecialCell, devTriggerBotTap, devToggleBotAssist,
    startBot, stopBot, isBotActive, setBotAssist, botAssistActive, botTapHighlights, botTapFx, scoreFloats,
    getAutoLowQuality, generateChallengeUrl,
  };
}

```

## FILE: hooks/useThemeSettings.ts
```typescript
import { useState, useEffect, useCallback } from "react";
import { settingsManager } from "../utils/settings";
import { SHOP_THEMES } from "../config/powerupWeights";
import type { ShopData } from "../utils/shop-storage";

export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

export function useThemeSettings(shopData: ShopData) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [isFS, setIsFS] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOffset, setShowOffset] = useState(() => settingsManager.get().offsetPointer ?? false);
  const [showFps, setShowFps] = useState(() => localStorage.getItem("showFps") === "true");
  const [fps, setFps] = useState(0);

  // Offset pointer persistence
  useEffect(() => { settingsManager.set({ offsetPointer: showOffset }); }, [showOffset]);

  // Theme class toggle + lazy CSS load
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      import("../styles/light-theme.css");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Apply shop theme CSS variables
  useEffect(() => {
    const t = SHOP_THEMES.find(t => t.id === shopData.equippedTheme);
    if (!t || t.id === "default") {
      ["--theme-purple", "--theme-accent", "--theme-bg", "--theme-text", "--bg", "--purple", "--accent", "--text"]
        .forEach(p => document.documentElement.style.removeProperty(p));
      return;
    }
    document.documentElement.style.setProperty("--theme-purple", t.colors.purple);
    document.documentElement.style.setProperty("--theme-accent", t.colors.accent);
    document.documentElement.style.setProperty("--theme-bg", t.colors.bg);
    document.documentElement.style.setProperty("--theme-text", t.colors.text);
    document.documentElement.style.setProperty("--bg", t.colors.bg);
    document.documentElement.style.setProperty("--purple", t.colors.purple);
    document.documentElement.style.setProperty("--accent", t.colors.accent);
    document.documentElement.style.setProperty("--text", t.colors.text);
  }, [shopData.equippedTheme]);

  // FPS Monitor
  useEffect(() => {
    if (!showFps) return;
    let frameId = 0;
    let frameCount = 0;
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 500) {
        setFps(Math.round(1000 / (delta / (frameCount || 1))));
        lastTime = now;
        frameCount = 0;
      }
      frameCount++;
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [showFps]);

  // F key → toggle FPS overlay
  useEffect(() => {
    const handleFpsKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "f" || e.key === "F") {
        setShowFps(prev => {
          const next = !prev;
          localStorage.setItem("showFps", String(next));
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleFpsKey);
    return () => window.removeEventListener("keydown", handleFpsKey);
  }, []);

  // Fullscreen toggle
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFS(true)).catch(() => setIsFS(f => !f));
    } else {
      document.exitFullscreen?.().then(() => setIsFS(false));
    }
  }, []);

  const equippedTheme = SHOP_THEMES.find(t => t.id === shopData.equippedTheme) || SHOP_THEMES[0];

  return {
    theme, setTheme,
    colorblindMode, setColorblindMode,
    isFS, toggleFS,
    settingsOpen, setSettingsOpen,
    showOffset, setShowOffset,
    showFps, setShowFps, fps,
    equippedTheme,
  };
}

```

## FILE: hooks/useDevToolsState.ts
```typescript
import { useState } from "react";

export function useDevToolsState() {
  const [devMode, setDevMode] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap] = useState<Record<number, number>>({});

  return {
    devMode, setDevMode,
    godMode, setGodMode,
    devFreezeTime, setDevFreezeTime,
    devRotationSpeed, setDevRotationSpeed,
    devAutoPlay, setDevAutoPlay,
    devHeatmap, setDevHeatmap,
  };
}

```

## FILE: services/firebase.ts
```typescript
 
type FirebaseAppInstance = { name: string; options: Record<string, unknown>; automaticDataCollectionEnabled: boolean };

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};



const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" ||
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export interface GlobalLeaderboardEntry {
  score: number;
  initials: string;
  date: string;
  mode: "classic" | "evolve";
  badge?: string;
}

export function todayISODate(now = new Date()): string {
  return now.toISOString().split("T")[0];
}

export function normalizeGlobalScoreEntry(entry: GlobalLeaderboardEntry): GlobalLeaderboardEntry {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date : todayISODate();
  const safe: GlobalLeaderboardEntry = {
    score: Math.max(0, Math.min(9999, Math.floor(entry.score))),
    initials: entry.initials.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player",
    date,
    mode: entry.mode === "evolve" ? "evolve" : "classic",
  };
  if (entry.badge) safe.badge = entry.badge.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return safe;
}

export async function getDB(): Promise<unknown> {
  if (!IS_PROD) return null;
  await ensureAuth(); // Sign in anonymously before any Firestore operations
  return await ensureFirestore();
}

// Lazy Firebase initialization - only load when first Firebase operation is needed
let firebaseApp: unknown = null;
let firestoreDb: unknown = null;
let authReady: Promise<void> | null = null;

/** Sign in anonymously so Firestore rules can verify request.auth != null */
async function ensureAuth(): Promise<void> {
  if (authReady) return authReady;
  authReady = (async () => {
    try {
      const app = await ensureFirebaseApp();
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const auth = getAuth(app as FirebaseAppInstance);
      if (auth.currentUser) return; // Already signed in
      await signInAnonymously(auth);
    } catch (err) {
      // Auth failure is non-fatal — Firestore rules will reject unauthenticated writes
      console.warn('[firebase] Auth failed, Firestore ops will be unauthenticated:', err);
      authReady = null; // Allow retry
    }
  })();
  return authReady;
}

type FirebaseModuleFunctions = {
  collection: (db: unknown, path: string) => unknown;
  addDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  serverTimestamp: () => Record<string, unknown>;
  query: (...args: unknown[]) => unknown;
  orderBy: (field: string, direction: string) => unknown;
  limit: (n: number) => unknown;
  getDocs: (query: unknown) => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }>;
  doc: (db: unknown, collection: string, id: string) => unknown;
  setDoc: (ref: unknown, data: Record<string, unknown>) => Promise<void>;
  where: (field: string, op: string, value: unknown) => unknown;
  getAnalytics: (app: unknown) => unknown;
  isSupported: () => Promise<boolean>;
  logEvent: (analytics: unknown, name: string, data: Record<string, unknown>) => void;
};

let firebaseModules: FirebaseModuleFunctions | null = null;

async function ensureFirebaseApp(): Promise<unknown> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import("firebase/app");
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);

  // Initialize App Check in production to prevent programmatic abuse
  if (IS_PROD) {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      const siteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        initializeAppCheck(firebaseApp as Parameters<typeof initializeAppCheck>[0], {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
    } catch {
      // App Check optional — fails gracefully if not configured
    }
  }

  return firebaseApp;
}

async function ensureFirestore(): Promise<unknown> {
  if (firestoreDb) return firestoreDb;

  const app = await ensureFirebaseApp();
  const { getFirestore } = await import("firebase/firestore");
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

async function ensureFirebaseModules(): Promise<FirebaseModuleFunctions> {
  if (firebaseModules) return firebaseModules;

  const [firestoreMod, analyticsMod] = await Promise.all([
    import("firebase/firestore"),
    import("firebase/analytics")
  ]);

  firebaseModules = {
    // Firestore
    collection: (firestoreMod as { collection: unknown }).collection as FirebaseModuleFunctions['collection'],
    addDoc: (firestoreMod as { addDoc: unknown }).addDoc as FirebaseModuleFunctions['addDoc'],
    serverTimestamp: (firestoreMod as { serverTimestamp: unknown }).serverTimestamp as FirebaseModuleFunctions['serverTimestamp'],
    query: (firestoreMod as { query: unknown }).query as FirebaseModuleFunctions['query'],
    orderBy: (firestoreMod as { orderBy: unknown }).orderBy as FirebaseModuleFunctions['orderBy'],
    limit: (firestoreMod as { limit: unknown }).limit as FirebaseModuleFunctions['limit'],
    getDocs: (firestoreMod as { getDocs: unknown }).getDocs as FirebaseModuleFunctions['getDocs'],
    doc: (firestoreMod as { doc: unknown }).doc as FirebaseModuleFunctions['doc'],
    setDoc: (firestoreMod as { setDoc: unknown }).setDoc as FirebaseModuleFunctions['setDoc'],
    where: (firestoreMod as { where: unknown }).where as FirebaseModuleFunctions['where'],

    // Analytics
    getAnalytics: (analyticsMod as { getAnalytics: unknown }).getAnalytics as FirebaseModuleFunctions['getAnalytics'],
    isSupported: (analyticsMod as { isSupported: unknown }).isSupported as FirebaseModuleFunctions['isSupported'],
    logEvent: (analyticsMod as { logEvent: unknown }).logEvent as FirebaseModuleFunctions['logEvent'],
  };

  return firebaseModules;
}

export async function fbLogEvent(name: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<void> {
  if (!IS_PROD || typeof window === "undefined") return;
  try {
    const app = await getAppInstance();
    const modules = await ensureFirebaseModules();
    if (!(await modules.isSupported())) return;
    const analytics = modules.getAnalytics(app);
    const safeParams = Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key.slice(0, 40), typeof value === "string" ? value.slice(0, 100) : value])
    );
    modules.logEvent(analytics, name.slice(0, 40), safeParams);
  } catch {
    // Silently fail if logging fails
  }
}

export async function fbFetchTop20Global(): Promise<GlobalLeaderboardEntry[]> {
  const db = await getDB();
  if (!db) return [];
  const modules = await ensureFirebaseModules();
  const q = modules.query(modules.collection(db, "lb_global"), modules.orderBy("score", "desc"), modules.limit(20));
  const snap = await modules.getDocs(q);
  return snap.docs.map((doc: { data: () => Record<string, unknown> }) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      score: typeof data.score === "number" ? data.score : 0,
      initials: typeof data.initials === "string" ? data.initials : "???",
      date: typeof data.date === "string" ? data.date : "",
      mode: (data.mode === "evolve" ? "evolve" : "classic") as GlobalLeaderboardEntry["mode"],
      badge: typeof data.badge === "string" ? data.badge : "",
    };
  });
}

export async function fbSyncDust(name: string, dust: number): Promise<void> {
  const db = await getDB();
  const safeName = name.trim().slice(0, 20);
  if (!db || !safeName) return;
  const modules = await ensureFirebaseModules();
  const { getAuth } = await import("firebase/auth");
  const app = await ensureFirebaseApp();
  const auth = getAuth(app as FirebaseAppInstance);
  if (!auth.currentUser) return;
  // Match client-side max from useDustEconomy (9,999,999)
  const cappedDust = Math.max(0, Math.min(9_999_999, Math.floor(dust)));
  await modules.setDoc(modules.doc(db, "dust_wallet", auth.currentUser.uid), {
    name: safeName,
    dust: cappedDust,
    uid: auth.currentUser.uid,
    ts: modules.serverTimestamp(),
  });
}

async function getAppInstance(): Promise<FirebaseAppInstance> {
  return ensureFirebaseApp() as Promise<FirebaseAppInstance>;
}

function randomId(): string {
  try {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function getDeviceId(): string {
  try {
    // Only persist device ID if telemetry consent is granted
    if (localStorage.getItem('dtp:telemetry-consent') !== 'true') {
      return crypto.randomUUID?.() ?? randomId();
    }
    const key = "dtp-device-id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID?.() ?? randomId();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID?.() ?? randomId();
  }
}

export async function fbGetStreak(opts?: { clientDate?: string }): Promise<number> {
  try {
    if (!IS_PROD) return getLocalStreakFallback();
    await ensureAuth();
    const app = await getAppInstance();
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const func = httpsCallable(getFunctions(app), "updateStreak");
    const result = await func({ clientDate: opts?.clientDate, deviceId: getDeviceId() });
    const s = (result.data as { streak?: unknown }).streak;
    return typeof s === 'number' && isFinite(s) ? Math.max(0, Math.min(999, Math.floor(s))) : getLocalStreakFallback();
  } catch {
    return getLocalStreakFallback();
  }
}

function getLocalStreakFallback(): number {
  try {
    const raw = localStorage.getItem("dtp_login_streak");
    if (!raw) return 1;
    const c = JSON.parse(raw).count;
    return typeof c === 'number' && isFinite(c) ? Math.max(0, Math.min(999, Math.floor(c))) : 1;
  } catch { return 1; }
}

```

## FILE: config/difficulty.ts
```typescript
// ─── Difficulty scaling constants ────────────────────────────────
export const DIFFICULTY = {
  INIT_MS:    2000,
  MIN_MS:     420,   // raised floor (was 380) — slightly slower ceiling
  DECAY_EXP:  0.968, // gentler decay (was 0.960)
  DECAY_EVERY: 6,    // slower steps (was 5)
  // Spin / rotation
  SPIN_BASE_DURATION: 14,
  SPIN_SPEED_CAP:     2.2,
  SPIN_GROWTH:        0.05, // +5% faster per level
  SPIN_EPOCH_LEVELS:  4,    // direction flips every N levels
} as const;

// ─── Game balance constants ───────────────────────────────────────
export const GAME = {
  MAX_HEARTS:       5,
  STAGE_TAPS_NEEDED: 12,
  MAX_ENERGY:       5,
  ENERGY_REGEN_MS:  15 * 60 * 1000, // 15 min
  DUST_PER_ENERGY:  50,
  // Timing
  HUMAN_LIMIT_TICK: 420,
  SURVIVAL_BONUS_START_TICK: 60,
  HOLD_TIMEOUT_MS:  5000,
  KEY_PRESS_VISUAL_MS: 150,
  TOAST_DURATION_MS: 2200,
  PWR_TOAST_DURATION_MS: 2000,
  HEART_ANIM_MS:    420,
  SHAKE_ANIM_MS:    400,
  LEVELUP_BADGE_MS: 2200,
  RARE_SPLASH_MS:   5000,
  GAME_OVER_DELAY_MS: 400,
  CELL_ANIM_MS:     500,
  SHIELD_DROP_MS:   1100,
  TAP_BUFFER_MS:    50,
} as const;

// ─── localStorage keys ────────────────────────────────────────────
export const LS_KEYS = {
  P1_KEYS:      "dtp-keys-p1",
  P2_KEYS:      "dtp-keys-p2",
  LB_CLASSIC:   "dtp-lb-classic",
  LB_EVOLVE:    "dtp-lb-evolve",
  PRIVACY_OK:   "dtp-privacy-ok",
  PLAYER_NAME:  "dtp-player-name",
  DUST:         "dtp-dust",
  ENERGY:       "dtp-energy-data",
  SHOP:         "dtp-shop",
  WEEKLY_BONUS: "dtp-weekly-bonus",
  STORED_PWR:   "dtp-stored-pwr",
  BEST_CLASSIC: "dtp-best-classic",
  BEST_EVOLVE:  "dtp-best-evolve",
  ONBOARD_SEEN: "dtp-onboarding-v1",
} as const;

```

## FILE: utils/state-guard.ts
```typescript
import { logger } from './logger';

// SEC-012: Session integrity — key derived from sessionStorage nonce
// The nonce is written once when a game starts, survives page refresh,
// and ensures the same key is used for sign + verify across refreshes.
const SESSION_NONCE_KEY = 'dtp:session-nonce';

function getSessionNonce(): string {
  let nonce = sessionStorage.getItem(SESSION_NONCE_KEY);
  if (!nonce) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    nonce = btoa(String.fromCharCode(...arr));
    sessionStorage.setItem(SESSION_NONCE_KEY, nonce);
  }
  return nonce;
}

let _sessionKey: CryptoKey | null = null;
let _sessionKeyReady: Promise<CryptoKey> | null = null;

async function deriveKey(): Promise<CryptoKey> {
  const nonce = getSessionNonce();
  const nonceBytes = new TextEncoder().encode(nonce);
  const baseKey = await crypto.subtle.importKey(
    'raw', nonceBytes, { name: 'HKDF' }, false, ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('dtp-session-v1'), info: new Uint8Array(0) },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify'],
  );
  return key;
}

function getSessionKey(): Promise<CryptoKey> {
  if (_sessionKey) return Promise.resolve(_sessionKey);
  if (!_sessionKeyReady) {
    _sessionKeyReady = deriveKey().then(k => { _sessionKey = k; return k; });
  }
  return _sessionKeyReady;
}

function toBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signData(data: string): Promise<string> {
  const key = await getSessionKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64url(sig);
}

function fromBase64url(s: string): ArrayBuffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4);
  const bin = atob(padded);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function verifyData(data: string, sig: string): Promise<boolean> {
  const key = await getSessionKey();
  const sigBuf = fromBase64url(sig);
  return crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
}

export const stateGuard = {
  parse<T>(raw: string | null, fallback: T, validator?: (d: unknown) => boolean): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) throw new Error('Schema mismatch');
      return parsed as T;
    } catch (e) {
      logger.warn('State corruption detected, applying fallback', (e as Error).message);
      return fallback;
    }
  },

  safeStore(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if ((e as Error).name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded, clearing non-essential keys');
        // Only clear large/non-essential keys — preserve achievements, dust, settings
        const safeToClear = ['dtp:errors', 'dtp:perf'];
        safeToClear.forEach(k => localStorage.removeItem(k));
        try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* still full after cleanup */ }
      }
    }
  },

  sanitize<T extends Record<string, unknown>>(raw: unknown, defaults: T): T {
    if (!raw || typeof raw !== 'object') return defaults;
    const clean: Record<string, unknown> = {};
    for (const k of Object.keys(defaults)) {
      const val = (raw as Record<string, unknown>)[k];
      // Reject mismatched types — use default instead
      if (val != null && typeof val !== typeof defaults[k]) {
        clean[k] = defaults[k];
      } else {
        clean[k] = val ?? defaults[k];
      }
    }
    return clean as T;
  },

  /** SEC-012: Sign session data before writing to sessionStorage. */
  async signSession(data: string): Promise<string> {
    const sig = await signData(data);
    return JSON.stringify({ data, sig });
  },

  /** SEC-012: Verify and parse session data from sessionStorage. */
  async verifySession<T>(raw: string, fallback: T, validator?: (d: unknown) => boolean): Promise<T> {
    try {
      const envelope = JSON.parse(raw) as { data?: string; sig?: string };
      if (!envelope.data || !envelope.sig) return fallback;
      const valid = await verifyData(envelope.data, envelope.sig);
      if (!valid) {
        logger.warn('Session integrity check failed — rejecting tampered session');
        return fallback;
      }
      return stateGuard.parse<T>(envelope.data, fallback, validator);
    } catch {
      return fallback;
    }
  },

  /** SEC-012: Clear session nonce (call on game over / new game). */
  clearSessionNonce(): void {
    sessionStorage.removeItem(SESSION_NONCE_KEY);
    _sessionKey = null;
    _sessionKeyReady = null;
  },
};

```

## FILE: utils/challenge-link.ts
```typescript
// utils/challenge-link.ts
import { logger } from './logger';

const SIGN_API = 'https://game.mscarabia.com/api/sign-challenge';
const VERIFY_API = 'https://game.mscarabia.com/api/verify-challenge';
const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;

export const challengeLink = {
  async generate(score: number, seed: string, hearts: number): Promise<string> {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      challenge: '1', seed, score: String(score), hearts: String(hearts),
      ref: navigator.language || 'global',
    });
    try {
      const res = await fetch(SIGN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, seed, hearts }),
      });
      if (res.ok) {
        const { sig } = await res.json() as { sig: string };
        if (sig) params.set('sig', sig);
      } else {
        logger.warn('Challenge signing server returned', res.status);
      }
    } catch {
      logger.warn('Challenge signing request failed');
    }
    return `${base}?${params.toString()}`;
  },

  /** Returns `valid: false` for any tampered or unsigned URL. */
  async parseAndVerify(): Promise<{
    isChallenge: boolean;
    valid: boolean;
    seed?: string;
    score?: number;
    hearts?: number;
    ref?: string;
  }> {
    const p = new URLSearchParams(window.location.search);
    const isChallenge = p.get('challenge') === '1';
    if (!isChallenge) return { isChallenge: false, valid: false };

    const score  = Number(p.get('score'))  || 0;
    const hearts = Number(p.get('hearts')) || 3;
    const seed   = p.get('seed')  || '';
    const sig    = p.get('sig')   || '';
    const ref    = p.get('ref')   || 'global';

    if (!sig) {
      // No signature — reject in production, accept in dev
      if (IS_PROD) {
        logger.warn('Challenge URL missing signature in production — rejecting');
        return { isChallenge: true, valid: false };
      }
      return { isChallenge: true, valid: true, seed, score, hearts, ref };
    }

    // SEC-CL-01: Verify signature server-side (constant-time compare, no re-signing)
    try {
      const res = await fetch(VERIFY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, seed, hearts, sig }),
      });
      if (res.ok) {
        const { valid } = await res.json() as { valid: boolean };
        if (!valid) logger.warn('Challenge URL signature mismatch');
        return { isChallenge: true, valid, seed, score, hearts, ref };
      }
      logger.warn('Challenge verification server returned', res.status);
    } catch {
      logger.warn('Challenge verification request failed');
    }
    return { isChallenge: true, valid: false };
  },

  /** Legacy sync parse — use only for non-competitive display (no integrity check). */
  parseUnsafe(): { isChallenge: boolean; seed?: string; score?: number; hearts?: number; ref?: string } {
    const p = new URLSearchParams(window.location.search);
    return {
      isChallenge: p.get('challenge') === '1',
      seed:   p.get('seed')   || undefined,
      score:  p.get('score') != null ? Number(p.get('score')) : undefined,
      hearts: p.get('hearts') != null ? Number(p.get('hearts')) : undefined,
      ref:    p.get('ref')    || 'global',
    };
  },

  async copyToClipboard(score: number, seed: string, hearts: number): Promise<boolean> {
    const url = await this.generate(score, seed, hearts);
    try {
      await navigator.clipboard.writeText(`Try my score: ${score}! Beat me here ${url}`);
      return true;
    } catch {
      logger.warn('Clipboard write failed');
      return false;
    }
  },
};

```

## FILE: utils/score-sync.ts
```typescript
// utils/score-sync.ts
import { logger } from './logger';
import { LS_KEYS } from '../config/difficulty';
import { idb } from './idb';

async function getAuthToken(): Promise<string | undefined> {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    return await auth.currentUser?.getIdToken();
  } catch { return undefined; }
}

export const scoreSync = {
  _flushing: false,
  async queue(score: number, mode: 'classic' | 'evolve' = 'evolve', tick = 0, practiceMode = false, godMode = false) {
    let initials = 'ANON';
    try {
      const rawInitials = localStorage.getItem(LS_KEYS.PLAYER_NAME) || 'ANON';
      initials = rawInitials.replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON';
    } catch { /* storage denied */ }
    const pending = { score, initials, mode, tick, attempts: 0, nextRetry: Date.now(), sessionId: crypto.randomUUID?.() || `sess-${Date.now()}`, practiceMode, godMode };

    if (navigator.onLine) {
      const result = await this._submit(pending);
      if (result === 'success' || result === 'permanent') return;
    }

    try {
      await idb.enqueue(pending);
      logger.info('📦 Score queued offline', { score, initials });
    } catch (e) {
      logger.warn('Failed to queue score offline', e);
    }
  },

  async _submit(item: { score: number; initials: string; mode: string; tick?: number; attempts?: number; sessionId?: string; practiceMode?: boolean; godMode?: boolean }): Promise<'success' | 'permanent' | 'temporary'> {
    try {
      const token = await getAuthToken();
      const res = await fetch('https://game.mscarabia.com/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          score: Math.max(0, Math.min(9999, Math.floor(item.score || 0))),
          initials: String(item.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 8) || 'ANON',
          mode: ['classic', 'evolve'].includes(item.mode) ? item.mode : 'classic',
          tick: typeof item.tick === 'number' ? item.tick : 0,
          sessionId: item.sessionId || crypto.randomUUID?.() || `sess-${Date.now()}`,
          practiceMode: item.practiceMode || false,
          godMode: item.godMode || false,
        }),
      });
      if (!res.ok) {
        // 4xx = permanent error (bad payload, auth failure) — don't retry
        if (res.status >= 400 && res.status < 500) return 'permanent';
        throw new Error(`HTTP ${res.status}`);
      }
      return 'success';
    } catch {
      return 'temporary';
    }
  },

  async flush() {
    if (this._flushing || !navigator.onLine) return;
    this._flushing = true;
    try {
      const pending = await idb.peekAll();
      if (pending.length === 0) return;

      logger.info(`Flushing ${pending.length} offline scores`);

      const succeededIds: number[] = [];
      const failedIds: number[] = [];
      const permanentIds: number[] = [];
      const now = Date.now();
      for (const item of pending) {
        // Exponential backoff: skip items not yet due for retry
        const nextRetry = item.nextRetry ?? 0;
        if (nextRetry > now) continue;

        const result = await this._submit(item);
        if (result === 'success') {
          if (item.id != null) succeededIds.push(item.id);
        } else if (result === 'permanent') {
          // 4xx error — drop from queue permanently
          if (item.id != null) permanentIds.push(item.id);
        } else {
          if (item.id != null) failedIds.push(item.id);
        }
      }
      // Atomic: delete succeeded+permanent, update failed in-place (prevents data loss on page close)
      const toRemove = [...succeededIds, ...permanentIds];
      const updates = failedIds.map(id => {
        const item = pending.find(p => p.id === id);
        const safeAttempts = Math.max(0, Math.floor(Number(item?.attempts) || 0));
        const attempts = safeAttempts + 1;
        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 30 * 60 * 1000);
        return { id, patch: { attempts, nextRetry: Date.now() + backoffMs } };
      });
      await idb.removeAndUpdate(toRemove, updates);
    } finally {
      this._flushing = false;
    }
  },

  _onlineHandler: (null as (() => void) | null),

  async init() {
    if (typeof window === 'undefined') return;
    if (this._onlineHandler) return; // prevent double-registration
    this._onlineHandler = () => this.flush();
    window.addEventListener('online', this._onlineHandler);
    await this.flush();
  },

  destroy() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
  },
};

```

## FILE: workers/score-validator.ts
```typescript
import type { ExportedHandler, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  FIREBASE_PROJECT_ID: string;
  GCP_SERVICE_ACCOUNT_EMAIL: string;
  GCP_SERVICE_ACCOUNT_KEY_B64: string;
  CHALLENGE_HMAC_SECRET?: string;
}

interface ScorePayload {
  score: number;
  initials: string;
  mode: 'classic' | 'evolve';
  badge?: string;
  date?: string;
  tick: number;
  sessionId: string;
  practiceMode?: boolean;
  godMode?: boolean;
}

interface ChallengePayload {
  score: number;
  seed: string;
  hearts: number;
}

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
let _refreshPromise: Promise<string> | null = null;

async function getFirebaseToken(env: Env): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const now = Math.floor(Date.now() / 1000);
    // base64url encoding (no padding, + → -, / → _)
    const toBase64Url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = toBase64Url(JSON.stringify({
      iss: env.GCP_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const pemStr = atob(env.GCP_SERVICE_ACCOUNT_KEY_B64);
    const pemBody = pemStr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0)).buffer;

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign'],
    );
    const toSign = new TextEncoder().encode(`${header}.${claim}`);
    const sigBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, toSign);
    const sig = toBase64Url(String.fromCharCode(...new Uint8Array(sigBuffer)));
    const jwt = `${header}.${claim}.${sig}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!res.ok) throw new Error(`OAuth token request failed: ${res.status}`);
    const json = await res.json<{ access_token?: string; expires_in?: number }>();
    if (!json.access_token || typeof json.expires_in !== 'number') throw new Error('OAuth response missing access_token');
    _cachedToken = json.access_token;
    _tokenExpiry = Date.now() + json.expires_in * 1000;
    return _cachedToken;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

function toBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signChallenge(score: number, seed: string, hearts: number, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const raw = await crypto.subtle.sign('HMAC', key, msg);
  return toBase64url(raw);
}

async function verifyChallenge(score: number, seed: string, hearts: number, sig: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const msg = new TextEncoder().encode(`${score}:${seed}:${hearts}`);
  const expected = await crypto.subtle.sign('HMAC', key, msg);
  const expectedStr = toBase64url(expected);
  // Constant-time compare via timing-safe byte-by-byte
  if (expectedStr.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedStr.length; i++) diff |= expectedStr.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight — reflect validated origin (don't hardcode)
    const allowedOrigins = [
      'https://dont-touch-purple.web.app',
      'https://dont-touch-purple.firebaseapp.com',
      'https://game.mscarabia.com',
    ];
    if (request.method === 'OPTIONS') {
      const reqOrigin = request.headers.get('Origin') ?? '';
      const allowOrigin = allowedOrigins.includes(reqOrigin) ? reqOrigin : 'https://dont-touch-purple.web.app';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    // Origin validation (allowedOrigins declared above in CORS section)
    // Require a valid Origin header — requests without one (curl, scripts) are rejected.
    const origin = request.headers.get('Origin') ?? '';
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || 'https://dont-touch-purple.web.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const url = new URL(request.url);

    // SEC-010: Server-side HMAC signing for challenge links
    if (url.pathname === '/api/sign-challenge') {
      // SEC-013: Rate limit sign-challenge to prevent HMAC CPU abuse
      const signIp = request.headers.get('cf-connecting-ip');
      if (!signIp) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const signRateKey = `sign-rate:${signIp}`;
      const signNow = Date.now();
      let signAttempts: number[] = (await env.RATE_LIMIT_KV.get(signRateKey, { type: 'json' })) ?? [];
      signAttempts = signAttempts.filter(ts => signNow - ts < 60_000);
      if (signAttempts.length >= 30) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      signAttempts.push(signNow);
      await env.RATE_LIMIT_KV.put(signRateKey, JSON.stringify(signAttempts), { expirationTtl: 61 });

      if (!env.CHALLENGE_HMAC_SECRET) {
        return new Response(JSON.stringify({ error: 'Challenge signing not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      try {
        const body = await request.json<ChallengePayload>();
        if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number') {
          return new Response(JSON.stringify({ error: 'Invalid challenge params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        // SEC-016: Limit seed length to prevent memory exhaustion
        if (body.seed.length > 256) {
          return new Response(JSON.stringify({ error: 'Seed too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const sig = await signChallenge(body.score, body.seed, body.hearts, env.CHALLENGE_HMAC_SECRET);
        return new Response(JSON.stringify({ sig }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // SEC-CL-01: Server-side HMAC verification for challenge links
    if (url.pathname === '/api/verify-challenge') {
      const verifyIp = request.headers.get('cf-connecting-ip');
      if (!verifyIp) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // More permissive rate limit — verification is lighter than signing
      const verifyRateKey = `verify-rate:${verifyIp}`;
      const verifyNow = Date.now();
      let verifyAttempts: number[] = (await env.RATE_LIMIT_KV.get(verifyRateKey, { type: 'json' })) ?? [];
      verifyAttempts = verifyAttempts.filter(ts => verifyNow - ts < 60_000);
      if (verifyAttempts.length >= 60) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      verifyAttempts.push(verifyNow);
      await env.RATE_LIMIT_KV.put(verifyRateKey, JSON.stringify(verifyAttempts), { expirationTtl: 61 });

      if (!env.CHALLENGE_HMAC_SECRET) {
        return new Response(JSON.stringify({ error: 'Challenge verification not configured' }), { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      try {
        const body = await request.json<ChallengePayload & { sig: string }>();
        if (typeof body.score !== 'number' || typeof body.seed !== 'string' || typeof body.hearts !== 'number' || typeof body.sig !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        if (body.seed.length > 256) {
          return new Response(JSON.stringify({ error: 'Seed too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const valid = await verifyChallenge(body.score, body.seed, body.hearts, body.sig, env.CHALLENGE_HMAC_SECRET);
        return new Response(JSON.stringify({ valid }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // Verify Firebase ID token from client
    const authHeader = request.headers.get('Authorization') ?? '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const tokenInfo = await verifyRes.json<{ aud?: string; sub?: string; iss?: string }>();
      if (!tokenInfo.sub) {
        return new Response(JSON.stringify({ error: 'Invalid token claims' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // SEC-015: Validate issuer to prevent cross-project token abuse
      const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
      if (!tokenInfo.iss || tokenInfo.iss !== expectedIss) {
        return new Response(JSON.stringify({ error: 'Invalid issuer' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // Validate audience claim to prevent cross-project token abuse.
      // Missing aud is also rejected — a valid Google token always includes it.
      if (!tokenInfo.aud || tokenInfo.aud !== env.FIREBASE_PROJECT_ID) {
        return new Response(JSON.stringify({ error: 'Invalid audience' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Token verification failed' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    try {
      const data = await request.json<ScorePayload>();
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const rateKey = `rate:${ip}`;
      const now = Date.now();
      let attempts: number[] = (await env.RATE_LIMIT_KV.get(rateKey, { type: 'json' })) ?? [];
      attempts = attempts.filter(ts => now - ts < 60_000);
      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 61 });

      if (typeof data.score !== 'number' || data.score < 0 || data.score > 9999) {
        return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.initials || typeof data.initials !== 'string' || data.initials.length > 8 || !/^[a-zA-Z0-9_ ]{1,8}$/.test(data.initials)) {
        return new Response(JSON.stringify({ error: 'Invalid initials' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (!data.mode || !['classic', 'evolve'].includes(data.mode)) {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.tick !== 'number' || data.tick < 0) {
        return new Response(JSON.stringify({ error: 'Missing tick' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const safeTick = Math.min(data.tick, 600); // ~10min at 60fps cap, matches Firestore rule
      if (data.score > Math.floor(safeTick * 8 * 1.5)) { // 8 pts/tick avg with 50% buffer
        return new Response(JSON.stringify({ error: 'Impossible score' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (typeof data.sessionId !== 'string' || data.sessionId.length < 8) {
        return new Response(JSON.stringify({ error: 'Missing session' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.sessionId.length > 64) {
        return new Response(JSON.stringify({ error: 'Session too long' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      // SEC-011: Reject practice/god mode scores server-side
      if ((data as Record<string, unknown>).practiceMode === true || (data as Record<string, unknown>).godMode === true) {
        return new Response(JSON.stringify({ error: 'Practice scores not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (data.badge && (typeof data.badge !== 'string' || data.badge.length > 24 || !/^[a-zA-Z0-9_-]+$/.test(data.badge))) {
        return new Response(JSON.stringify({ error: 'Invalid badge' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const token = await getFirebaseToken(env);
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/lb_global`;

      const payload = {
        fields: {
          score: { integerValue: data.score.toString() },
          initials: { stringValue: data.initials },
          mode: { stringValue: data.mode },
          badge: { stringValue: data.badge ?? '' },
          date: { stringValue: data.date ?? new Date().toISOString().split('T')[0] },
          ts: { timestampValue: new Date().toISOString() },
          sessionId: { stringValue: data.sessionId },
          tick: { integerValue: safeTick.toString() },
        },
      };

      const fbRes = await fetch(`${firebaseUrl}?documentId=auto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fbRes.ok) {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      return new Response(JSON.stringify({ success: true, score: data.score }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  },
} satisfies ExportedHandler<Env>;

```

## FILE: firestore.rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function validScore() {
      let s = request.resource.data.score;
      return s is int && s >= 0 && s <= 9999;
    }

    function validInitials() {
      let ini = request.resource.data.initials;
      return ini is string && ini.size() >= 1 && ini.size() <= 8 && ini.matches('^[a-zA-Z0-9_ ]+$');
    }

    function validBadge() {
      return !('badge' in request.resource.data) ||
             (request.resource.data.badge is string && request.resource.data.badge.size() <= 24 && request.resource.data.badge.matches('^[a-zA-Z0-9_-]*$'));
    }

    function validDate() {
      let d = request.resource.data.date;
      return d is string && d.size() == 10 && d.matches('^\\d{4}-\\d{2}-\\d{2}$');
    }

    function hasRequiredFields() {
      return request.resource.data.keys().hasAll(['score', 'initials', 'date', 'mode']);
    }

    // SEC-009: App Check guard — verify attestation on writes
    // Requires enabling enforcement in Firebase Console → Security → App Check → Enforce
    // request.app is non-null only when App Check token is valid and enforcement is on
    function hasValidAppCheck() {
      return request.app != null;
    }

    // Leaderboard — requires authentication, write-once
    match /lb_global/{docId} {
      allow read: if true;
      // SEC-009: Uncomment hasValidAppCheck() after enabling enforcement in Firebase Console
      // To enable: Firebase Console → App Check → APIs → Firestore → Enforce
      allow create: if
        request.auth != null &&
        hasRequiredFields() &&
        validScore() &&
        validInitials() &&
        validBadge() &&
        validDate() &&
        request.resource.data.mode in ['classic', 'evolve'] &&
        (!('tick' in request.resource.data) ||
          (request.resource.data.tick is int &&
           request.resource.data.tick >= 0 &&
           request.resource.data.tick <= 600 &&
           request.resource.data.score <= request.resource.data.tick * 12)) &&
        request.resource.data.keys().hasOnly(['score', 'initials', 'date', 'mode', 'badge', 'ts', 'tick', 'sessionId']);
      allow update, delete: if false;
    }

    // Dust wallet — requires authentication, UID-bound writes
    // docId = player name, uid field must match authenticated user
    match /dust_wallet/{docId} {
      // SEC-014: Only the document owner can read their dust wallet
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if
        request.auth != null &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 20 &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000;
      allow update: if
        request.auth != null &&
        resource.data.uid == request.auth.uid &&
        request.resource.data.keys().hasOnly(['name', 'dust', 'ts', 'uid']) &&
        request.resource.data.name == docId &&
        request.resource.data.dust is int &&
        request.resource.data.dust >= 0 &&
        request.resource.data.dust < 10000000 &&
        // SEC-006: monotonic guard — dust bounded by max earnings (up) and max spend (down) per write
        request.resource.data.dust <= resource.data.dust + 10000 &&
        request.resource.data.dust >= resource.data.dust - 5000;
      allow delete: if false;
    }

    // Catch-all — deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

```

## FILE: vite.config.ts
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Build plugins array — Sentry sourcemap upload only when auth token is present
const plugins = [
  react(),
  compression({ algorithm: 'brotliCompress', threshold: 10240 }),
  compression({ algorithm: 'gzip' }),
  visualizer({ open: false, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  {
    name: 'sw-version-inject',
    writeBundle() {
      const swPath = 'dist/sw.js'
      try {
        let sw = readFileSync(swPath, 'utf-8')
        sw = sw.replaceAll('dtp-v__SW_VERSION__', `dtp-v${pkg.version}`)
        writeFileSync(swPath, sw)
        console.log(`[sw-inject] Cache name set to dtp-v${pkg.version}`)
      } catch (e) {
        console.warn('[sw-inject] Failed to inject version into sw.js', e)
      }
    }
  }
]

// Conditionally add Sentry sourcemap upload plugin when auth token is available
if (process.env.SENTRY_AUTH_TOKEN) {
  const { sentryVitePlugin } = await import('@sentry/vite-plugin')
  plugins.push(
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: pkg.version },
      sourcemaps: { assets: './dist/**' },
    })
  )
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    minify: 'terser',
    terserOptions: { compress: { drop_debugger: true, pure_funcs: ['console.log', 'console.info', 'console.debug'] }, mangle: { safari10: true }, format: { comments: false } },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Game Analytics - separate chunk
          if (id.includes('gameanalytics')) return 'analytics';

          // React ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@lottiefiles') || id.includes('dotlottie')) return 'lottie';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
            if (id.includes('lucide') || id.includes('icon')) return 'ui-icons';
            // Other vendor libraries in smaller chunks
            if (id.includes('date-fns') || id.includes('lodash')) return 'utils-vendor';
            return 'vendor';
          }

          // Monitoring services (independent, no circular deps — keep separate for lazy load)
          if (id.includes('services/') &&
              (id.includes('errorLogger') || id.includes('metrics') || id.includes('web-vitals'))) return 'services-monitoring';

          // Game engine + core logic + UI + services (circular deps between all these
          // groups make separate chunks impossible — Rollup merges them with warnings)
          if (id.includes('engine/') || id.includes('subsystems/') ||
              id.includes('utils/') || id.includes('components/') ||
              id.includes('hooks/') || id.includes('services/')) return 'game-core';

          // UI components by feature (non-circular subsets)
          if (id.includes('Backgrounds/')) return 'bg-effects';
          if (id.includes('Shop/') || id.includes('Leaderboard/')) return 'heavy-panels';
          if (id.includes('Settings/')) return 'settings-panel';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name ?? '').split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/img/[name]-[hash].[ext]';
          }
          return 'assets/[ext]/[name]-[hash].[ext]';
        },
      },
    },
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    }
  },
})

```

## FILE: tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": [
    "main.tsx",
    "App.tsx",
    "vite.config.ts",
    "components/**/*.ts",
    "components/**/*.tsx",
    "config/**/*.ts",
    "contexts/**/*.ts",
    "contexts/**/*.tsx",
    "engine/**/*.ts",
    "hooks/**/*.ts",
    "input/**/*.ts",
    "services/**/*.ts",
    "utils/**/*.ts",
    "__tests__/**/*.ts",
    "test/**/*.ts",
    "*.d.ts",
    "types/**/*.d.ts"
  ],
  "references": []
}

```

## FILE: eslint.config.js
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'junk/**', 'node_modules/**', 'public/sw.js', 'website/**', '.agent/**', '.agents/**', '.claude/**', '.continue/**', '.gemini/**', '.trae/**', '.windsurf/**', '.wrangler/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node.js scripts — relax browser rules
  {
    files: ['scripts/**', 'postcss.config.js', 'vite.config.ts', 'lint-staged.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'warn',
    },
  },
);

```
