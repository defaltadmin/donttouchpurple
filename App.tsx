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
import { LeftPanel } from "./components/Landing/LeftPanel";
import { RightPanel } from "./components/Landing/RightPanel";
import { LearnMoreOverlay } from "./components/Landing/LearnMoreOverlay";
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
  const [showLearnMore, setShowLearnMore] = useState(false);
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
  const [uiReady, setUiReady] = useState(true);

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
    // 1. Init i18n
    i18n.init().then(() => setUiReady(true));

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
          toast$("💾 Score saved offline — will sync soon");
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
        if (!valid) logger.warn('Challenge link signature invalid — score claim untrusted');
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
    'default': { component: PurpleRain },
    'void-tunnel': { component: VoidTunnel },
    'star-warp': { component: StarWarp },
    'grid-pulse': { component: GridPulse },
    'purple-cascade': { component: PurpleCascade },
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
    setShowLearnMore(false);
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
      {/* WebGL galaxy background — full viewport behind everything */}
      {screen === "menu" && (!shopData.equippedBackground || shopData.equippedBackground === 'default') && (
        <Suspense fallback={null}><Galaxy /></Suspense>
      )}
    <div ref={containerRef} className={`root root--${screen}${is2P ? " root--2p" : ""}${gameMode === "classic" ? " root--classic" : ""}${theme === "light" ? " light-theme" : ""}${reducedMotion ? " root--reduced-motion" : ""}${freezeActive ? " fx-freeze-active" : ""}${multActive ? " fx-mult-active" : ""}${shieldActive ? " fx-shield-active" : ""}`}
      style={{ "--cell-1p": cellSizeVar, ...themeVars } as React.CSSProperties}>
      
      {/* CSS orbs: show when no animated background equipped AND not on menu */}
      {(!shopData.equippedBackground || shopData.equippedBackground === 'default') && screen !== 'menu' ? (
        <>
          <div className="bg-pulse" style={snapshot?.rareMode.active && screen === "playing" ? { background: `radial-gradient(ellipse at 50% 30%, ${snapshot.rareMode.cssColor}44 0%, transparent 65%)`, opacity: 1 } : {}} />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </>
      ) : (
        /* Still render bg-pulse for rare mode effect, but no orbs */
        <div className="bg-pulse" style={snapshot?.rareMode.active && screen === "playing" ? { background: `radial-gradient(ellipse at 50% 30%, ${snapshot.rareMode.cssColor}44 0%, transparent 65%)`, opacity: 1 } : {}} />
      )}

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
        <div className="menu-layout">
        <LeftPanel />
        <StartScreen
          onLearnMore={() => setShowLearnMore(true)}
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
        <RightPanel />
        </div>
      )}

      {screen === "menu" && showLearnMore && <LearnMoreOverlay onClose={() => setShowLearnMore(false)} />}

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
                title={dust < 30 ? "Need 30+ dust" : botOn ? "Bot ON — tap to stop" : "Bot assist (30💜/use)"}
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



