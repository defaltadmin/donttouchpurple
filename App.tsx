import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import "./styles/game.css";
import "./styles/enhancements.css";
import { logger } from "./utils/logger";
import { sessionManager } from "./utils/session";
import { settingsManager } from "./utils/settings";
import { analytics } from "./utils/analytics";
import { audioEngine } from "./utils/audio";
import { i18n, type Locale } from "./utils/i18n";
import { AssetHydrator } from "./utils/asset-hydrator";

type AssetTier = 'critical' | 'deferred' | 'background';
import { Preloader } from "./utils/preloader";
import { gamepadManager } from "./utils/gamepad";
import { configManager } from "./utils/game-config";
import { errorTracker } from "./utils/error-tracker";
import { LazyHydrate } from "./utils/lazy-hydrate";
import { achievementSystem } from "./utils/achievements";
import { scoreCardGen } from "./utils/score-card";
import { privacyManager } from "./utils/privacy";
import { webVitalsMonitor } from "./utils/web-vitals";
import { stateGuard } from "./utils/state-guard";
import { challengeLink } from "./utils/challenge-link";
import { orientationMonitor } from "./utils/orientation";
import { TouchGesture } from "./utils/gestures";
import { visualA11y } from "./utils/visual-a11y";
import { useOffsetCursor } from "./hooks/useOffsetCursor";
import { useEnergyStore } from "./hooks/useEnergyStore";

declare const __APP_VERSION__: string;
import * as Sentry from "@sentry/react";
import { computeMs, speedLabel, speedPct } from "./engine/DifficultyScaler";
import { GAME, LS_KEYS } from "./config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "./config/gridPatterns";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, loadKeys, saveKeys, toLabel } from "./config/keybindings";
import { SHOP_THEMES } from "./config/powerupWeights";
import { setAudioMuted, setAudioVolume, setHapticsEnabled, playVolumeChime, useGameEngine, loadStoredPwr, saveStoredPwr } from "./hooks/useGameEngine";
import { useInputHandler } from "./hooks/useInputHandler";
import type { GameConfig as EngineGameConfig, Winner, PlayerState, GameSnapshot, StoredPowerups, HoldCell } from "./engine/types";

// Components - HUD
import { EnergyBar } from "./components/HUD/EnergyBar";
import { DustWidget } from "./components/HUD/DustWidget";
import { Toast, RareSplash } from "./components/HUD/Toasts";
import { Hearts } from "./components/HUD/Hearts";
import { GridErrorBoundary } from "./components/HUD/GridErrorBoundary";
import { PwrBar } from "./components/HUD/PwrBar";
import { PlayerPanel } from "./components/HUD/PlayerPanel";
import { ShieldDrop } from "./components/Animations/ShieldDrop";
import { FreezeDrop } from "./components/Animations/FreezeDrop";
import { EnergyDrop } from "./components/Animations/EnergyDrop";

// Components - Screens
import { LoadingScreen } from "./components/Screens/LoadingScreen";
import { StartScreen } from "./components/Screens/StartScreen";
import { HowToPlay } from "./components/Screens/HowToPlay";
import { GameOver, getMessage } from "./components/Screens/GameOver";
import { PrivacyBanner } from "./components/Screens/PrivacyBanner";
import EvolveTutorial from "./components/Screens/EvolveTutorial";
import { WhatsNew, shouldShowWhatsNew, markWhatsNewSeen } from "./components/Screens/WhatsNew";
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
import { MouseFollower } from "./components/Backgrounds/MouseFollower";
import { MouseTrail } from "./components/Backgrounds/MouseTrail";

// Daily Objective
import { getDailyObjective, markObjectiveComplete, checkObjective, getObjectiveProgress, type DailyObjective, type BossObjectiveCounters } from "./config/dailyObjective";

// Services (lazy loaded - see getFirebase() below)
import { fbLogEvent, fbFetchTop20Global } from "./services/firebase";
import { initGA, logProgressionEvent, logDesignEvent, logResourceEvent, logErrorEvent } from "./services/gameanalytics";
import { safeGetJSON, safeSet } from "./utils/storage";
import { addPendingScore } from "./utils/pendingScoresDb";
import { useScreenStateMachine, type Screen } from "./hooks/useScreenStateMachine";
import { featureGates } from "./utils/featureGates";

// Components - Settings & Shop
import { KeyBinder } from "./components/Settings/KeyBinder";
const SettingsDrawer = lazy(() => import("./components/Settings/SettingsDrawer").then(m => ({ default: m.SettingsDrawer })));
const ShopPanel = lazy(() => import("./components/Shop/ShopPanel").then(m => ({ default: m.ShopPanel })));
const LeaderboardPanel = lazy(() => import("./components/Leaderboard/LeaderboardPanel").then(m => ({ default: m.LeaderboardPanel })));
// DevOverlay: lazy-loaded, excluded from prod via import.meta.env.DEV dead-code elimination
import { DevOverlay, DevUnlockModal } from "./components/Settings/DevOverlay";
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";
type GameMode        = "classic" | "evolve";
type InputMode       = "touch" | "keyboard";
type GameScreen    = "menu" | "howto" | "leaderboard" | "keybind" | "playing" | "gameover" | "shop";
type NumPlayers      = 1 | 2;
type ColorblindMode  = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

// ─── Safe Sentry wrapper (deferred load + ad-blocker safe) ───
const safeSentry = {
  addBreadcrumb: (...args: Parameters<typeof Sentry.addBreadcrumb>) => { try { Sentry.addBreadcrumb(...args); } catch { /* Sentry unavailable */ } },
  captureException: (...args: Parameters<typeof Sentry.captureException>) => { try { Sentry.captureException(...args); } catch { /* Sentry unavailable */ } },
  setTags: (...args: Parameters<typeof Sentry.setTags>) => { try { Sentry.setTags(...args); } catch { /* Sentry unavailable */ } },
  setContext: (...args: Parameters<typeof Sentry.setContext>) => { try { Sentry.setContext(...args); } catch { /* Sentry unavailable */ } },
};

// ─── Lazy-loaded Firebase ────────────────────────────────────────
let _firebase: typeof import('./services/firebase') | null = null;
async function getFirebase() {
  if (!_firebase) _firebase = await import('./services/firebase');
  return _firebase;
}

// --- Error Boundary ---
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error in Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        } as Record<string, unknown>,
      },
    });
    console.error('[DTP] Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return <div style={{padding:40, color:"white", textAlign:"center", background:"#111", minHeight:"100vh"}}><h2>Something went wrong.</h2><button className="btn-primary" onClick={() => window.location.reload()}>Reload Page</button></div>;
    return this.props.children;
  }
}

// --- Background Control ---
import { useBackgroundController } from './hooks/useBackground';

// --- Helper: Colorblind Filters ---
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

function NameChangeForm({ current, onSubmit, onDevTrigger }: { current: string; onSubmit: (name: string) => void; onDevTrigger?: () => void }) {
  const [val, setVal] = React.useState(current);
  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9_ /]/g, "").trim().slice(0, 8);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.includes("//dev//") && onDevTrigger) { onDevTrigger(); setVal(""); return; }
    setVal(raw);
  };
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <input
        className="name-input"
        value={val}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === "Enter" && sanitize(val)) onSubmit(sanitize(val)); }}
        maxLength={8}
        autoFocus={!('ontouchstart' in window)}
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

function getCBFilterStyle(mode: ColorblindMode): string {
  if (mode === "none") return "";
  return `url(#${mode})`;
}

// --- Storage Helpers ---
function loadShopData() {
  try {
    const r = localStorage.getItem(LS_KEYS.SHOP);
    if (r) {
      const data = JSON.parse(r);
      return {
        unlockedThemes: data.unlockedThemes || data.ownedThemes || ["default"],
        equippedTheme:  data.equippedTheme || "default",
        unlockedBadges: data.unlockedBadges || data.ownedBadges || [],
        equippedBadge:  data.equippedBadge || "",
        unlockedSkins:  data.unlockedSkins || data.ownedSkins || ["default"],
        equippedSkin:   data.equippedSkin || "default",
        unlockedBackgrounds: data.unlockedBackgrounds || ["default"],
        equippedBackground: data.equippedBackground || "default"
      };
    }
  } catch { /* invalid JSON, return defaults */ }
  return { unlockedThemes: ["default"], equippedTheme: "default", unlockedBadges: [], equippedBadge: "", unlockedSkins: ["default"], equippedSkin: "default", unlockedBackgrounds: ["default"], equippedBackground: "default" };
}

type ShopData = {
  unlockedThemes: string[]; equippedTheme: string;
  unlockedBadges: string[]; equippedBadge: string;
  unlockedSkins:  string[]; equippedSkin:  string;
  unlockedBackgrounds: string[]; equippedBackground: string;
};

function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch { /* storage full or unavailable */ }
}

// --- Tutorial ---
import { MAX_TUTORIAL_GAMES } from './config/tutorial';
import { buildDailyChallenges, buildWeeklyTasks } from './utils/rewards';

// --- App Component ---
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDone, setLoadDone] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>(i18n.current);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [gamepadActive, setGamepadActive] = useState(false);
  interface AchievementToast { id: string; icon: string; name: string; desc: string; }
  const [achievementQueue, setAchievementQueue] = useState<AchievementToast[]>([]);
  const [dailyComplete, setDailyComplete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDevPanel, setShowDevPanel] = useState(() => import.meta.env.DEV && localStorage.getItem('dtp:dev') === 'true');
  const [combo, setCombo] = useState({ count: 0, multiplier: 1 });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloaderRef = useRef(new Preloader());
  const assetGateRef = useRef({ setProgress: (_fn: (p: number) => void) => {}, loadAll: () => Promise.resolve() });
  const [bossUi, setBossUi] = useState<{ active: boolean; shieldHits: number; maxShield: number; phase: number }>({ active: false, shieldHits: 0, maxShield: 5, phase: 1 });
  const [comboPop, setComboPop] = useState(false);
  const [gateReady, setGateReady] = useState(false);
  const [gateLoadPct, setGateLoadPct] = useState(0);

  // Resume session state
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null);
  const resumeCheckedRef = useRef(false);

  const hydrator = useRef(new AssetHydrator());
  const [uiReady, setUiReady] = useState(false);
  const [loadPct, setLoadPct] = useState({ critical: 0, deferred: 0, background: 0 });

  const [gamesPlayed, setGamesPlayed] = useState(() =>
    parseInt(localStorage.getItem('dtp-games-played') || '0', 10)
  );
  const [best1, setBest1]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  const [best2, setBest2]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0"));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('dtp:wins') || '0', 10));
  const [deaths, setDeaths] = useState(() => parseInt(localStorage.getItem('dtp:deaths') || '0', 10));

  const machine = useScreenStateMachine({
    bestScore: Math.max(best1, best2),
    gamesPlayed,
    wins,
    deaths
  });
  const screen = machine.current;
  const setScreen = useCallback((s: Screen) => machine.transition(s), [machine]);

  useEffect(() => {
    // 1. Init i18n
    i18n.init().then(() => setUiReady(true));

    // 2. Start Web Vitals monitoring
    webVitalsMonitor.startMonitoring();

    // 3. Configure asset tiers
    const h = hydrator.current;
    h.setProgress((pct: number, tier: AssetTier) => setLoadPct(prev => ({ ...prev, [tier]: pct })));

    // CRITICAL (blocks UI)
    // h.add('/sfx/tick.mp3', 'critical', 'audio');
    // h.add('/sfx/damage.mp3', 'critical', 'audio');
    // h.add('/themes/default-purple.json', 'critical', 'json');

    // DEFERRED (loads after menu shows)
    // h.add('/themes/shop-theme-1.json', 'deferred', 'json');
    // h.add('/themes/shop-theme-2.json', 'deferred', 'json');

    // BACKGROUND (loads during gameplay/idle)
    // h.add('/sfx/boss-intro.mp3', 'background', 'audio');
    // h.add('/sfx/shield-break.mp3', 'background', 'audio');
    // h.add('/bg/ambient-loop.mp3', 'background', 'audio');

    h.hydrateAll();
  }, []);

  const [playerName, setPlayerName] = useState(() => localStorage.getItem(LS_KEYS.PLAYER_NAME) || "");
  const [dust, setDust] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.DUST);
      const parsed = parseInt(raw ?? "0", 10);
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0 || parsed > 9_999_999) {
        localStorage.setItem(LS_KEYS.DUST, "0");
        return 0;
      }
      return parsed;
    } catch { return 0; }
  });
  const dustRef = useRef(dust);
  useEffect(() => { dustRef.current = dust; }, [dust]);
  const scoreSubmittedRef = useRef(false);

  const { energyData, refillEnergy, spendEnergy } = useEnergyStore();

  const [shopData, setShopDataState] = useState(() => loadShopData());

  useEffect(() => {
    initGA(typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "5.9.0");
  }, []);

  useEffect(() => {
    const gamesEver = parseInt(localStorage.getItem('dtp-games-played') ?? '0', 10);
    if (gamesEver > 0 && shouldShowWhatsNew()) setShowWhatsNew(true);
  }, []);

  // Spotlight effect - update CSS vars for card hover glow
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mx', `${x}%`);
      document.documentElement.style.setProperty('--my', `${y}%`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  
  const [gameMode, setGameMode]      = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers]  = useState<NumPlayers>(1);
  const [inputMode, setInputMode]    = useState<InputMode>("touch");
  const [practiceMode, setPracticeMode] = useState(false);
  const [muted, setMuted]            = useState(() => {
    try { return localStorage.getItem("dtp_muted") === "true"; } catch { return false; }
  });
  const [volume, setVolumeState]     = useState(() => {
    try { return parseFloat(localStorage.getItem("dtp_volume") || "0.7"); } catch { return 0.7; }
  });
  const [haptics, setHapticsState] = useState(() => {
    try { return localStorage.getItem("dtp_haptics") !== "false"; } catch { return true; }
  });
  const [screenShake, setScreenShake] = useState(() => {
    try { return localStorage.getItem("dtp_screen_shake") !== "false"; } catch { return true; }
  });
  const [reducedMotion, setReducedMotionState] = useState(() => {
    try {
      const stored = localStorage.getItem("dtp_reduced_motion");
      if (stored !== null) return stored === "true";
      return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    } catch { return false; }
  });
  const setScreenShakePersisted = useCallback((v: boolean) => {
    setScreenShake(v);
    try { localStorage.setItem("dtp_screen_shake", v.toString()); } catch {} // eslint-disable-line no-empty
    fbLogEvent("setting_changed", { setting: "screen_shake", enabled: v });
  }, []);
  const setReducedMotion = useCallback((v: boolean) => {
    setReducedMotionState(v);
    if (v) setScreenShakePersisted(false);
    try { localStorage.setItem("dtp_reduced_motion", v.toString()); } catch {} // eslint-disable-line no-empty
    fbLogEvent("setting_changed", { setting: "reduced_motion", enabled: v });
  }, [setScreenShakePersisted]);
  const backgroundFPS = reducedMotion ? 30 : 60;
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    try { localStorage.setItem("dtp_volume", v.toString()); } catch {} // eslint-disable-line no-empty
    setAudioVolume(v);
    playVolumeChime();
  }, []);
  const toggleMuted = useCallback((m: boolean) => {
    setMuted(m);
    try { localStorage.setItem("dtp_muted", m.toString()); } catch {} // eslint-disable-line no-empty
    setAudioMuted(m);
  }, []);
  const setHaptics = useCallback((enabled: boolean) => {
    setHapticsState(enabled);
    try { localStorage.setItem("dtp_haptics", enabled.toString()); } catch {} // eslint-disable-line no-empty
    setHapticsEnabled(enabled);
    fbLogEvent("setting_changed", { setting: "haptics", enabled });
  }, []);
  const [isFS, setIsFS]              = useState(false);
  const [toast, setToast]            = useState<string|null>(null);
  const [shareMsg, setShareMsg]      = useState("");
  const [gameSeedState, setGameSeedState] = useState(0);
  const [lbMode, setLbMode]          = useState<GameMode>("classic");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // A/B Testing Foundation (ready for Cloudflare Worker routing)
  // IMPORTANT: must be pure during render. Derive variant in an initializer.
  const _abTestVariant = useState<string>(() => {
    try {
      const saved = localStorage.getItem('dtp_ab_variant');
      if (saved) return saved;
      const variant = Math.random() > 0.5 ? 'A' : 'B';
      localStorage.setItem('dtp_ab_variant', variant);
      return variant;
    } catch {
      return 'A';
    }
  })[0];


  // Aggressive preload on menu (Shop + default background)
  useEffect(() => {
    if (screen === "menu") {
      import("./components/Shop/ShopPanel");
      import("./components/Backgrounds/PurpleRain");
    }
  }, [screen]);

  // PWA Install Prompt (One-time + iOS fallback)
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const gamesPlayed = parseInt(localStorage.getItem('dtp-games-played') || '0', 10);
    const promptAlreadyShown = localStorage.getItem('dtp-install-prompt-shown') === 'true';

    if (!promptAlreadyShown && gamesPlayed >= 3) {
      setTimeout(() => setShowInstallBanner(true), 2200);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [screen]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    safeSentry.addBreadcrumb({ category: "pwa", message: "install_prompt", data: { outcome, platform: "android" } });
    fbLogEvent("pwa_install", { outcome, platform: "android" });

    setDeferredPrompt(null);
    setShowInstallBanner(false);
    localStorage.setItem('dtp-install-prompt-shown', 'true');

    if (outcome === 'accepted') toast$("🎉 Added to Home Screen!");
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('dtp-install-prompt-shown', 'true');
  };

  // Offline Score Queue
  const queueOfflineScore = async (scoreData: any) => {
    try {
      await addPendingScore({ ...scoreData, timestamp: Date.now() });
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('dtp-score-submit');
      }
      toast$("💾 Score saved offline. Will sync when online.");
    } catch (e) {
      console.error("[DTP] Failed to queue offline score", e);
    }
  };

  const [pendingReplaySeed, setPendingReplaySeed] = useState<string | null>(
    () => localStorage.getItem("pendingReplaySeed")
  );
  const [customSeedInput, setCustomSeedInput] = useState("");

  const clearReplaySeed = useCallback(() => {
    localStorage.removeItem("pendingReplaySeed");
    setPendingReplaySeed(null);
  }, []);
  const [dailyObjective, setDailyObjective] = useState<DailyObjective>(() => getDailyObjective());
  const [bossCounters, setBossCounters] = useState<BossObjectiveCounters>({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
  const bossCountersRef = useRef(bossCounters);
  useEffect(() => { bossCountersRef.current = bossCounters; }, [bossCounters]);
  const [initials, setInitials]      = useState("");
  const [initialsEntered, setIE]     = useState(false);
  const [theme, setTheme]            = useState<"dark"|"light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [showSettings, setShowSettings]     = useState(false);
  const [settingsFromPause, setSettingsFromPause] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  
  const EVOLVE_TUTORIAL_SEEN_KEY = 'dtp-evolve-tutorial-seen';
  const [evolveTutorialSeen, setEvolveTutorialSeen] = useState(() =>
    Boolean(localStorage.getItem(EVOLVE_TUTORIAL_SEEN_KEY))
  );
  const [showPrivacy, setShowPrivacy]       = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [showLoginStreak, setShowLoginStreak]         = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [loginStreakCount, setLoginStreakCount]        = useState(1);
  const [loginStreakReward, setLoginStreakReward]      = useState(50);
  const [dailyChallenges, setDailyChallenges]         = useState<DailyChallenge[]>([]);
  const [showRewardsHub, setShowRewardsHub]           = useState(false);
  const [weeklyTasks, setWeeklyTasks]                 = useState<WeeklyTask[]>([]);
  const [prevBest, setPrevBest]     = useState(0);

  const [paused, setPaused]         = useState(false);
  const [devMode, setDevMode]       = useState(false);
  // Give 99999 dust when dev mode is enabled
  useEffect(() => { if (devMode) { setDust(99999); localStorage.setItem(LS_KEYS.DUST, "99999"); } }, [devMode]);
  const [showDevUnlock, setShowDevUnlock] = useState(false);
  const [godMode, setGodMode]       = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
   const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap]   = useState<Record<number, number>>({});
    const [showBuildDeploy, setShowBuildDeploy] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showEnergyPopup, setShowEnergyPopup] = useState(false);
    const [shouldShowRewardsAfterGame, setShouldShowRewardsAfterGame] = useState(false);
    const [shouldShowRewardsOnLogin, setShouldShowRewardsOnLogin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => false); // Disable persistent onboarding overlay during gameplay
  const [shareToast, setShareToast] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOffset, setShowOffset] = useState(() => settingsManager.get().offsetPointer ?? false);
  const cursorPos = useOffsetCursor(showOffset, containerRef);
  useEffect(() => { settingsManager.set({ offsetPointer: showOffset }); }, [showOffset]);
  const [showFps, setShowFps] = useState(() => localStorage.getItem('showFps') === 'true');
  const [fps, setFps] = useState(0);
  const fpsFrameRef = useRef(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const peakStreakRef = useRef(0);
  const dustAtStartRef = useRef(dust);
  const pbFlashedRef = useRef(false);
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
          localStorage.setItem("dtp_login_streak", JSON.stringify({
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

  const persistDust = useCallback((d: number) => {
    try { localStorage.setItem(LS_KEYS.DUST, d.toString()); } catch {} // eslint-disable-line no-empty
  }, []);

  const switchPlayer = useCallback(() => {
    // Toggle between player names or show name entry
    setShowNameEntry(true);
  }, []);

  const getLifetimeDustSpent = useCallback(() => {
    try { return parseInt(localStorage.getItem("dtp-lifetime-dust") || "0"); } catch { return 0; }
  }, []);

  const getBotAccuracy = useCallback(() => {
    const spent = getLifetimeDustSpent();
    if (spent >= 2000) return 0.95;
    if (spent >= 500) return 0.90;
    return 0.85;
  }, [getLifetimeDustSpent]);

  const addDust = useCallback((amount: number, source: string): number => {
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) return dustRef.current;
    const base = isNaN(dustRef.current) ? 0 : dustRef.current;
    const newDust = base + amount;
    setDust(newDust);
    dustRef.current = newDust;
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    getFirebase().then(fb => fb.fbSyncDust(playerName, newDust).catch(() => {})).catch(e => logger.warn('Firebase operation failed', e));
    logResourceEvent("Source", "Dust", source, "earned", amount);
    return newDust;
  }, [playerName]);

  const spendDust = useCallback((amount: number) => {
    if (amount === 0) return;
    const raw = dustRef.current - amount;
    const newDust = isNaN(raw) || !isFinite(raw) ? 0 : Math.max(0, raw);
    const spent = getLifetimeDustSpent() + amount;
    try { localStorage.setItem("dtp-lifetime-dust", spent.toString()); } catch {} // eslint-disable-line no-empty
    setDust(newDust);
    dustRef.current = newDust;
    try { localStorage.setItem(LS_KEYS.DUST, newDust.toString()); } catch {} // eslint-disable-line no-empty
    logResourceEvent("Sink", "Dust", "Shop", "generic_spend", amount);
  }, []);

  const [p1Keys, setP1Keys] = useState(() => loadKeys(LS_KEYS.P1_KEYS, DEFAULT_P1_KEYS));
  const [p2Keys, setP2Keys] = useState(() => loadKeys(LS_KEYS.P2_KEYS, DEFAULT_P2_KEYS));

  const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const toast$ = useCallback((msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
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

  // Dev Toggle — type //dev// in name field (legacy) OR type d→d→p on menu screen
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
  }, [screen, devMode, toast$]);

  // Engine Setup
  const [speedMult, setSpeedMult] = useState(1);

  const dustCallbacks = React.useMemo(() => ({
    getDust: () => dustRef.current,
    spendDust,
    getAccuracy: getBotAccuracy,
  }), [spendDust, getBotAccuracy]);

  const engineConfig: EngineGameConfig = React.useMemo(() => ({
    mode: gameMode,
    numPlayers,
    speedMult,
    inputMode: inputMode === "keyboard" ? "keys" as const : "touch" as const,
    godMode: godMode || practiceMode,
  }), [gameMode, numPlayers, speedMult, inputMode, godMode, practiceMode]);

  const handleEngineGameOver = useCallback(async (engineWinner: Winner, p1Score: number, p2Score: number, gameSeed?: number) => {
    Sentry.addBreadcrumb({
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
    fbLogEvent("game_over", {
      mode: gameMode,
      players: numPlayers,
      p1_score: p1Score,
      p2_score: p2Score,
      winner: engineWinner ?? "solo",
      seed: gameSeed ?? 0,
    });
    const rawEarned = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);
    const earned = isNaN(rawEarned) || !isFinite(rawEarned) ? 0 : rawEarned;
    const newDust = addDust(earned, 'GameOver');
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
    logProgressionEvent("Complete", gameMode, p1Score, snapshotRef.current?.tick ?? 0);
    setPrevBest(gameMode === "classic" ? best1 : best2);
    const gameHighScore = gameMode === "classic" ? p1Score : Math.max(p1Score, p2Score);

    // Update progress tracking
    const newWins = wins + (engineWinner === "p1" ? 1 : 0);
    const newDeaths = deaths + (p1Score === 0 ? 1 : 0);
    const newGames = gamesPlayed + 1;

    setWins(newWins);
    setDeaths(newDeaths);
    localStorage.setItem('dtp:wins', newWins.toString());
    localStorage.setItem('dtp:deaths', newDeaths.toString());

    machine.updateProgress({
      bestScore: Math.max(best1, best2, gameHighScore),
      gamesPlayed: newGames,
      wins: newWins,
      deaths: newDeaths
    });

    if (gameMode === "classic") {
      setBest1((b: number) => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_CLASSIC, nb.toString()); return nb; });
    } else {
      setBest2((b: number) => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_EVOLVE, nb.toString()); return nb; });
    }
    setShareMsg(getMessage(earned));
    setGameSeedState(gameSeed ?? snapshotRef.current?.gameSeed ?? 0);
    setInitials(playerName || "Player");
    setIE(false);
    setPaused(false);

    // Auto-submit score through Cloudflare Worker (with offline fallback)
    const autoEntry = {
      score: numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score),
      initials: playerName || "Player",
      mode: gameMode,
      badge: shopData.equippedBadge,
      date: new Date().toISOString().split("T")[0],
      tick: snapshotRef.current?.tick || 0
    };

    if (autoEntry.score > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;

      try {
        const response = await fetch('https://game.mscarabia.com/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(autoEntry)
        });

        if (!response.ok) throw new Error('Worker rejected');
        toast$("🏆 Score submitted to global leaderboard!");

      } catch (err) {
        console.warn("Worker offline, queuing score");
        await addPendingScore(autoEntry);

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          (reg as any).sync.register('dtp-score-submit');
        }
        toast$("💾 Score saved offline — will sync soon");
      }
    }

    // Update daily challenge progress
    updateChallengeProgress(p1Score, snapshotRef.current?.tick ?? 0);

    const obj = getDailyObjective();
    const spd = snapshotRef.current ? speedLabel(snapshotRef.current.tick, false) : "1.0×";
    const finalStreak = peakStreakRef.current;
    const progress = getObjectiveProgress(obj, snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current);
    setGameOverProgress(progress);

    if (!obj.completed) {
      if (checkObjective(obj, snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current)) {
        const completed = markObjectiveComplete();
        if (completed) {
          setDailyObjective(completed);
          const safeReward = isNaN(completed.reward) ? 0 : completed.reward;
          addDust(safeReward, 'DailyObjective');
          setTimeout(() => {
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
    setScreen("gameover");
    if (localStorage.getItem('dtp-show-rewards-after-first-game') === '1') {
      localStorage.removeItem('dtp-show-rewards-after-first-game');
      setShouldShowRewardsAfterGame(true);
    }
  }, [numPlayers, playerName, toast$, best1, best2, gameMode, wins, deaths, gamesPlayed, machine, shopData, addDust, logProgressionEvent]);

  useEffect(() => {
    if (shouldShowRewardsAfterGame && screen === "gameover") {
      const t = setTimeout(() => {
        setShowRewardsHub(true);
        setShouldShowRewardsAfterGame(false);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [shouldShowRewardsAfterGame, screen]);

  useEffect(() => {
    if (shouldShowRewardsOnLogin && screen === "menu") {
      const t = setTimeout(() => {
        setShowRewardsHub(true);
        setShouldShowRewardsOnLogin(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [shouldShowRewardsOnLogin, screen]);

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

  const {
    snapshot,
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
    startBot, stopBot, isBotActive,
    setBotAssist, botAssistActive, botTapHighlights,
    lastGameScore,
    getAutoLowQuality,
    submitScoreToLeaderboard,
    restoreSession,
    restoreSessionSnapshot,
    generateChallengeUrl,
  } = useGameEngine(
    engineConfig,
    handleEngineGameOver,
    dustCallbacks,
    handleDamage,
    (bossType) => {
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
    },
    () => {
      const next = { ...bossCountersRef.current, bombsDefused: bossCountersRef.current.bombsDefused + 1 };
      bossCountersRef.current = next;
      setBossCounters(next);
      safeSentry.addBreadcrumb({ category: "game", message: "bomb_defused", level: "info" });
    },
  );

  const handleCopyChallenge = useCallback(async () => {
    if (!snapshot) return;
    const ok = await challengeLink.copyToClipboard(
      snapshot.p1.score,
      String(snapshot.gameSeed),
      snapshot.p1.health,
    );
    if (ok) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }, [snapshot]);

  // Resume detection on menu screen
  useEffect(() => {
    if (screen !== 'menu') return;
    if (resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    const raw = sessionStorage.getItem('dtp:session');
    if (!raw) { setResumeReady(false); return; }
    const parsed = stateGuard.parse<Record<string, unknown> | null>(raw, null, (d: any) =>
      d && typeof d === 'object' && typeof d.gameSeed === 'number' && typeof d.score === 'number'
    );
    if (parsed) {
      setResumeReady(true);
      setResumeData(parsed);
    } else {
      setResumeReady(false);
    }
  }, [screen]);

  const handleBotToggle = useCallback((player: 1 | 2) => {
    const currentDust = dustRef.current;
    if (!botAssistActive[player] && currentDust < 30) {
      toast$("🤖 Not enough dust for Bot Assist (30 💜 needed)");
      return;
    }
    setBotAssist(player, !botAssistActive[player]);
  }, [botAssistActive, toast$, setBotAssist]);

  // Compute whether backgrounds should animate
  const shouldAnimateBackground = !reducedMotion && (screen === "playing" || screen === "gameover");

  // Background component mapping
  const backgroundMap = React.useMemo<Record<string, { component: React.ComponentType<any> }>>(() => ({
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
  }), []);
  const equippedBackground = backgroundMap[shopData.equippedBackground] || backgroundMap['default'];

  const [settings, setSettings] = useState(settingsManager.get());
  useEffect(() => {
    const unsub = settingsManager.subscribe(s => { setSettings(s); });
    return () => { unsub(); };
  }, []);

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

  const snapshotRef = useRef(snapshot);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => {
    if (!snapshot) return;
    peakStreakRef.current = Math.max(peakStreakRef.current, snapshot.p1.streak);
  }, [snapshot]);

  useEffect(() => {
    Sentry.setTags({
      screen,
      gameMode,
      inputMode,
      numPlayers: String(numPlayers),
      practiceMode: String(practiceMode),
      colorblindMode,
      reducedMotion: String(reducedMotion),
    });
  }, [screen, gameMode, inputMode, numPlayers, practiceMode, colorblindMode, reducedMotion]);

  useEffect(() => {
    if (!snapshot) return;
    Sentry.setContext("game", {
      seed: snapshot.gameSeed,
      tick: snapshot.tick,
      phase: snapshot.phase,
      score: snapshot.p1.score,
      streak: snapshot.p1.streak,
      health: snapshot.p1.health,
      gridStage: snapshot.p1.gridStage,
      patternIdx: snapshot.p1.patternIdx,
      rareMode: snapshot.rareMode.active ? snapshot.rareMode.color : "purple",
    });
  }, [snapshot]);

  const handleResumeGame = useCallback(() => {
    if (!resumeData) return;
    try {
      const success = restoreSessionSnapshot(resumeData);
      if (success) {
        setScreen("playing");
        setPaused(false);
        setResumeReady(false);
        setResumeData(null);
        toast$("📦 Game restored! Score: " + (resumeData.score as number));
      } else {
        toast$("Failed to restore game");
        setResumeReady(false);
        setResumeData(null);
      }
    } catch (e) {
      console.error('Resume failed:', e);
      toast$("Cannot resume - start a new game");
      setResumeReady(false);
      setResumeData(null);
    }
  }, [resumeData, restoreSessionSnapshot, toast$]);

  const resumeGame = useCallback(() => {
    Sentry.addBreadcrumb({ category: "game", message: "resume", level: "info" });
    setPaused(false);
    // Small delay to ensure React state updates before engine fully resumes
    setTimeout(() => {
      resumeEngine();
    }, 16);
  }, [resumeEngine]);

  const pauseGame = useCallback(() => {
    Sentry.addBreadcrumb({ category: "game", message: "pause", level: "info" });
    pauseEngine();
    setPaused(true);
  }, [pauseEngine]);

  // Reduced Motion CSS Vars
  useEffect(() => {
    const handleMotionPref = (e: MediaQueryListEvent) => {
      document.documentElement.style.setProperty('--motion-scale', e.matches ? '0' : '1');
      document.documentElement.style.setProperty('--particles-enabled', e.matches ? '0' : '1');
    };
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
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
          pauseEngine();
          const snap = snapshotRef.current;
          stateGuard.safeStore('dtp:session', {
            ts: Date.now(),
            engineSnapshot: { hearts: snap.p1?.health ?? 1, score: snap.p1?.score ?? 0, timeLeft: GAME.HUMAN_LIMIT_TICK - snap.tick, isPaused: snap.paused }
          });
        }
      } else if (document.visibilityState === 'visible') {
        if (snapshotRef.current?.phase === "paused") {
          resumeEngine();
        }
      }
    };
    const handleUnload = () => {
      if (snapshotRef.current?.phase === "playing") {
        navigator.sendBeacon?.('/api/telemetry', JSON.stringify({ event: 'tab_close', ts: Date.now() }));
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pauseEngine, resumeEngine]);

  // Focus trap for pause overlay
  const focusTrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!paused || !focusTrapRef.current) return;
    const container = focusTrapRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [paused]);

  // Live region timer
  useEffect(() => {
    if (!liveMessage) return;
    const id = setTimeout(() => setLiveMessage(''), 2000);
    return () => clearTimeout(id);
  }, [liveMessage]);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    if (settingsFromPause && paused) {
      // keep paused — user was in pause menu
    }
    setSettingsFromPause(false);
  }, [settingsFromPause, paused]);

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
  }, []);

  useEffect(() => {
    const s = (e: CustomEvent) => devForceStage(e.detail);
    const p = (e: CustomEvent) => devForcePattern(e.detail);
    const r = (e: CustomEvent) => devForceRare(e.detail);
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

  useEffect(() => {
    if (!devAutoPlay || !snapshot || snapshot.phase !== "playing") return;
    const dangerColor = snapshot.rareMode.active ? snapshot.rareMode.color : "purple";
    // Clamp bot speed to at most human-limit; add jitter so it doesn't feel mechanical
    const tickMs = computeMs(snapshot.tick, 1);
    const botMs = Math.max(BOT_HUMAN_MIN_MS, tickMs * 0.85)
      + (Math.random() - 0.5) * BOT_REACTION_JITTER;

    const id = setTimeout(() => {
      const tapPlayer = (active: typeof snapshot.p1.active, player: 1 | 2) => {
        active
          .filter(cell => !cell.clicked && cell.type !== dangerColor)
          .forEach(cell => handleTap(player, cell.idx));
        // Handle hold cells: simulate a full hold
        active
          .filter((cell): cell is HoldCell => !cell.clicked && cell.type === "hold")
          .forEach(cell => {
            handleHoldStart(player, cell.idx);
            setTimeout(() => handleHoldEnd(player, cell.idx), (cell.holdRequired ?? 800) + 50);
          });
      };
      tapPlayer(snapshot.p1.active, 1);
      if (numPlayers === 2 && snapshot.p2) tapPlayer(snapshot.p2.active, 2);
    }, botMs);
    return () => clearTimeout(id);
  }, [devAutoPlay, snapshot, handleTap, handleHoldStart, handleHoldEnd, numPlayers]);

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
      if (e.key === 'f' || e.key === 'F') {
        setShowFps(prev => {
          const next = !prev;
          localStorage.setItem('showFps', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleFpsKey);
    return () => window.removeEventListener('keydown', handleFpsKey);
  }, []);

  // Personal best delta flash
  useEffect(() => {
    if (!snapshot || snapshot.phase !== "playing") return;
    const currentBest = gameMode === "classic" ? best1 : best2;
    if (snapshot.p1.score > currentBest && snapshot.p1.score > 0 && !pbFlashedRef.current) {
      pbFlashedRef.current = true;
      setToast("🎉 New Best!");
    }
  }, [snapshot, gameMode, best1, best2]);

  useEffect(() => {
    if (theme === "light") document.documentElement.classList.add("light-theme");
    else document.documentElement.classList.remove("light-theme");
  }, [theme]);

  // Apply shop theme CSS variables to document root
  useEffect(() => {
    const t = SHOP_THEMES.find(t => t.id === shopData.equippedTheme);
    if (!t || t.id === "default") {
      document.documentElement.style.removeProperty("--theme-purple");
      document.documentElement.style.removeProperty("--theme-accent");
      document.documentElement.style.removeProperty("--theme-bg");
      document.documentElement.style.removeProperty("--theme-text");
      document.documentElement.style.removeProperty("--bg");
      document.documentElement.style.removeProperty("--purple");
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--text");
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

  useEffect(() => {
    const gate = assetGateRef.current;
    gate.setProgress(setGateLoadPct);
    gate.loadAll().then(() => setGateReady(true));
  }, []);

  useEffect(() => {
    const pl = preloaderRef.current;
    pl.setProgress((pct) => setLoadProgress(Math.round(pct * 100)));
    pl.loadAll().finally(() => {});

    let p = 0;
    const interval = setInterval(() => {
      p += 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setLoadDone(true);
        if (!playerName) setShowNameEntry(true);
        else setTimeout(() => setAppReady(true), 600);
      }
      setLoadProgress((prev) => Math.min(100, Math.max(prev, p)));
    }, 80);
    return () => clearInterval(interval);
  }, [playerName]);

  // Transition to menu once the app is fully ready
  useEffect(() => {
    if (appReady && screen === 'loading') {
      setScreen('menu');
    }
  }, [appReady, screen]);

  useEffect(() => {
    configManager.load();
  }, []);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      errorTracker.capture(e.error || new Error(e.message), { source: e.filename, line: e.lineno });
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
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
    const onComboKill = () => { setComboPop(true); setTimeout(() => setComboPop(false), 1500); };
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
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }, { once: true });
    }
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
      const raw = localStorage.getItem('dtp:achievement-toasts');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (queue.length > 0) {
        setAchievementQueue(prev => [...prev, queue[0]]);
        localStorage.setItem('dtp:achievement-toasts', JSON.stringify(queue.slice(1)));
        toastTimer.current = setTimeout(processQueue, 3500);
      }
    };
    processQueue();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    const checkDaily = () => {
      const saved = localStorage.getItem('dtp:daily');
      if (saved) {
        try {
          const { seed, completed } = JSON.parse(saved);
          const today = new Date().toISOString().split('T')[0];
          const expected = btoa(today + '-donttouchpurple-daily').slice(0, 12);
          setDailyComplete(seed === expected && completed);
        } catch { setDailyComplete(false); }
      }
    };
    checkDaily();
    const onDaily = () => setDailyComplete(true);
    window.addEventListener('dtp:daily-complete', onDaily);
    return () => window.removeEventListener('dtp:daily-complete', onDaily);
  }, []);

  const handleShareScore = useCallback(async (score: number, hearts: number, time: number) => {
    try {
      const url = await scoreCardGen.generate({ score, hearts, time, seed: '' });
      setShareUrl(url);
      setShowShare(true);
    } catch (e) { logger.error('Share generation failed', e); }
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem('dtp:telemetry-consent');
    if (consent === null) privacyManager.setConsent(false);
  }, []);

  useEffect(() => {
    const unsub = orientationMonitor.onChange(isLand => {
      setShowRotatePrompt(isLand);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const gesture = new TouchGesture(containerRef.current);
    const unsub = gesture.on('double-tap', () => {
      if (paused) resumeGame();
      else pauseGame();
    });
    return () => { unsub(); gesture.destroy(); };
  }, [paused, resumeGame, pauseGame]);

  const startGame = useCallback(() => {
    resumeCheckedRef.current = false;
    setResumeReady(false);
    setResumeData(null);
    if (!practiceMode && energyData.count <= 0) {
      toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    if (!evolveTutorialSeen) {
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
    localStorage.setItem('dtp-games-played', String(next));
    setGamesPlayed(next);
    const forceSeed = pendingReplaySeed ? parseInt(pendingReplaySeed, 10) : undefined;
    Sentry.addBreadcrumb({
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
    logProgressionEvent("Start", gameMode, 0, 0);
    startEngine(forceSeed);
    if (forceSeed !== undefined) {
      clearReplaySeed();
    }
  }, [startEngine, energyData, practiceMode, gameMode, toast$, pendingReplaySeed, clearReplaySeed, gamesPlayed, dust, numPlayers, inputMode]);

  // Tutorial close handler
  const handleTutorialClose = () => {
    setShowTutorial(false);
    // Mark Evolve tutorial as seen (only once)
    if (gameMode === "evolve") {
      localStorage.setItem(EVOLVE_TUTORIAL_SEEN_KEY, '1');
      setEvolveTutorialSeen(true);
    }
    if (!practiceMode && energyData.count <= 0) {
      toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    const next = gamesPlayed + 1;
    localStorage.setItem('dtp-games-played', String(next));
    setGamesPlayed(next);
    if (next === 1) {
      // Show rewards hub after game-over, not during active play — set a flag
      localStorage.setItem('dtp-show-rewards-after-first-game', '1');
    }
    if (!practiceMode) spendEnergy();
    setScreen("playing");
    setPaused(false);
    scoreSubmittedRef.current = false;
    peakStreakRef.current = 0;
    dustAtStartRef.current = dustRef.current;
    pbFlashedRef.current = false;
    const forceSeed = pendingReplaySeed ? parseInt(pendingReplaySeed, 10) : undefined;
    safeSentry.addBreadcrumb({ category: "tutorial", message: "tutorial_completed", level: "info", data: { game: next } });
    getFirebase().then(fb => fb.fbLogEvent("game_start", {
      mode: gameMode,
      players: numPlayers,
      input: inputMode,
      practice: practiceMode,
      replay_seed: forceSeed ?? 0,
      tutorial_completed: true,
    })).catch(e => logger.warn('Firebase operation failed', e));
    logProgressionEvent("Start", gameMode, 0, 0);
    startEngine(forceSeed);
    if (forceSeed !== undefined) {
      clearReplaySeed();
    }
  };

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
    // Clear snapshot so rare badge and other game-specific UI don't persist on menu
    snapshotRef.current = null as any;
  }, [pauseEngine, playerName]);

  // --- Daily Rewards handlers (Phase C) ---
  const handleLoginStreakClaim = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem('dtp-login-claimed', todayStr);
    const safeReward = (isNaN(loginStreakReward) || !isFinite(loginStreakReward)) ? 50 : loginStreakReward;
    addDust(safeReward, 'LoginStreak');
    setShowLoginStreak(false);
  };

  const handleChallengeClaim = (challengeId: string, reward: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const CHALLENGES_KEY = `dtp-challenges-${todayStr}`;
    const claimed: string[] = JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? '[]');
    claimed.push(challengeId);
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(claimed));
    addDust(reward, 'DailyChallenge');
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
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const WEEKLY_CLAIMED_KEY = `dtp-weekly-claimed-${weekKey}`;
    const claimed: string[] = JSON.parse(localStorage.getItem(WEEKLY_CLAIMED_KEY) ?? '[]');
    claimed.push(taskId);
    localStorage.setItem(WEEKLY_CLAIMED_KEY, JSON.stringify(claimed));
    const safeReward = isNaN(reward) ? 0 : reward;
    addDust(safeReward, 'WeeklyTask');
    setWeeklyTasks(buildWeeklyTasks());
  };

  // Update challenge progress from game over
  const updateChallengeProgress = (p1Score: number, finalTick: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const PROGRESS_KEY = `dtp-challenge-progress-${todayStr}`;
    let progress: Record<string,number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50) progress['score50'] = p1Score;
    if (finalTick >= 60) progress['survive60'] = finalTick;
    if (peakStreakRef.current >= 5) progress['streak5'] = peakStreakRef.current;

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(todayStr));

    // Weekly task progress
    const now2 = new Date();
    const weekStart2 = new Date(now2);
    weekStart2.setDate(now2.getDate() - now2.getDay());
    const weekKey2 = weekStart2.toISOString().slice(0, 10);
    const WEEKLY_PROGRESS_KEY2 = `dtp-weekly-progress-${weekKey2}`;
    let weeklyProgress: Record<string, number> = {};
    try { weeklyProgress = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY2) ?? '{}'); } catch {}
    weeklyProgress['play10'] = (weeklyProgress['play10'] ?? 0) + 1;
    if (p1Score >= 100) weeklyProgress['score100'] = (weeklyProgress['score100'] ?? 0) + 1;
    const modesKey = `dtp-weekly-modes-${weekKey2}`;
    const modesPlayed = new Set<string>(JSON.parse(localStorage.getItem(modesKey) ?? '[]'));
    modesPlayed.add(gameMode);
    localStorage.setItem(modesKey, JSON.stringify([...modesPlayed]));
    weeklyProgress['bothmode'] = modesPlayed.size;
    localStorage.setItem(WEEKLY_PROGRESS_KEY2, JSON.stringify(weeklyProgress));
    setWeeklyTasks(buildWeeklyTasks());
  };

  const submitScore = useCallback(async () => {
    const score = numPlayers === 1
      ? snapshot?.p1.score
      : Math.max(snapshot?.p1.score || 0, snapshot?.p2?.score || 0);
    const tick = snapshot?.tick ?? 0;

    // Sanity: reject physically impossible scores
    const MAX_SCORE_PER_TICK = 20;
    if (score && tick > 0 && score / tick > MAX_SCORE_PER_TICK) {
      console.warn('[DTP] Score rejected: exceeds max score/tick ratio', { score, tick });
      safeSentry.captureException(new Error('Suspicious score submission'), {
        tags: { component: 'leaderboard-submit', type: 'suspicious' },
        extra: { score, tick, ratio: score / tick },
      });
      toast$("⚠️ Score validation failed.");
      return;
    }

    const entry = {
      score: score || 0,
      initials,
      mode: gameMode,
      badge: shopData.equippedBadge,
      date: new Date().toISOString().split("T")[0],
    };
    setIE(true);
    try {
      const fb = await getFirebase();
      await fb.fbAddScoreGlobal(entry);
      safeSentry.addBreadcrumb({ category: "leaderboard", message: "score_submit", level: "info", data: entry });
      fb.fbLogEvent("score_submit", { mode: entry.mode, score: entry.score, has_badge: Boolean(entry.badge) });
    } catch(error) {
      safeSentry.captureException(error, {
        tags: { component: "leaderboard-submit" },
        extra: { entry },
      });
    }
  }, [snapshot, initials, gameMode, shopData.equippedBadge, numPlayers, toast$]);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFS(true)).catch(() => setIsFS(f => !f));
    } else {
      document.exitFullscreen?.().then(() => setIsFS(false));
    }
  }, []);

  const isPlaying = screen === "playing" || screen === "gameover";
  const is2P = numPlayers === 2;
  const cbFilter = getCBFilterStyle(colorblindMode);
  const cbActive = colorblindMode !== "none";
  const loginClaimedToday = localStorage.getItem('dtp-login-claimed') === new Date().toISOString().slice(0, 10);
  const rewardsBadgeCount = countUnclaimedRewards(loginClaimedToday, dailyChallenges, weeklyTasks);

  const equippedTheme = SHOP_THEMES.find(t => t.id === shopData.equippedTheme) || SHOP_THEMES[0];
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

  if (!uiReady) {
    return (
      <div className="dtp-gate-screen">
        <h2>{i18n.t('game.title')}</h2>
        <div className="dtp-hydrate-bar">
          <span>Critical: {Math.round(loadPct.critical * 100)}%</span>
          {loadPct.deferred > 0 && <span>UI: Ready</span>}
        </div>
      </div>
    );
  }

  if (!appReady) {
    return (
      <LoadingScreen
        progress={loadProgress}
        done={loadDone}
        showNameEntry={showNameEntry}
        onNameSubmit={(name) => {
          localStorage.setItem(LS_KEYS.PLAYER_NAME, name);
          setPlayerName(name);
          setShowNameEntry(false);
          setAppReady(true);
        }}
        sanitizeName={(n) => n.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8)}
      />
    );
  }

  return (
    <div ref={containerRef} className={`root${is2P ? " root--2p" : ""}${gameMode === "classic" ? " root--classic" : ""}${theme === "light" ? " light-theme" : ""}${reducedMotion ? " root--reduced-motion" : ""}`}
      style={{ "--cell-1p": cellSizeVar, ...themeVars } as React.CSSProperties}>
      
      <div className="bg-pulse" style={snapshot?.rareMode.active && screen === "playing" ? { background: `radial-gradient(ellipse at 50% 30%, ${snapshot.rareMode.cssColor}44 0%, transparent 65%)`, opacity: 1 } : {}} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

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

      {/* Mouse Follower Blob - adds glassmorphism feel */}
      <MouseFollower color="rgba(138, 43, 226, 0.35)" size={280} blur={70} opacity={0.5} delay={0.12} />
      {/* Mouse Trail - subtle particle effect during gameplay */}
      {screen === "playing" && <MouseTrail enabled={!reducedMotion} />}

      {(engineToast || toast) && <div className="toast" role="status" aria-live="polite" aria-atomic="true">{engineToast || toast}</div>}
      {shareToast && <div className="dtp-toast-success">Link copied! Challenge friends</div>}

      {/* Combo Counter - removed from center, no longer distracts */}

      {/* Boss Banner */}
      {snapshot?.bossEvent && screen === "playing" && (
        <div className={`boss-banner boss-banner--${snapshot.bossEvent.type}`}>
          {snapshot.bossEvent.type === "storm"     && "⚡ STORM — CELLS SHUFFLE FASTER! ⚡"}
          {snapshot.bossEvent.type === "inversion" && "🔄 INVERSION — SAFE & DANGER SWAPPED! 🔄"}
          {snapshot.bossEvent.type === "blackout"  && "🌑 BLACKOUT — SURVIVE IN THE DARK! 🌑"}
        </div>
      )}

      {/* Shield Boss UI */}
      {bossUi.active && (
        <div className="dtp-boss-bar" aria-label="Boss Shield Health">
          <div className="dtp-boss-label">⚔️ BOSS PHASE {bossUi.phase}</div>
          <div className="dtp-boss-track"><div className="dtp-boss-fill" style={{ width: `${(bossUi.shieldHits / bossUi.maxShield) * 100}%` }} /></div>
          <div className="dtp-boss-hp">{bossUi.shieldHits}/{bossUi.maxShield}</div>
        </div>
      )}
      {comboPop && <div className="dtp-combo-popup">⚡ COMBO x2 ⚡</div>}

      {showPrivacy && (
        <PrivacyBanner onDismiss={() => {
          localStorage.setItem(LS_KEYS.PRIVACY_OK, "1");
          setShowPrivacy(false);
        }} />
      )}

      {rareSplash && (
        <div className="rare-splash">
          <span className="rare-splash-text" style={{ color: rareSplash.cssColor, textShadow: `0 0 60px ${rareSplash.cssColor}, 0 0 120px ${rareSplash.cssColor}66` }}>
            DON'T<br/>TOUCH<br/>{rareSplash.color.toUpperCase()}!
          </span>
        </div>
      )}

      {screen === "playing" && snapshot?.rareMode.active && (
        <div
          className="rare-grid-ring"
          style={{ "--rare-color": snapshot.rareMode.cssColor, ...(reducedMotion ? { animation: 'none' } : {}) } as React.CSSProperties}
        >
          <div className="rare-pip-row">
            {Array.from({ length: snapshot.rareMode.turnsLeft }).map((_, i) => (
              <span key={i} className="rare-pip" style={{ background: snapshot!.rareMode.cssColor }} />
            ))}
          </div>
        </div>
      )}

      {showOnboarding && screen === 'playing' && (
        <div className="dtp-onboarding" role="dialog" aria-label="Quick visual tutorial">
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
        <div className="dtp-modal-backdrop" onClick={() => setSettingsOpen(false)} aria-hidden="true">
          <div className="dtp-modal" role="dialog" aria-modal="true" aria-label="Game Settings" onClick={e => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="dtp-setting-row">
              <label>Master Volume</label>
              <input type="range" min="0" max="1" step="0.1" value={settings.masterVolume}
                     onChange={e => settingsManager.set({ masterVolume: parseFloat(e.target.value) })} />
            </div>
            <div className="dtp-setting-row">
              <label>Haptics</label>
              <button onClick={() => settingsManager.set({ hapticsEnabled: !settings.hapticsEnabled })}
                      className={`dtp-toggle ${settings.hapticsEnabled ? 'on' : 'off'}`}>
                {settings.hapticsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label>Show FPS</label>
              <button onClick={() => settingsManager.set({ showFps: !settings.showFps })}
                      className={`dtp-toggle ${settings.showFps ? 'on' : 'off'}`}>
                {settings.showFps ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label>Reduced Motion</label>
              <button onClick={() => settingsManager.set({ reducedMotion: !settings.reducedMotion })}
                      className={`dtp-toggle ${settings.reducedMotion ? 'on' : 'off'}`}>
                {settings.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label>Offset Touch Cursor</label>
              <button onClick={() => setShowOffset(v => !v)}
                      className={`dtp-toggle ${showOffset ? 'on' : 'off'}`}
                      aria-label="Toggle offset touch cursor for mobile visibility"
                      aria-pressed={showOffset}>
                {showOffset ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label><span className="dtp-text-label">{visualA11y.icons.colorblind} Colorblind Patterns</span></label>
              <button onClick={() => settingsManager.set({ colorblindMode: !settings.colorblindMode })}
                      className={`dtp-toggle ${settings.colorblindMode ? 'on' : 'off'}`}
                      data-icon={visualA11y.icons.colorblind}>
                {settings.colorblindMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label><span className="dtp-text-label">{visualA11y.icons.iconMode} Icon-Only UI</span></label>
              <button onClick={() => settingsManager.set({ iconOnlyMode: !settings.iconOnlyMode })}
                      className={`dtp-toggle ${settings.iconOnlyMode ? 'on' : 'off'}`}
                      data-icon={visualA11y.icons.iconMode}>
                {settings.iconOnlyMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="dtp-setting-row">
              <label><span className="dtp-text-label">{visualA11y.icons.lite} Lite Mode (Low-End)</span></label>
              <button onClick={() => settingsManager.set({ liteMode: !settings.liteMode })}
                      className={`dtp-toggle ${settings.liteMode ? 'on' : 'off'}`}
                      data-icon={visualA11y.icons.lite}>
                {settings.liteMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <button className="dtp-btn dtp-btn-secondary" onClick={() => setSettingsOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {showShare && shareUrl && (
        <div className="dtp-modal-backdrop" onClick={() => setShowShare(false)} aria-hidden="true">
          <div className="dtp-share-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Share Score</h2>
            <img src={shareUrl} alt="Score card" className="dtp-share-preview" />
            <div className="dtp-share-actions">
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="dtp-btn dtp-btn-primary">Copy Link</button>
              <a href={shareUrl} download="donttouchpurple-score.png" className="dtp-btn dtp-btn-secondary">Download PNG</a>
              <button onClick={() => setShowShare(false)} className="dtp-btn dtp-btn-tertiary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
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
      )}

      {import.meta.env.DEV && showDevUnlock && (
        <DevUnlockModal
          onUnlock={() => { setShowDevUnlock(false); setDevMode(true); }}
          onClose={() => setShowDevUnlock(false)}
        />
      )}

      {showBuildDeploy && (
        <BuildDeploySection onClose={() => setShowBuildDeploy(false)} />
      )}

      {showNameEntry && appReady && (
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
                localStorage.setItem(LS_KEYS.PLAYER_NAME, name);
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
        <div className="pause-overlay" ref={focusTrapRef}>
          <div className="pause-card">
            <div className="pause-title">⏸ PAUSED</div>
            <div className="pause-hud-grid">
              <div className="pause-hud-item">
                <span className="pause-hud-label">Score</span>
                <span className="pause-hud-value">{snapshot?.p1.score ?? 0}</span>
              </div>
              {is2P && (
                <div className="pause-hud-item">
                  <span className="pause-hud-label">P2 Score</span>
                  <span className="pause-hud-value">{snapshot?.p2?.score ?? 0}</span>
                </div>
              )}
              <div className="pause-hud-item">
                <span className="pause-hud-label">Stage</span>
                <span className="pause-hud-value">{(snapshot?.p1.gridStage ?? 0) + 1}</span>
              </div>
              <div className="pause-hud-item">
                <span className="pause-hud-label">Streak</span>
                <span className="pause-hud-value pause-hud-streak">{(snapshot?.p1.streak ?? 0) > 0 ? `🔥 ${snapshot?.p1.streak}` : "—"}</span>
              </div>
              <div className="pause-hud-item">
                <span className="pause-hud-label">Speed</span>
                <span className="pause-hud-value">{snapshot ? speedLabel(snapshot.tick, snapshot.p1.freezeEnd > Date.now()) : "1.0×"}</span>
              </div>
              {snapshot && snapshot.p1.freezeEnd > Date.now() && (
                <div className="pause-hud-item">
                  <span className="pause-hud-label">Freeze</span>
                  <span className="pause-hud-value pause-hud-freeze">❄ {Math.ceil((snapshot.p1.freezeEnd - Date.now()) / 1000)}s</span>
                </div>
              )}
              {snapshot && snapshot.p1.multiplierEnd > Date.now() && (
                <div className="pause-hud-item">
                  <span className="pause-hud-label">Multiplier</span>
                  <span className="pause-hud-value pause-hud-mult">⚡ {Math.ceil((snapshot.p1.multiplierEnd - Date.now()) / 1000)}s</span>
                </div>
              )}
              {snapshot && snapshot.p1.shieldCount > 0 && (
                <div className="pause-hud-item">
                  <span className="pause-hud-label">Shield</span>
                  <span className="pause-hud-value pause-hud-shield">🛡 ×{snapshot.p1.shieldCount}</span>
                </div>
              )}
            </div>
            <button className="btn-play" onClick={resumeGame}>▶ RESUME</button>
            <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={() => {
              resumeEngine();
              setPaused(false);
              setTimeout(() => { startEngine(); }, 50);
            }}>↺ Restart</button>
            <div className="pause-settings-row">
              <button
                className={`pause-setting-btn${muted ? " pause-setting-btn--active-mute" : " pause-setting-btn--active-sound"}`}
                onClick={() => setMuted(m => !m)} title="Sound">
                {muted ? "🔇" : "🔊"}<span>{muted ? "Muted" : "Sound"}</span>
              </button>
              <button className="pause-setting-btn" onClick={toggleFS} title="Fullscreen">
                {isFS ? "⊡" : "⊞"}<span>{isFS ? "Exit FS" : "Full"}</span>
              </button>
              <button className="pause-setting-btn" onClick={() => { setSettingsFromPause(true); setShowSettings(true); }} title="Settings">
                ⚙️<span>Settings</span>
              </button>
            </div>
              <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={() => setShowExitConfirm(true)}>🏠 Exit to Menu</button>
            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>Esc to resume · Exiting ends your game</div>
          </div>
        </div>
      )}

      {showOffset && cursorPos.visible && (
        <div className="dtp-offset-cursor" style={{ left: cursorPos.x, top: cursorPos.y, position: 'fixed', pointerEvents: 'none' }} aria-hidden="true" />
      )}

      {showExitConfirm && (
        <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏠 Exit to Menu?</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 16px" }}>Your current game will end and progress will be lost.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setShowExitConfirm(false); resumeEngine(); setPaused(false); goMenu(); }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      <header className={`hdr${isFS ? " hdr--hidden" : ""}`}>
        <span className="logo logo--shimmer" style={{cursor: screen !== "menu" && screen !== "playing" && screen !== "gameover" ? "pointer" : "default"}}
          onClick={() => { if (screen !== "menu" && screen !== "playing" && screen !== "gameover") setScreen("menu"); }}>
          Don't Touch the{" "}
          <span className="txt-p" style={snapshot?.rareMode.active && screen !== "menu" && screen !== "leaderboard" && screen !== "shop"
            ? { color: snapshot.rareMode.cssColor, textShadow: `0 0 20px ${snapshot.rareMode.cssColor}99`, transition:"color 0.5s, text-shadow 0.5s" }
            : {}}>
            {snapshot?.rareMode.active && screen !== "menu" && screen !== "leaderboard" && screen !== "shop" ? snapshot.rareMode.color.charAt(0).toUpperCase() + snapshot.rareMode.color.slice(1) : "Purple"}
          </span>
        </span>
        {screen === "playing" && practiceMode && <span className="practice-badge">∞ PRACTICE</span>}
        <div className="hdr-right" style={{display:"flex",alignItems:"center",gap:4}}>
          <div className="dust-counter"><DustWidget dust={dust} /></div>
          {isPlaying && screen === "playing"
            ? <button className="btn-icon btn-icon--pause" onClick={pauseGame} title="Pause">⏸</button>
            : <button className="btn-icon" onClick={() => setShowSettings(s => !s)} title="Settings">⚙</button>
          }
        </div>
      </header>

      {(screen === "leaderboard" || screen === "howto" || screen === "shop") && (
        <button className="universal-back-btn" onClick={() => setScreen("menu")}>← Back</button>
      )}

      {screen === "leaderboard" && (
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
      )}
      {screen === "howto" && <HowToPlay onClose={() => setScreen("menu")} />}
      {screen === "shop" && (
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
      )}

      {screen === "menu" && (
        <StartScreen
          playerName={playerName}
          isFeatureUnlocked={(f) => machine.isFeatureUnlocked(f, devMode)}
          dailyObjective={dailyObjective}
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
          resumeReady={resumeReady}
          resumeData={resumeData}
          onResumeGame={handleResumeGame}
          onToast={toast$}
        />
      )}

      {/* Dev Panel — lightweight overlay, Ctrl+Shift+D to toggle */}
      {showDevPanel && import.meta.env.DEV && (
        <div className="dtp-dev-overlay" aria-hidden="true">
          <h4>Dev Mode</h4>
          <div className="dtp-dev-grid">
            <label><input type="checkbox" checked={showFps} onChange={() => setShowFps(!showFps)} /> FPS</label>
            <label><input type="checkbox" checked={showDevPanel} onChange={() => { setShowDevPanel(false); localStorage.removeItem('dtp:dev'); }} /> Disable Dev</label>
            <button onClick={() => { if (!confirm('Clear ALL local progress, settings & cache? This cannot be undone.')) return; localStorage.clear(); location.reload(); }} className="dtp-dev-btn">Clear Storage & Reload</button>
            <button onClick={() => settingsManager.set({ ...settingsManager.get() })} className="dtp-dev-btn">Re-apply Settings</button>
          </div>
          <small>Ctrl+Shift+D to toggle</small>
        </div>
      )}

      {/* DevOverlay — eliminated from prod bundle by Rollup dead-code elimination */}
      {import.meta.env.DEV && devMode && (
        <DevOverlay
          p1={snapshot?.p1 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0 } as PlayerState}
          p2={snapshot?.p2 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0 } as PlayerState}
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
      )}

      {isPlaying && snapshot && (
         <div className="hud">
          <div className={`hud-card hud-card--score${snapshot.p1.streak >= 10 ? " streak--high" : snapshot.p1.streak >= 5 ? " streak--mid" : ""}`}>
            <div className="hud-lbl">Score</div>
            <div className="hud-score-row">
              <div className={`hud-val${snapshot.p1.score > (gameMode === "classic" ? best1 : best2) && snapshot.p1.score > 0 ? " hud-val--pb" : ""}`}>
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
          <div className="game-area">
           <GridErrorBoundary onRestart={() => { goMenu(); setTimeout(startGame, 100); }}>
           {snapshot?.isBlackout && screen === "playing" && (
            <div className="blackout-overlay" />
          )}
          <PwrBar ps={snapshot.p1} rareMode={snapshot.rareMode} />
          
          {screen === "gameover" && (
            <div className="go-overlay">
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
                onAgain={startGame}
                onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
                onMenu={goMenu}
                spinLevel={snapshot.spinLevel}
                isHumanLimit={snapshot.phase === "humanlimit"}
                dustEarned={isNaN(dust - dustAtStartRef.current) ? 0 : dust - dustAtStartRef.current}
                objectiveProgress={gameOverProgress}
                />
              <button className="dtp-icon-btn" onClick={() => handleShareScore(snapshot.p1.score, snapshot.p1.health, snapshot.tick)} title="Share Score" style={{marginTop:8}}>Share Score</button>
              <button className="dtp-icon-btn" onClick={handleCopyChallenge} title="Copy challenge link" aria-label="Share score & challenge friends" style={{marginTop:8}}>Challenge</button>
            </div>
          )}
          
          <ShieldDrop active={pwrToastP1?.includes("Shield") ?? false} />
          <FreezeDrop active={pwrToastP1?.includes("Freeze") ?? false} />
          <EnergyDrop active={pwrToastP1?.includes("⚡") ?? false} />
          {is2P && <ShieldDrop active={pwrToastP2?.includes("Shield") ?? false} />}
          {is2P && <FreezeDrop active={pwrToastP2?.includes("Freeze") ?? false} />}
          {is2P && <EnergyDrop active={pwrToastP2?.includes("⚡") ?? false} />}

          <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim}
            onTap={i => { handleTap(1, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
            onHoldStart={i => handleHoldStart(1,i)} onHoldEnd={i => handleHoldEnd(1,i)}
            keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP1)}
            label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
            colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid1}
            cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
            onPause={pauseGame} isFS={isFS}
            equippedSkin={shopData.equippedSkin} snapshot={snapshot}
            pwrToast={pwrToastP1}
            levelUpBadge={levelUpBadge}
            storedFreezeCharges={snapshot.p1.storedFreezeCharges}
            storedShieldCharges={snapshot.p1.storedShieldCharges}
            onActivateFreeze={() => activateStoredFreeze(1)}
            onActivateShield={() => activateStoredShield(1)}
            showStoredPwr={screen === "playing"}
            practiceMode={practiceMode}
            onToggleBotAssist={() => handleBotToggle(1)}
            showBotAssist={screen === "playing"}
            isBotActive={botAssistActive[1]}
            botTapHighlights={botTapHighlights[1]}
            dust={dust} />
           {is2P && (
             <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim}
               onTap={i => { handleTap(2, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
              onHoldStart={i => handleHoldStart(2,i)} onHoldEnd={i => handleHoldEnd(2,i)}
              keyLabels={p2Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP2)}
              label="P2" heartAnim={heartAnimP2} mode={gameMode}
              colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={screenShake && !reducedMotion && shakeGrid2}
              cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
              onPause={pauseGame} isFS={isFS}
              equippedSkin={shopData.equippedSkin} snapshot={snapshot}
              pwrToast={pwrToastP2}
              storedFreezeCharges={snapshot.p2.storedFreezeCharges}
              storedShieldCharges={snapshot.p2.storedShieldCharges}
              onActivateFreeze={() => activateStoredFreeze(2)}
              onActivateShield={() => activateStoredShield(2)}
              showStoredPwr={screen === "playing"}
              practiceMode={practiceMode}
              onToggleBotAssist={() => handleBotToggle(2)}
              showBotAssist={screen === "playing" && is2P}
              isBotActive={botAssistActive[2]}
              botTapHighlights={botTapHighlights[2]}
              dust={dust} />
          )}
          </GridErrorBoundary>        </div>
      )}

      {gamepadActive && <div className="dtp-gamepad-badge">🎮 Gamepad Active</div>}

      {achievementQueue.length > 0 && (
        <div className="dtp-toast-stack" aria-live="polite">
          {achievementQueue.map((a, i) => (
            <div key={a.id} className="dtp-toast-achievement" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="dtp-toast-icon">{a.icon}</span>
              <div className="dtp-toast-content">
                <strong>🏆 {a.name}</strong>
                <small>{a.desc}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRotatePrompt && (
        <div className="dtp-rotate-overlay" role="alert" aria-live="polite">
          <div className="dtp-rotate-card">
            <span className="dtp-rotate-icon">📱↔️📱</span>
            <h3>Rotate Your Device</h3>
            <p>Please play in portrait mode for the best experience.</p>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-content">
            {isIOS ? (
              <>
                <strong>Play instantly from your home screen</strong>
                <div className="ios-instructions">
                  1. Tap the <strong>Share</strong> button <span style={{fontSize:"22px"}}>⎙</span><br/>
                  2. Scroll and tap <strong>"Add to Home Screen"</strong>
                </div>
              </>
            ) : (
              <>
                <strong>Want the full arcade experience?</strong>
                <span>Add to Home Screen for lightning-fast access</span>
              </>
            )}

            {!isIOS && deferredPrompt && (
              <button className="btn-primary" onClick={handleInstallClick}>
                📲 Add to Home Screen
              </button>
            )}

            <button className="btn-ghost" onClick={dismissInstallBanner}>
              Not Now
            </button>
          </div>
        </div>
      )}

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
        <div className="modal-overlay" onClick={() => setShowEnergyPopup(false)}>
          <div className="modal-panel energy-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚡ Energy</span>
              <button className="btn-icon" onClick={() => setShowEnergyPopup(false)}>✕</button>
            </div>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "var(--font-score)" }}>
                {energyData.count} / {GAME.MAX_ENERGY}
              </div>
              <div style={{ fontSize: 12, opacity: 0.55, fontFamily: "var(--font-ui)", marginTop: 4 }}>
                Refills 1 every {Math.round(GAME.ENERGY_REGEN_MS / 60000)} min
              </div>
            </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn-ghost" style={{ width: "100%" }}
              disabled={energyData.count >= GAME.MAX_ENERGY || dustRef.current < GAME.DUST_PER_ENERGY}
              onClick={() => {
                spendDust(GAME.DUST_PER_ENERGY);
                refillEnergy(1, GAME.DUST_PER_ENERGY);
                toast$("⚡ Energy refilled!");
              }}>
              Refill 1 game — {GAME.DUST_PER_ENERGY} 💜
            </button>
            <button className="btn-primary" style={{ width: "100%" }}
              disabled={energyData.count >= GAME.MAX_ENERGY || dustRef.current < (GAME.MAX_ENERGY - energyData.count) * GAME.DUST_PER_ENERGY}
              onClick={() => {
                const needed = GAME.MAX_ENERGY - energyData.count;
                const cost = needed * GAME.DUST_PER_ENERGY;
                spendDust(cost);
                refillEnergy(needed, cost);
                toast$("⚡ Energy full!");
                setShowEnergyPopup(false);
              }}>
              Refill to Full — {(GAME.MAX_ENERGY - energyData.count) * GAME.DUST_PER_ENERGY} 💜
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}



