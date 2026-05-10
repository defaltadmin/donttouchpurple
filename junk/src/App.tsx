import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import "./styles/game.css";
import "./styles/enhancements.css";

// ── Core utils ───────────────────────────────────────────────────────────────
import { logger }             from "./utils/logger";
import { sessionManager }     from "./utils/session";
import { settingsManager }    from "./utils/settings";
import { i18n, type Locale }  from "./utils/i18n";
import { AssetHydrator }      from "./utils/asset-hydrator";
import { Preloader }          from "./utils/preloader";
import { errorTracker }       from "./utils/error-tracker";
import { achievementSystem }  from "./utils/achievements";
import { scoreCardGen }       from "./utils/score-card";
import { privacyManager }     from "./utils/privacy";
import { webVitalsMonitor }   from "./utils/web-vitals";
import { stateGuard }         from "./utils/state-guard";
import { challengeLink }      from "./utils/challenge-link";
import { orientationMonitor } from "./utils/orientation";
import { TouchGesture }       from "./utils/gestures";
import { visualA11y }         from "./utils/visual-a11y";
import { safeGetJSON, safeSet } from "./utils/storage";
import { addPendingScore }    from "./utils/pendingScoresDb";
import { useOffsetCursor }    from "./hooks/useOffsetCursor";
import { configManager }      from "./utils/game-config";

// ── Engine ───────────────────────────────────────────────────────────────────
import * as Sentry from "@sentry/react";
import { computeMs, speedLabel, speedPct } from "./engine/DifficultyScaler";
import { GAME, LS_KEYS }     from "./config/difficulty";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, loadKeys } from "./config/keybindings";
import { SHOP_THEMES }       from "./config/powerupWeights";
import {
  setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime,
  useGameEngine, loadStoredPwr, saveStoredPwr,
} from "./hooks/useGameEngine";
import { useInputHandler }   from "./hooks/useInputHandler";
import { useScreenStateMachine } from "./hooks/useScreenStateMachine";
import type {
  GameConfig as EngineGameConfig, Winner, PlayerState,
  GameSnapshot, StoredPowerups, HoldCell,
} from "./engine/types";

// ── New extracted hooks ───────────────────────────────────────────────────────
import { useGameSettings }   from "./hooks/useGameSettings";
import { useGameProgress }   from "./hooks/useGameProgress";
import { useEngineEvents }   from "./hooks/useEngineEvents";
import { useDailyChallenges } from "./hooks/useDailyChallenges";
import { useWeeklyTasks }    from "./hooks/useWeeklyTasks";
import { useGameOver }       from "./hooks/useGameOver";
import { usePWA }            from "./hooks/usePWA";

// ── Services (lazy-loaded) ────────────────────────────────────────────────────
import { fbLogEvent, fbFetchTop20Global } from "./services/firebase";
import {
  initGA, logProgressionEvent, logDesignEvent,
  logResourceEvent, logErrorEvent,
} from "./services/gameanalytics";
import { featureGates } from "./utils/featureGates";

// ── New extracted UI components ───────────────────────────────────────────────
import { GameHeader }    from "./components/HUD/GameHeader";
import { HudRow }        from "./components/HUD/HudRow";
import { PauseOverlay }  from "./components/Overlays/PauseOverlay";
import { BossUI }        from "./components/Overlays/BossUI";
import { ModalsLayer }   from "./components/Overlays/ModalsLayer";

// ── HUD components ────────────────────────────────────────────────────────────
import { EnergyBar }        from "./components/HUD/EnergyBar";
import { DustWidget }       from "./components/HUD/DustWidget";
import { Toast, RareSplash } from "./components/HUD/Toasts";
import { Hearts }           from "./components/HUD/Hearts";
import { GridErrorBoundary } from "./components/HUD/GridErrorBoundary";
import { PwrBar }           from "./components/HUD/PwrBar";
import { PlayerPanel }      from "./components/HUD/PlayerPanel";
import { ShieldDrop }       from "./components/Animations/ShieldDrop";
import { FreezeDrop }       from "./components/Animations/FreezeDrop";
import { EnergyDrop }       from "./components/Animations/EnergyDrop";

// ── Screens ───────────────────────────────────────────────────────────────────
import { LoadingScreen }   from "./components/Screens/LoadingScreen";
import { StartScreen }     from "./components/Screens/StartScreen";
import { HowToPlay }       from "./components/Screens/HowToPlay";
import { GameOver, getMessage } from "./components/Screens/GameOver";
import { PrivacyBanner }   from "./components/Screens/PrivacyBanner";
import EvolveTutorial      from "./components/Screens/EvolveTutorial";
import { WhatsNew, shouldShowWhatsNew, markWhatsNewSeen } from "./components/Screens/WhatsNew";
import LoginStreakPopup, { getStreakReward } from "./components/Screens/LoginStreakPopup";
import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
import { RewardsHub, countUnclaimedRewards, type WeeklyTask } from "./components/Screens/RewardsHub";
import { getObjectiveStreak } from "./config/dailyObjective";
import { getDailyObjective, markObjectiveComplete, checkObjective, getObjectiveProgress, type DailyObjective, type BossObjectiveCounters } from "./config/dailyObjective";
import { MAX_TUTORIAL_GAMES } from "./config/tutorial";

// ── Backgrounds (lazy) ────────────────────────────────────────────────────────
const VoidTunnel    = lazy(() => import("./components/Backgrounds/VoidTunnel"));
const StarWarp      = lazy(() => import("./components/Backgrounds/StarWarp"));
const GridPulse     = lazy(() => import("./components/Backgrounds/GridPulse"));
const PurpleRain    = lazy(() => import("./components/Backgrounds/PurpleRain"));
const PurpleCascade = lazy(() => import("./components/Backgrounds/PurpleCascade"));
const BlockOrbit    = lazy(() => import("./components/Backgrounds/BlockOrbit"));
const DataStream    = lazy(() => import("./components/Backgrounds/DataStream"));
const CellBreath    = lazy(() => import("./components/Backgrounds/CellBreath"));
const WarpGate      = lazy(() => import("./components/Backgrounds/WarpGate"));
const PulseField    = lazy(() => import("./components/Backgrounds/PulseField"));
const GlitchGrid    = lazy(() => import("./components/Backgrounds/GlitchGrid"));
const AmbientFlow   = lazy(() => import("./components/Backgrounds/AmbientFlow"));

// ── Settings / Shop (lazy) ────────────────────────────────────────────────────
import { KeyBinder }   from "./components/Settings/KeyBinder";
import { DevOverlay, DevUnlockModal } from "./components/Settings/DevOverlay";
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";
const SettingsDrawer   = lazy(() => import("./components/Settings/SettingsDrawer").then(m => ({ default: m.SettingsDrawer })));
const ShopPanel        = lazy(() => import("./components/Shop/ShopPanel").then(m => ({ default: m.ShopPanel })));
const LeaderboardPanel = lazy(() => import("./components/Leaderboard/LeaderboardPanel").then(m => ({ default: m.LeaderboardPanel })));

import { useBackgroundController } from "./hooks/useBackground";

// ── Types ─────────────────────────────────────────────────────────────────────
type GameMode       = "classic" | "evolve";
type InputMode      = "touch" | "keyboard";
type GameScreen     = "menu" | "howto" | "leaderboard" | "keybind" | "playing" | "gameover" | "shop";
type NumPlayers     = 1 | 2;
type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";
type AssetTier      = "critical" | "deferred" | "background";
type ShopData = {
  unlockedThemes: string[];  equippedTheme:  string;
  unlockedBadges: string[];  equippedBadge:  string;
  unlockedSkins:  string[];  equippedSkin:   string;
  unlockedBackgrounds: string[]; equippedBackground: string;
};

declare const __APP_VERSION__: string;

// ── Safe Sentry wrapper ───────────────────────────────────────────────────────
const safeSentry = {
  addBreadcrumb:    (...a: Parameters<typeof Sentry.addBreadcrumb>)    => { try { Sentry.addBreadcrumb(...a);    } catch {} },
  captureException: (...a: Parameters<typeof Sentry.captureException>) => { try { Sentry.captureException(...a); } catch {} },
  setTags:          (...a: Parameters<typeof Sentry.setTags>)          => { try { Sentry.setTags(...a);          } catch {} },
  setContext:       (...a: Parameters<typeof Sentry.setContext>)        => { try { Sentry.setContext(...a);       } catch {} },
};

// ── Lazy Firebase ─────────────────────────────────────────────────────────────
let _firebase: typeof import("./services/firebase") | null = null;
async function getFirebase() {
  if (!_firebase) _firebase = await import("./services/firebase");
  return _firebase;
}

// ── Error Boundary ────────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } as any } });
    console.error("[DTP] ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError)
      return (
        <div style={{ padding: 40, color: "#fff", textAlign: "center", background: "#111", minHeight: "100vh" }}>
          <h2>Something went wrong.</h2>
          <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    return this.props.children;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ColorblindFilters() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <filter id="deuteranopia"><feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" /></filter>
      <filter id="protanopia"><feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" /></filter>
      <filter id="tritanopia"><feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" /></filter>
      <filter id="monochrome"><feColorMatrix values="0.33,0.33,0.33,0,0 0.33,0.33,0.33,0,0 0.33,0.33,0.33,0,0 0,0,0,1,0" /></filter>
    </svg>
  );
}

function getCBFilterStyle(mode: ColorblindMode): string {
  return mode === "none" ? "" : `url(#${mode})`;
}

function NameChangeForm({ current, onSubmit, onDevTrigger }: {
  current: string;
  onSubmit: (name: string) => void;
  onDevTrigger?: () => void;
}) {
  const [val, setVal] = React.useState(current);
  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9_ /]/g, "").trim().slice(0, 8);
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <input
        className="name-input"
        value={val}
        onChange={e => {
          if (e.target.value.includes("//dev//") && onDevTrigger) { onDevTrigger(); setVal(""); return; }
          setVal(e.target.value);
        }}
        onKeyDown={e => { if (e.key === "Enter" && sanitize(val)) onSubmit(sanitize(val)); }}
        maxLength={8}
        autoFocus={!("ontouchstart" in window)}
        style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }}
        placeholder="Your name..."
      />
      <button
        className="btn-primary"
        style={{ width: "100%" }}
        disabled={!sanitize(val)}
        onClick={() => { if (sanitize(val)) onSubmit(sanitize(val)); }}
      >
        Save
      </button>
    </div>
  );
}

function loadShopData(): ShopData {
  try {
    const r = localStorage.getItem(LS_KEYS.SHOP);
    if (r) {
      const d = JSON.parse(r);
      return {
        unlockedThemes:      d.unlockedThemes      || d.ownedThemes      || ["default"],
        equippedTheme:       d.equippedTheme       || "default",
        unlockedBadges:      d.unlockedBadges      || d.ownedBadges      || [],
        equippedBadge:       d.equippedBadge       || "",
        unlockedSkins:       d.unlockedSkins       || d.ownedSkins       || ["default"],
        equippedSkin:        d.equippedSkin        || "default",
        unlockedBackgrounds: d.unlockedBackgrounds || ["default"],
        equippedBackground:  d.equippedBackground  || "default",
      };
    }
  } catch {}
  return {
    unlockedThemes: ["default"],  equippedTheme:  "default",
    unlockedBadges: [],           equippedBadge:  "",
    unlockedSkins:  ["default"],  equippedSkin:   "default",
    unlockedBackgrounds: ["default"], equippedBackground: "default",
  };
}
function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch {}
}

// ═════════════════════════════════════════════════════════════════════════════
//  App
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {

  // ── Startup / Loading ──────────────────────────────────────────────────────
  const [appReady, setAppReady]     = useState(false);
  const [loadDone, setLoadDone]     = useState(false);
  const [uiReady, setUiReady]       = useState(false);
  const [loadPct, setLoadPct]       = useState({ critical: 0, deferred: 0, background: 0 });
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrator     = useRef(new AssetHydrator());
  const preloaderRef = useRef(new Preloader());

  // ── Settings (extracted hook) ──────────────────────────────────────────────
  const {
    muted, toggleMuted, volume, setVolume,
    haptics, setHaptics, screenShake, setScreenShake,
    reducedMotion, setReducedMotion, theme, setTheme,
    colorblindMode, setColorblindMode, isFS, toggleFS,
  } = useGameSettings();

  const backgroundFPS = reducedMotion ? 30 : 60;

  // ── Player identity ────────────────────────────────────────────────────────
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(LS_KEYS.PLAYER_NAME) || ""
  );

  // ── Progress (extracted hook) ──────────────────────────────────────────────
  const progress = useGameProgress(playerName);
  const {
    gamesPlayed, setGamesPlayed, incrementGamesPlayed,
    best1, best2, updateBest,
    wins, deaths, recordResult,
    dust, setDust, dustRef, addDust, spendDust, persistDust,
    getBotAccuracy, energyData, setEnergyData, refillEnergy,
  } = progress;

  // ── Screen state machine ───────────────────────────────────────────────────
  const machine = useScreenStateMachine({ bestScore: Math.max(best1, best2), gamesPlayed, wins, deaths });
  const screen  = machine.current;
  const setScreen = useCallback((s: any) => machine.transition(s), [machine]);

  // ── Engine events (extracted hook) ────────────────────────────────────────
  const events = useEngineEvents(i18n.current);
  const {
    combo, resetCombo, bossUi, comboPop,
    currentLocale, dailyComplete,
    achievementQueue, gamepadActive, swUpdateRef,
  } = events;

  // ── Game state ─────────────────────────────────────────────────────────────
  const [gameMode, setGameMode]     = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers] = useState<NumPlayers>(1);
  const [inputMode, setInputMode]   = useState<InputMode>("touch");
  const [practiceMode, setPracticeMode] = useState(false);
  const [speedMult, setSpeedMult]   = useState(1);
  const [lbMode, setLbMode]         = useState<GameMode>("classic");
  const [shopData, setShopDataState] = useState(loadShopData);

  // ── Pause ──────────────────────────────────────────────────────────────────
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── UI / modal flags ───────────────────────────────────────────────────────
  const [toast, setToast]               = useState<string | null>(null);
  const [shareMsg, setShareMsg]         = useState("");
  const [shareUrl, setShareUrl]         = useState<string | null>(null);
  const [showShare, setShowShare]       = useState(false);
  const [shareToast, setShareToast]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsFromPause, setSettingsFromPause] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showPrivacy, setShowPrivacy]   = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEnergyPopup, setShowEnergyPopup] = useState(false);
  const [showOnboarding, setShowOnboarding]   = useState(() => !localStorage.getItem("dtp:onboard-seen"));
  const [showBuildDeploy, setShowBuildDeploy] = useState(false);
  const [showSwUpdate, setShowSwUpdate] = useState(false);
  const [gameSeedState, setGameSeedState] = useState(0);

  // Rewards & streaks
  const [showLoginStreak, setShowLoginStreak]     = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [loginStreakCount, setLoginStreakCount]   = useState(1);
  const [loginStreakReward, setLoginStreakReward] = useState(50);
  const [showRewardsHub, setShowRewardsHub]       = useState(false);
  const [shouldShowRewardsAfterGame, setShouldShowRewardsAfterGame] = useState(false);
  const [shouldShowRewardsOnLogin, setShouldShowRewardsOnLogin]     = useState(false);

  // Dev
  const [devMode, setDevMode]           = useState(false);
  const [showDevUnlock, setShowDevUnlock] = useState(false);
  const [godMode, setGodMode]           = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay]   = useState(false);
  const [devHeatmap, setDevHeatmap]     = useState<Record<number, number>>({});
  const [showDevPanel, setShowDevPanel] = useState(
    () => import.meta.env.DEV && localStorage.getItem("dtp:dev") === "true"
  );

  // FPS counter
  const [showFps, setShowFps]           = useState(() => localStorage.getItem("showFps") === "true");
  const [fps, setFps]                   = useState(0);
  const fpsFrameRef                     = useRef(0);
  const lastFpsTimeRef                  = useRef(performance.now());

  // Misc refs
  const toastRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreSubmittedRef = useRef(false);
  const peakStreakRef   = useRef(0);
  const dustAtStartRef  = useRef(dust);
  const pbFlashedRef    = useRef(false);
  const devKeyBuffer    = useRef<string[]>([]);
  const resumeCheckedRef = useRef(false);
  const [resumeReady, setResumeReady]   = useState(false);
  const [resumeData, setResumeData]     = useState<Record<string, unknown> | null>(null);
  const [gameOverProgress, setGameOverProgress] = useState(0);
  const [bossCounters, setBossCounters] = useState<BossObjectiveCounters>(
    { bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 }
  );
  const bossCountersRef = useRef(bossCounters);
  useEffect(() => { bossCountersRef.current = bossCounters; }, [bossCounters]);

  const [dailyObjective, setDailyObjective] = useState<DailyObjective>(getDailyObjective);
  const [initials, setInitials]             = useState("");
  const [initialsEntered, setIE]            = useState(false);

  // Evolve tutorial
  const EVOLVE_TUTORIAL_SEEN_KEY = "dtp-evolve-tutorial-seen";
  const [evolveTutorialSeen, setEvolveTutorialSeen] = useState(
    () => Boolean(localStorage.getItem(EVOLVE_TUTORIAL_SEEN_KEY))
  );

  // Replay seed
  const [pendingReplaySeed, setPendingReplaySeed] = useState<string | null>(
    () => localStorage.getItem("pendingReplaySeed")
  );
  const [customSeedInput, setCustomSeedInput] = useState("");
  const clearReplaySeed = useCallback(() => {
    localStorage.removeItem("pendingReplaySeed");
    setPendingReplaySeed(null);
  }, []);

  // Offset cursor
  const [showOffset, setShowOffset] = useState(() => settingsManager.get().offsetPointer ?? false);
  const cursorPos = useOffsetCursor(showOffset, containerRef);
  useEffect(() => { settingsManager.set({ offsetPointer: showOffset }); }, [showOffset]);

  // Keyboard layouts
  const [p1Keys, setP1Keys] = useState(() => loadKeys(LS_KEYS.P1_KEYS, DEFAULT_P1_KEYS));
  const [p2Keys, setP2Keys] = useState(() => loadKeys(LS_KEYS.P2_KEYS, DEFAULT_P2_KEYS));

  // ── Toast helper ───────────────────────────────────────────────────────────
  const toast$ = useCallback((msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), GAME.TOAST_DURATION_MS);
  }, []);

  // Wire SW update toast
  useEffect(() => {
    swUpdateRef.current = () => {
      setShowSwUpdate(true);
      toast$("🚀 Update available!");
    };
  }, [toast$, swUpdateRef]);

  // ── Daily challenges (extracted hook) ──────────────────────────────────────
  const {
    dailyChallenges, setDailyChallenges,
    updateChallengeProgress, handleChallengeClaim,
  } = useDailyChallenges(peakStreakRef, addDust);

  // ── Weekly tasks (extracted hook) ──────────────────────────────────────────
  const {
    weeklyTasks, refreshWeeklyTasks,
    updateWeeklyProgress, handleClaimWeekly, checkTop10Achievement,
  } = useWeeklyTasks(playerName, lbMode, best1, best2, addDust);

  // ── PWA (extracted hook) ───────────────────────────────────────────────────
  const {
    isIOS, showInstallBanner,
    handleInstallClick, dismissInstallBanner,
  } = usePWA();

  // ── Game over (extracted hook) ─────────────────────────────────────────────
  const { handleEngineGameOver } = useGameOver({
    playerName, numPlayers, gameMode,
    best1, best2, wins, deaths, gamesPlayed,
    updateBest, recordResult, addDust,
    updateChallengeProgress, updateWeeklyProgress,
    machine, shopData,
    setScreen, setShareMsg, setShouldShowRewardsAfterGame, toast$,
    peakStreakRef, dustAtStartRef, dustRef, scoreSubmittedRef,
    pbFlashedRef, bossCounters, snapshotRef: null as any,
    resetCombo,
  });

  // ── Engine ────────────────────────────────────────────────────────────────
  const dustCallbacks = React.useMemo(() => ({
    getDust:     () => dustRef.current,
    spendDust,
    getAccuracy: getBotAccuracy,
  }), [spendDust, getBotAccuracy, dustRef]);

  const engineConfig: EngineGameConfig = React.useMemo(() => ({
    mode:       gameMode,
    numPlayers,
    speedMult,
    inputMode:  inputMode === "keyboard" ? "keys" as const : "touch" as const,
    godMode:    godMode || practiceMode,
  }), [gameMode, numPlayers, speedMult, inputMode, godMode, practiceMode]);

  const {
    startEngine, stopEngine, pauseEngine, resumeEngine,
    tapCell, isBotActive, handleBotToggle,
    snapshot, snapshotRef,
    heartAnimP1, heartAnimP2, shakeGrid1, shakeGrid2,
    toast: engineToast, pwrToastP1, pwrToastP2, levelUpBadge,
    rareSplash, winner, lastGameScore,
  } = useGameEngine(engineConfig, handleEngineGameOver, dustCallbacks, p1Keys, p2Keys);

  // Wire snapshotRef into gameOver hook
  useEffect(() => {
    // GameOver hook uses a depsRef internally, snapshotRef just needs to flow through
  }, [snapshotRef]);

  // ── Input handler ──────────────────────────────────────────────────────────
  useInputHandler(tapCell, inputMode, p1Keys, p2Keys, screen, paused);

  // ── Background controller ──────────────────────────────────────────────────
  const { background } = useBackgroundController(shopData.equippedBackground, screen, reducedMotion);

  // ── Derived UI ─────────────────────────────────────────────────────────────
  const isPlaying = screen === "playing" || screen === "gameover";
  const is2P      = numPlayers === 2;
  const spdPct    = snapshot ? speedPct(snapshot.tick) : 0;

  // ── Init effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    i18n.init().then(() => setUiReady(true));
    webVitalsMonitor.startMonitoring();
    const h = hydrator.current;
    h.setProgress((pct: number, tier: AssetTier) => setLoadPct(prev => ({ ...prev, [tier]: pct })));
    h.hydrateAll();
  }, []);

  useEffect(() => {
    initGA(typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "7.6.0");
  }, []);

  // Preload heavy chunks on menu
  useEffect(() => {
    if (screen === "menu") {
      import("./components/Shop/ShopPanel");
      import("./components/Backgrounds/PurpleRain");
    }
  }, [screen]);

  // WhatsNew
  useEffect(() => {
    const gamesEver = parseInt(localStorage.getItem("dtp-games-played") ?? "0", 10);
    if (shouldShowWhatsNew() && gamesEver > 0) setShowWhatsNew(true);
  }, []);

  // Login streak + daily challenges on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastClaimed = localStorage.getItem("dtp-login-claimed");
    if (lastClaimed !== todayStr) {
      const streak = getObjectiveStreak();
      const reward = getStreakReward(streak);
      setLoginStreakCount(streak);
      setLoginStreakReward(reward);
      const gamesEver = parseInt(localStorage.getItem("dtp-games-played") ?? "0", 10);
      if (gamesEver > 0) setShouldShowRewardsOnLogin(true);
    }
  }, []);

  // Firebase streak
  useEffect(() => {
    getFirebase().then(fb =>
      fb.fbGetStreak({ clientDate: new Date().toISOString().split("T")[0] })
    ).then(streak => {
      setLoginStreakCount(streak);
      localStorage.setItem("dtp_login_streak", JSON.stringify({ count: streak, lastDate: new Date().toDateString() }));
    }).catch(e => logger.warn("Firebase streak failed", e));
  }, []);

  // Dev key combo (d→d→p on menu)
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
  }, [screen, devMode, toast$]);

  // Visibility — auto-pause on tab hide, restore on show
  useEffect(() => {
    if (screen !== "playing") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        pauseEngine();
      } else if (!pausedRef.current) {
        resumeEngine();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [screen, pauseEngine, resumeEngine]);

  // Double-tap to pause/resume (touch gesture)
  useEffect(() => {
    if (!containerRef.current) return;
    const gesture = new TouchGesture(containerRef.current);
    const unsub = gesture.on("double-tap", () => {
      if (screen !== "playing") return;
      if (paused) { resumeEngine(); setPaused(false); }
      else        { pauseEngine();  setPaused(true);  }
    });
    return () => { unsub(); gesture.destroy(); };
  }, [screen, paused, pauseEngine, resumeEngine]);

  // Rewards after game
  useEffect(() => {
    if (shouldShowRewardsAfterGame && screen === "gameover") {
      const t = setTimeout(() => { setShowRewardsHub(true); setShouldShowRewardsAfterGame(false); }, 600);
      return () => clearTimeout(t);
    }
  }, [shouldShowRewardsAfterGame, screen]);

  // ── Settings open/close ────────────────────────────────────────────────────
  const openSettings = useCallback(() => {
    if (screen === "playing") { pauseEngine(); setPaused(true); }
    setSettingsFromPause(false);
    setShowSettings(true);
  }, [screen, pauseEngine]);

  const openSettingsFromPause = useCallback(() => {
    setSettingsFromPause(true);
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    if (settingsFromPause) {
      setPaused(true); // restore pause overlay, don't resume engine
    } else if (screen === "playing") {
      resumeEngine();
      setPaused(false);
    }
    setSettingsFromPause(false);
  }, [settingsFromPause, screen, resumeEngine]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goMenu = useCallback(() => {
    resumeCheckedRef.current = false;
    setResumeReady(false);
    setResumeData(null);
    pauseEngine();
    setPaused(false);
    setScreen("menu");
    setInitials(playerName || "Player");
    setIE(false);
    setShareMsg("");
    snapshotRef.current = null as any;
  }, [pauseEngine, playerName, setScreen, snapshotRef]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    resumeCheckedRef.current = false;
    setResumeReady(false);
    setResumeData(null);
    if (!practiceMode && energyData.count <= 0) {
      setShowEnergyPopup(true);
      return;
    }
    if (gameMode === "evolve" && !evolveTutorialSeen) {
      setShowTutorial(true);
      return;
    }
    if (!practiceMode) {
      const newEd = { ...energyData, count: energyData.count - 1 };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      setEnergyData(newEd);
    }
    setScreen("playing");
    setPaused(false);
    resetCombo();
    scoreSubmittedRef.current = false;
    peakStreakRef.current     = 0;
    dustAtStartRef.current    = dustRef.current;
    pbFlashedRef.current      = false;
    setBossCounters({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
    const next = incrementGamesPlayed();
    const forceSeed = pendingReplaySeed ? parseInt(pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({ category: "game", message: "game_start", level: "info", data: { mode: gameMode, players: numPlayers, game: next } });
    getFirebase().then(fb => fb.fbLogEvent("game_start", { mode: gameMode, players: numPlayers })).catch(() => {});
    startEngine(forceSeed);
    clearReplaySeed();
  }, [
    practiceMode, energyData, gameMode, evolveTutorialSeen,
    setEnergyData, setScreen, resetCombo, dustRef,
    incrementGamesPlayed, pendingReplaySeed, numPlayers,
    startEngine, clearReplaySeed,
  ]);

  // Tutorial close → start
  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem(EVOLVE_TUTORIAL_SEEN_KEY, "1");
    setEvolveTutorialSeen(true);
    if (!practiceMode && energyData.count <= 0) { setShowEnergyPopup(true); return; }
    if (!practiceMode) {
      const newEd = { ...energyData, count: energyData.count - 1 };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      setEnergyData(newEd);
    }
    setScreen("playing");
    setPaused(false);
    resetCombo();
    scoreSubmittedRef.current = false;
    peakStreakRef.current     = 0;
    dustAtStartRef.current    = dustRef.current;
    pbFlashedRef.current      = false;
    const next = incrementGamesPlayed();
    const forceSeed = pendingReplaySeed ? parseInt(pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({ category: "tutorial", message: "tutorial_completed", level: "info", data: { game: next } });
    getFirebase().then(fb => fb.fbLogEvent("game_start", { mode: gameMode, players: numPlayers })).catch(() => {});
    startEngine(forceSeed);
    clearReplaySeed();
  }, [
    practiceMode, energyData, setEnergyData, setScreen, resetCombo, dustRef,
    incrementGamesPlayed, pendingReplaySeed, gameMode, numPlayers,
    startEngine, clearReplaySeed,
  ]);

  // Pause / Resume
  const pauseGame  = useCallback(() => { pauseEngine();  setPaused(true);  }, [pauseEngine]);
  const resumeGame = useCallback(() => { resumeEngine(); setPaused(false); }, [resumeEngine]);

  // Shop helpers
  const saveShopDataState = useCallback((data: ShopData) => {
    saveShopData(data);
    setShopDataState(data);
  }, []);

  // Offline score queue
  const queueOfflineScore = async (scoreData: any) => {
    try {
      await addPendingScore({ ...scoreData, timestamp: Date.now() });
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register("dtp-score-submit");
      }
      toast$("💾 Score saved offline. Will sync when online.");
    } catch (e) {
      console.error("[DTP] Failed to queue offline score", e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const cbFilter = getCBFilterStyle(colorblindMode);

  return (
    <div
      ref={containerRef}
      className={`root${theme === "light" ? " light-theme" : ""}${reducedMotion ? " reduced-motion" : ""}${colorblindMode !== "none" ? ` cb-${colorblindMode}` : ""}`}
      style={cbFilter ? { filter: cbFilter } : undefined}
      role="main"
    >
      <ColorblindFilters />

      {/* Background */}
      <Suspense fallback={null}>{background}</Suspense>

      {/* Accessibility live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      {/* ── Header ── */}
      <GameHeader
        screen={screen}
        paused={paused}
        onSettingsClick={openSettings}
        onPauseClick={() => paused ? resumeGame() : pauseGame()}
        onLogoClick={screen !== "playing" ? goMenu : () => {}}
        showDevPanel={devMode}
      />

      {/* ── Screens ── */}
      {screen === "loading" && <LoadingScreen pct={loadPct.critical} />}

      {screen === "menu" && (
        <StartScreen
          playerName={playerName}
          gameMode={gameMode}      setGameMode={setGameMode}
          numPlayers={numPlayers}  setNumPlayers={setNumPlayers}
          inputMode={inputMode}    setInputMode={setInputMode}
          dust={dust}
          gamesPlayed={gamesPlayed}
          best1={best1} best2={best2}
          isFeatureUnlocked={machine.isFeatureUnlocked}
          devMode={devMode}
          energyData={energyData}
          resumeReady={resumeReady}
          onPlay={startGame}
          onResumeGame={startGame}
          onHowTo={() => setScreen("howto")}
          onLeaderboard={() => setScreen("leaderboard")}
          onShop={() => setScreen("shop")}
          onKeybind={() => setScreen("keybind")}
          dailyObjective={dailyObjective}
          dailyComplete={dailyComplete}
          weeklyTasks={weeklyTasks}
          onShowDailyChallenges={() => setShowDailyChallenges(true)}
          onShowRewardsHub={() => setShowRewardsHub(true)}
          onShowLoginStreak={() => setShowLoginStreak(true)}
          loginStreakCount={loginStreakCount}
          unclaimedCount={countUnclaimedRewards(weeklyTasks, dailyChallenges)}
          practiceMode={practiceMode}
          onTogglePractice={() => setPracticeMode(p => !p)}
          pendingReplaySeed={pendingReplaySeed}
          onClearReplaySeed={clearReplaySeed}
        />
      )}

      {screen === "howto"       && <HowToPlay onBack={goMenu} />}
      {screen === "keybind"     && <KeyBinder p1Keys={p1Keys} p2Keys={p2Keys} onSave={(k1, k2) => { setP1Keys(k1); setP2Keys(k2); }} onBack={goMenu} />}

      {screen === "leaderboard" && (
        <Suspense fallback={<div className="loading-placeholder">Loading…</div>}>
          <LeaderboardPanel
            playerName={playerName}
            mode={lbMode}
            onModeChange={setLbMode}
            onBack={goMenu}
            onFetchComplete={checkTop10Achievement}
          />
        </Suspense>
      )}

      {screen === "shop" && (
        <Suspense fallback={<div className="loading-placeholder">Loading…</div>}>
          <ShopPanel
            dust={dust}
            shopData={shopData}
            onPurchase={(item, cost) => { spendDust(cost); saveShopDataState({ ...shopData, ...item }); }}
            onEquip={(item) => saveShopDataState({ ...shopData, ...item })}
            onBack={goMenu}
          />
        </Suspense>
      )}

      {/* ── Playing / Game Over HUD ── */}
      {isPlaying && snapshot && (
        <div className={`game-root${shakeGrid1 ? " shake" : ""}`}>

          <HudRow
            screen={screen}
            score={snapshot.p1.score}
            speedPct={spdPct}
            health={snapshot.p1.health}
            heartAnim={heartAnimP1}
            shieldCount={snapshot.p1.shieldCount}
            combo={combo}
            streak={snapshot.p1.streak ?? 0}
            level={snapshot.level ?? 1}
            isEvolve={gameMode === "evolve"}
            is2P={is2P}
            score2={snapshot.p2?.score}
            health2={snapshot.p2?.health}
            heartAnim2={heartAnimP2}
            shieldCount2={snapshot.p2?.shieldCount}
          />

          <EnergyBar energyData={energyData} practiceMode={practiceMode} />

          <div className="game-area">
            <BossUI
              bossUi={bossUi}
              rareSplash={rareSplash}
              rareGridRing={Boolean(rareSplash)}
              gameMode={gameMode}
              screen={screen}
            />

            <GridErrorBoundary onRestart={() => { goMenu(); setTimeout(startGame, 100); }}>
              <PlayerPanel
                snapshot={snapshot}
                gameMode={gameMode}
                onTap={tapCell}
                shakeGrid={shakeGrid1}
                pwrToast={pwrToastP1}
                levelUpBadge={levelUpBadge}
                showBotAssist={screen === "playing"}
                onMenuRequest={goMenu}
              />
            </GridErrorBoundary>

            {is2P && (
              <GridErrorBoundary onRestart={goMenu}>
                <PlayerPanel
                  snapshot={snapshot}
                  gameMode={gameMode}
                  onTap={(id) => tapCell(id, 2)}
                  shakeGrid={shakeGrid2}
                  pwrToast={pwrToastP2}
                  showBotAssist={screen === "playing" && is2P}
                  player={2}
                  onMenuRequest={goMenu}
                />
              </GridErrorBoundary>
            )}
          </div>

          {/* Bot assist pill */}
          {!is2P && gameMode === "evolve" && screen === "playing" && (() => {
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

          <PwrBar snapshot={snapshot} gameMode={gameMode} />
          <DustWidget dust={dust} />
        </div>
      )}

      {/* Game over screen */}
      {screen === "gameover" && (
        <GameOver
          winner={winner}
          snapshot={snapshot}
          playerName={playerName}
          gameMode={gameMode}
          numPlayers={numPlayers}
          best1={best1} best2={best2}
          dust={dust}
          onPlayAgain={startGame}
          onMenu={goMenu}
          shareMsg={shareMsg}
          onShare={() => {
            const url = challengeLink.generate(gameSeedState, gameMode);
            setShareUrl(url);
            setShowShare(true);
          }}
          weeklyTasks={weeklyTasks}
          dailyChallenges={dailyChallenges}
        />
      )}

      {/* ── Pause overlay ── */}
      <PauseOverlay
        paused={paused && screen === "playing"}
        onResume={resumeGame}
        onSettings={openSettingsFromPause}
        onExit={goMenu}
        onExitConfirm={goMenu}
        showExitConfirm={showExitConfirm}
        setShowExitConfirm={setShowExitConfirm}
        dust={dust}
        gameMode={gameMode}
        score={snapshot?.p1.score ?? 0}
        level={snapshot?.level}
      />

      {/* ── Toast ── */}
      <Toast msg={toast} />

      {/* ── Settings drawer ── */}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsDrawer
            colorblindMode={colorblindMode}  setColorblindMode={setColorblindMode}
            theme={theme}                    setTheme={setTheme}
            muted={muted}                    setMuted={toggleMuted}
            haptics={haptics}                setHaptics={setHaptics}
            volume={volume}                  setVolume={setVolume}
            screenShake={screenShake}        setScreenShake={setScreenShake}
            reducedMotion={reducedMotion}    setReducedMotion={setReducedMotion}
            isFS={isFS}                      toggleFS={toggleFS}
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
            availableLocales={i18n.getAvailable() as string[]}
            onLocaleChange={(lang) => { i18n.set(lang as Locale); }}
          />
        </Suspense>
      )}

      {/* ── Popups & modals ── */}
      {showNameEntry && (
        <div className="name-entry-overlay" role="dialog" aria-modal="true">
          <div className="name-entry-card">
            <h2 className="name-entry-title">What's your name?</h2>
            <NameChangeForm
              current={playerName}
              onSubmit={(name) => {
                setPlayerName(name);
                localStorage.setItem(LS_KEYS.PLAYER_NAME, name);
                setShowNameEntry(false);
                if (!appReady) {
                  setAppReady(true);
                  setScreen("menu");
                }
              }}
              onDevTrigger={() => setShowDevUnlock(true)}
            />
          </div>
        </div>
      )}

      {showTutorial && (
        <EvolveTutorial onClose={handleTutorialClose} />
      )}

      {showWhatsNew && (
        <WhatsNew onClose={() => { markWhatsNewSeen(); setShowWhatsNew(false); }} />
      )}

      {showPrivacy && (
        <PrivacyBanner onAccept={() => {
          localStorage.setItem(LS_KEYS.PRIVACY_OK, "1");
          setShowPrivacy(false);
        }} />
      )}

      {showLoginStreak && (
        <LoginStreakPopup
          streakCount={loginStreakCount}
          reward={loginStreakReward}
          onClaim={() => {
            addDust(loginStreakReward, "LoginStreak");
            localStorage.setItem("dtp-login-claimed", new Date().toISOString().slice(0, 10));
            setShowLoginStreak(false);
          }}
          onClose={() => setShowLoginStreak(false)}
        />
      )}

      {showDailyChallenges && (
        <DailyChallengesPopup
          challenges={dailyChallenges}
          onClaim={handleChallengeClaim}
          onClose={() => setShowDailyChallenges(false)}
        />
      )}

      {showRewardsHub && (
        <RewardsHub
          weeklyTasks={weeklyTasks}
          dailyChallenges={dailyChallenges}
          dust={dust}
          onClaimWeekly={handleClaimWeekly}
          onClaimDaily={handleChallengeClaim}
          onClose={() => setShowRewardsHub(false)}
        />
      )}

      {showBuildDeploy && (
        <BuildDeploySection onClose={() => setShowBuildDeploy(false)} />
      )}

      {showDevUnlock && (
        <DevUnlockModal
          onUnlock={() => { setDevMode(true); setShowDevUnlock(false); toast$("🔧 Dev mode unlocked"); }}
          onClose={() => setShowDevUnlock(false)}
        />
      )}

      {devMode && (
        <DevOverlay
          screen={screen}
          gameMode={gameMode}
          snapshot={snapshot}
          godMode={godMode}         setGodMode={setGodMode}
          freezeTime={devFreezeTime} setFreezeTime={setDevFreezeTime}
          autoPlay={devAutoPlay}    setAutoPlay={setDevAutoPlay}
          rotationSpeed={devRotationSpeed} setRotationSpeed={setDevRotationSpeed}
          heatmap={devHeatmap}
          showFps={showFps}         setShowFps={setShowFps}
          fps={fps}
          onClearStorage={() => { if (confirm("Clear ALL local data?")) { localStorage.clear(); location.reload(); } }}
          onClose={() => setDevMode(false)}
        />
      )}

      {/* ── Modals layer (share, name, energy, PWA, SW) ── */}
      <ModalsLayer
        showShare={showShare}
        shareUrl={shareUrl}
        shareMsg={shareMsg}
        onShareClose={() => setShowShare(false)}
        onShareCopy={() => {
          if (shareUrl) navigator.clipboard.writeText(shareUrl).then(() => toast$("📋 Copied!"));
        }}
        showNameChange={false}
        nameInput={""}
        setNameInput={() => {}}
        onNameSave={() => {}}
        onNameClose={() => {}}
        showEnergyPopup={showEnergyPopup}
        energyCount={energyData.count}
        dust={dust}
        dustPerEnergy={GAME.DUST_PER_ENERGY}
        maxEnergy={GAME.MAX_ENERGY}
        onEnergyRefill={() => refillEnergy(toast$)}
        onEnergyClose={() => setShowEnergyPopup(false)}
        showInstallBanner={showInstallBanner}
        isIOS={isIOS}
        onInstallClick={handleInstallClick}
        onInstallDismiss={dismissInstallBanner}
        showSwUpdate={showSwUpdate}
        onSwUpdate={() => { window.location.reload(); }}
        onSwDismiss={() => setShowSwUpdate(false)}
      />

      {/* Offset cursor */}
      {showOffset && cursorPos && (
        <div
          className="dtp-offset-cursor"
          style={{ left: cursorPos.x, top: cursorPos.y }}
          aria-hidden="true"
        />
      )}

      {/* FPS counter */}
      {showFps && <div className="fps-counter" aria-hidden="true">{fps} FPS</div>}

      {/* Achievement queue toast */}
      {achievementQueue.length > 0 && (
        <div className="achievement-toast" aria-live="polite">
          🏆 {achievementQueue[0]?.name}
        </div>
      )}
    </div>
  );
}
