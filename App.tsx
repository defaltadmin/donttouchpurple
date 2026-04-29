import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles/game.css";

// Engine & Config
import { computeMs, speedLabel, speedPct } from "./engine/DifficultyScaler";
import { GAME, LS_KEYS } from "./config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "./config/gridPatterns";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, loadKeys, saveKeys, toLabel } from "./config/keybindings";
import { SHOP_THEMES } from "./config/powerupWeights";
import { setAudioMuted, setAudioVolume, playVolumeChime, useGameEngine, loadStoredPwr, saveStoredPwr } from "./hooks/useGameEngine";
import { useInputHandler } from "./hooks/useInputHandler";
import type { GameConfig as EngineGameConfig, Winner, PlayerState, GameSnapshot, StoredPowerups, HoldCell } from "./engine/types";

// Components - HUD
import { EnergyBar } from "./components/HUD/EnergyBar";
import { DustWidget } from "./components/HUD/DustWidget";
import { Toast, RareSplash } from "./components/HUD/Toasts";
import { Hearts } from "./components/HUD/Hearts";
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
import { EvolveTutorial, shouldShowEvolveTutorial } from "./components/Screens/EvolveTutorial";
import { WhatsNew, shouldShowWhatsNew, markWhatsNewSeen } from "./components/Screens/WhatsNew";

// Components - Settings & Shop
import { SettingsDrawer } from "./components/Settings/SettingsDrawer";
import { KeyBinder } from "./components/Settings/KeyBinder";
import { ShopPanel } from "./components/Shop/ShopPanel";
import { LeaderboardPanel } from "./components/Leaderboard/LeaderboardPanel";
import { DevOverlay, DevUnlockModal } from "./components/Settings/DevOverlay";
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";

// Daily Objective
import { getDailyObjective, markObjectiveComplete, checkObjective, type DailyObjective } from "./config/dailyObjective";

// Services
import {
  fbAddScoreGlobal,
  fbCheckWeeklyBonus,
  fbFetchTop20Global,
  fbSyncDust,
  fbGetStreak,
} from "./services/firebase";

// Types
type GameMode        = "classic" | "evolve";
type InputMode       = "touch" | "keyboard";
type GameScreen    = "menu" | "howto" | "leaderboard" | "keybind" | "playing" | "gameover" | "shop";
type NumPlayers      = 1 | 2;
type ColorblindMode  = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

// --- Error Boundary ---
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div style={{padding:40, color:"white", textAlign:"center", background:"#111", minHeight:"100vh"}}><h2>Something went wrong.</h2><button className="btn-primary" onClick={() => window.location.reload()}>Reload Page</button></div>;
    return this.props.children;
  }
}

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
        autoFocus
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
        equippedSkin:   data.equippedSkin || "default"
      };
    }
  } catch {}
  return { unlockedThemes: ["default"], equippedTheme: "default", unlockedBadges: [], equippedBadge: "", unlockedSkins: ["default"], equippedSkin: "default" };
}

type ShopData = {
  unlockedThemes: string[]; equippedTheme: string;
  unlockedBadges: string[]; equippedBadge: string;
  unlockedSkins:  string[]; equippedSkin:  string;
};

function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch {}
}

// --- App Component ---
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDone, setLoadDone] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);

  // Persistence State
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(LS_KEYS.PLAYER_NAME) || "");
  const [dust, setDust] = useState(() => parseInt(localStorage.getItem(LS_KEYS.DUST) || "0"));
  const [energyData, setEnergyData] = useState(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.ENERGY);
      if (r) return JSON.parse(r);
    } catch {}
    return { count: GAME.MAX_ENERGY, lastRegen: Date.now() };
  });

  const [shopData, setShopDataState] = useState(() => loadShopData());

  // Daily login streak (Phase 3 seed)
  const [loginStreak, setLoginStreak] = useState<{ count: number }>({ count: 1 });

  useEffect(() => {
    fbGetStreak().then(streak => {
      setLoginStreak({ count: streak });
      localStorage.setItem("dtp_login_streak", JSON.stringify({
        count: streak,
        lastDate: new Date().toDateString()
      }));
    });
  }, []);

  useEffect(() => {
    if (shouldShowWhatsNew()) setShowWhatsNew(true);
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
  const [screenShake, setScreenShake] = useState(() => {
    try { return localStorage.getItem("dtp_screen_shake") !== "false"; } catch { return true; }
  });
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    try { localStorage.setItem("dtp_volume", v.toString()); } catch {}
    setAudioVolume(v);
    playVolumeChime();
  }, []);
  const toggleMuted = useCallback((m: boolean) => {
    setMuted(m);
    try { localStorage.setItem("dtp_muted", m.toString()); } catch {}
    setAudioMuted(m);
  }, []);
  const [isFS, setIsFS]              = useState(false);
  const [toast, setToast]            = useState<string|null>(null);
  const [shareMsg, setShareMsg]      = useState("");
  const [lbMode, setLbMode]          = useState<GameMode>("classic");
  const [screen, setScreen]          = useState<GameScreen>("menu");
  const [dailyObjective, setDailyObjective] = useState<DailyObjective>(() => getDailyObjective());
  const [initials, setInitials]      = useState("");
  const [initialsEntered, setIE]     = useState(false);
  const [theme, setTheme]            = useState<"dark"|"light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [showSettings, setShowSettings]     = useState(false);
  const [settingsFromPause, setSettingsFromPause] = useState(false);
  const [showEvolveTutorial, setShowEvolveTutorial] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showPrivacy, setShowPrivacy]       = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [best1, setBest1]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  const [best2, setBest2]           = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_EVOLVE) || "0"));
  const [paused, setPaused]         = useState(false);
  const [devMode, setDevMode]       = useState(false);
  const [showDevUnlock, setShowDevUnlock] = useState(false);
  const [godMode, setGodMode]       = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap]   = useState<Record<number, number>>({});
  const [showBuildDeploy, setShowBuildDeploy] = useState(false);

  const [p1Keys, setP1Keys] = useState(() => loadKeys(LS_KEYS.P1_KEYS, DEFAULT_P1_KEYS));
  const [p2Keys, setP2Keys] = useState(() => loadKeys(LS_KEYS.P2_KEYS, DEFAULT_P2_KEYS));

  const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const toast$ = useCallback((msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), GAME.TOAST_DURATION_MS);
  }, []);

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
  const engineConfig: EngineGameConfig = React.useMemo(() => ({
    mode: gameMode,
    numPlayers,
    speedMult,
    godMode: godMode || practiceMode,
  }), [gameMode, numPlayers, speedMult, godMode, practiceMode]);

  const handleEngineGameOver = useCallback((engineWinner: Winner, p1Score: number, p2Score: number) => {
    const earned = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);
    const newDust = dust + earned;
    setDust(newDust);
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    fbSyncDust(playerName, newDust).catch(() => {});
    const gameHighScore = gameMode === "classic" ? p1Score : Math.max(p1Score, p2Score);
    if (gameMode === "classic") {
      setBest1((b: number) => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_CLASSIC, nb.toString()); return nb; });
    } else {
      setBest2((b: number) => { const nb = Math.max(b, gameHighScore); localStorage.setItem(LS_KEYS.BEST_EVOLVE, nb.toString()); return nb; });
    }
    setShareMsg(getMessage(earned));
    setInitials(playerName || "Player");
    setIE(false);
    setPaused(false);
    
    // Daily objective check
    const obj = getDailyObjective();
    if (!obj.completed) {
      const spd = snapshotRef.current ? speedLabel(snapshotRef.current.tick, false) : "1.0×";
      const finalStreak = snapshotRef.current?.p1.streak ?? 0;
      if (checkObjective(obj, snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd)) {
        const completed = markObjectiveComplete();
        if (completed) {
          setDailyObjective(completed);
          const bonusDust = newDust + completed.reward;
          setDust(bonusDust);
          localStorage.setItem(LS_KEYS.DUST, bonusDust.toString());
          setTimeout(() => toast$(`🎯 Daily done! +${completed.reward} 💜`), 800);
        }
      }
    }

    setScreen("gameover");
  }, [numPlayers, dust, playerName, toast$]);

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
  } = useGameEngine(engineConfig, handleEngineGameOver);

  const snapshotRef = useRef(snapshot);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

  const resumeGame = useCallback(() => {
    resumeEngine();
    setPaused(false);
  }, [resumeEngine]);

  const pauseGame = useCallback(() => {
    pauseEngine();
    setPaused(true);
  }, [pauseEngine]);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    if (settingsFromPause && paused) {
      // keep paused — user was in pause menu
    }
    setSettingsFromPause(false);
  }, [settingsFromPause, paused]);

  // Dev Events
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

  // Escape key → pause/resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (screen === "playing" && snapshot?.phase === "playing") { pauseGame(); return; }
      if (screen === "playing" && paused) { resumeGame(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, paused, snapshot?.phase, pauseGame, resumeGame]);

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

  // Task 5: Natural Energy Regeneration
  const energyDataRef = useRef(energyData);
  useEffect(() => { energyDataRef.current = energyData; }, [energyData]);

  useEffect(() => {
    const id = setInterval(() => {
      const ed = energyDataRef.current;
      if (ed.count >= GAME.MAX_ENERGY) return;
      const now = Date.now();
      const elapsed = now - ed.lastRegen;
      if (elapsed >= GAME.ENERGY_REGEN_MS) {
        const gained = Math.floor(elapsed / GAME.ENERGY_REGEN_MS);
        const newCount = Math.min(GAME.MAX_ENERGY, ed.count + gained);
        const newLastRegen = ed.lastRegen + gained * GAME.ENERGY_REGEN_MS;
        const newEd = { count: newCount, lastRegen: newLastRegen };
        setEnergyData(newEd);
        localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      }
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
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
      setLoadProgress(p);
    }, 80);
    return () => clearInterval(interval);
  }, [playerName]);

  const startGame = useCallback(() => {
    if (!practiceMode && energyData.count <= 0) {
      toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    if (!practiceMode) {
      const newEd = { ...energyData, count: energyData.count - 1 };
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      setEnergyData(newEd);
    }
    if (gameMode === "evolve" && shouldShowEvolveTutorial()) {
      setShowEvolveTutorial(true);
      return;
    }
    setScreen("playing");
    setPaused(false);
    startEngine();
  }, [startEngine, energyData, practiceMode, gameMode, toast$]);

  const dismissEvolveTutorial = useCallback(() => {
    setShowEvolveTutorial(false);
    setScreen("playing");
    setPaused(false);
    startEngine();
  }, [startEngine]);

  const goMenu = useCallback(() => {
    pauseEngine();
    setPaused(false);
    setScreen("menu");
    setInitials(playerName || "Player");
    setIE(false);
    setShareMsg("");
  }, [pauseEngine, playerName]);

  const refillEnergy = useCallback(() => {
    if (energyData.count >= GAME.MAX_ENERGY) {
      toast$("⚡ Energy already full!");
      return;
    }
    if (dust >= GAME.DUST_PER_ENERGY) {
      const newDust = dust - GAME.DUST_PER_ENERGY;
      const newEd = { count: energyData.count + 1, lastRegen: energyData.lastRegen };
      setDust(newDust);
      localStorage.setItem(LS_KEYS.DUST, newDust.toString());
      setEnergyData(newEd);
      localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
      toast$("⚡ Energy refilled!");
    } else {
      toast$("💜 Not enough dust!");
    }
  }, [dust, energyData, toast$]);

  const submitScore = useCallback(async () => {
    const score = numPlayers === 1 ? snapshot?.p1.score : Math.max(snapshot?.p1.score || 0, (snapshot?.p2?.score || 0));
    const entry = { score: score || 0, initials, mode: gameMode, badge: shopData.equippedBadge };
    setIE(true);
    try { await fbAddScoreGlobal(entry as any); } catch(_) {}
  }, [snapshot, initials, gameMode, shopData.equippedBadge, numPlayers]);

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
    <div className={`root${is2P ? " root--2p" : ""}${gameMode === "classic" ? " root--classic" : ""}${theme === "light" ? " light-theme" : ""}`}
      style={{ "--cell-1p": cellSizeVar, ...themeVars } as React.CSSProperties}>
      
      <div className="bg-pulse" style={snapshot?.rareMode.active ? { background: `radial-gradient(ellipse at 50% 30%, ${snapshot.rareMode.cssColor}44 0%, transparent 65%)`, opacity: 1 } : {}} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <ColorblindFilters />

      {(engineToast || toast) && <div className="toast">{engineToast || toast}</div>}

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

      {showEvolveTutorial && <EvolveTutorial onClose={dismissEvolveTutorial} />}
      {showWhatsNew && <WhatsNew onClose={() => { markWhatsNewSeen(); setShowWhatsNew(false); }} />}

      {showSettings && (
        <SettingsDrawer
          colorblindMode={colorblindMode} setColorblindMode={setColorblindMode}
          theme={theme} setTheme={setTheme}
          muted={muted} setMuted={toggleMuted}
          volume={volume} setVolume={setVolume}
          screenShake={screenShake} setScreenShake={setScreenShake}
          isFS={isFS} toggleFS={toggleFS}
          onClose={closeSettings}
          onNameChange={() => setShowNameEntry(true)}
          playerName={playerName}
          onOpenBuildDeploy={() => setShowBuildDeploy(true)}
        />
      )}

      {showDevUnlock && (
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

      {paused && (
        <div className="pause-overlay">
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
              <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={() => {
              if (window.confirm("Exit to menu? Your current game will end.")) {
                resumeEngine();
                setPaused(false);
                goMenu();
              }
            }}>🏠 Exit to Menu</button>
            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>Esc to resume · Exiting ends your game</div>
          </div>
        </div>
      )}

      <header className={`hdr${isFS ? " hdr--hidden" : ""}`}>
        <span className="logo" style={{cursor: screen !== "menu" && screen !== "playing" && screen !== "gameover" ? "pointer" : "default"}}
          onClick={() => { if (screen !== "menu" && screen !== "playing" && screen !== "gameover") setScreen("menu"); }}>
          Don't Touch the{" "}
          <span className="txt-p" style={snapshot?.rareMode.active && screen !== "menu" && screen !== "leaderboard" && screen !== "shop"
            ? { color: snapshot.rareMode.cssColor, textShadow: `0 0 20px ${snapshot.rareMode.cssColor}99`, transition:"color 0.5s, text-shadow 0.5s" }
            : {}}>
            {snapshot?.rareMode.active && screen !== "menu" && screen !== "leaderboard" && screen !== "shop" ? snapshot.rareMode.color.charAt(0).toUpperCase() + snapshot.rareMode.color.slice(1) : "Purple"}
          </span>
        </span>
        {screen === "playing" && practiceMode && <span className="practice-badge">∞ PRACTICE</span>}
        <div className="hdr-right" style={{display:"flex",alignItems:"center",gap:8}}>
          <DustWidget dust={dust} />
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
        <LeaderboardPanel
          mode={lbMode}
          onClose={() => setScreen("menu")}
          fetchGlobalScores={fbFetchTop20Global}
          classicStorageKey={LS_KEYS.LB_CLASSIC}
          evolveStorageKey={LS_KEYS.LB_EVOLVE}
        />
      )}
      {screen === "howto" && <HowToPlay onClose={() => setScreen("menu")} />}
      {screen === "shop" && (
        <ShopPanel
          dust={dust}
          onDustChange={d => { setDust(d); setShopDataState(loadShopData()); }}
          onClose={() => setScreen("menu")}
          devMode={devMode}
          loadShopData={loadShopData}
          saveShopData={saveShopData}
          loadStoredPowerups={loadStoredPwr}
          saveStoredPowerups={saveStoredPwr}
          persistDust={(d) => { localStorage.setItem(LS_KEYS.DUST, d.toString()); }}
        />
      )}

      {screen === "menu" && (
        <StartScreen
          playerName={playerName}
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
          onHowTo={() => setScreen("howto")}
          onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
          onShop={() => setScreen("shop")}
          onKeybind={() => setScreen("keybind")}
          onRefillEnergy={refillEnergy}
          onSwitchPlayer={() => setShowNameEntry(true)}
          dustWidget={<DustWidget dust={dust} />}
          energyBar={<EnergyBar energy={energyData.count} energyLastRegen={energyData.lastRegen} onRefill={refillEnergy} onRefillFull={() => {
            const needed = GAME.MAX_ENERGY - energyData.count;
            if (needed <= 0) { toast$("⚡ Energy already full!"); return; }
            const cost = needed * GAME.DUST_PER_ENERGY;
            if (dust >= cost) {
              const newDust = dust - cost;
              const newEd = { count: GAME.MAX_ENERGY, lastRegen: energyData.lastRegen };
              setDust(newDust);
              localStorage.setItem(LS_KEYS.DUST, newDust.toString());
              setEnergyData(newEd);
              localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
              toast$("⚡ Energy fully refilled!");
            } else {
              toast$("💜 Not enough dust!");
            }
          }} dust={dust} />}
        />
      )}

      {/* DevFab removed for stealth (Task 6) */}

      {devMode && (
        <DevOverlay
          p1={snapshot?.p1 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0 } as PlayerState}
          p2={snapshot?.p2 ?? { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: false, shieldCount: 0, alive: true, active: [], cells: [], anim: {}, freezeEnd: 0, multiplierEnd: 0, stageProgress: 0, storedFreezeCharges: 0, storedShieldCharges: 0 } as PlayerState}
          tick={snapshot?.tick || 0}
          gameMode={gameMode}
          numPlayers={numPlayers}
          rareMode={snapshot?.rareMode || { active: false, color: "purple", cssColor: "#c026d3", turnsLeft: 0 }}
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
          onDustAdd={amount => {
            const newDust = dust + amount;
            setDust(newDust);
            localStorage.setItem(LS_KEYS.DUST, newDust.toString());
          }}
          onSpawnPowerup={devSpawnPowerup}
          gameSeed={snapshot?.gameSeed || 0}
          autoPlay={devAutoPlay}
          onAutoPlayToggle={() => setDevAutoPlay(v => !v)}
          heatmap={devHeatmap}
          onResetHeatmap={() => setDevHeatmap({})}
          gridCols={snapshot?.grid?.cols ?? 3}
          gridRows={snapshot?.grid?.rows ?? 3}
        />
      )}

      {!is2P && isPlaying && snapshot && (
        <div className="hud">
          <div className="hud-card hud-card--score">
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
        </div>
      )}

      {isPlaying && snapshot && (
        <div className="spd-wrap">
          <div className="spd-track"><div className="spd-fill" style={{width: speedPct(snapshot.tick) + "%"}} /></div>
        </div>
      )}

      {isPlaying && snapshot && (
        <div className="game-area">
          <PwrBar ps={snapshot.p1} />
          
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
                gameSeed={snapshot.gameSeed || 0}
                tick={snapshot.tick}
                p1={snapshot.p1}
                initialsEntered={initialsEntered}
                initials={initials}
                onInitialsChange={setInitials}
                onSubmitScore={submitScore}
                onPlay={startGame}
                onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
                onMenu={goMenu}
                spinLevel={snapshot.spinLevel}
                isHumanLimit={snapshot.phase === "humanlimit"}
              />
            </div>
          )}
          
          <ShieldDrop active={pwrToastP1?.includes("Shield") ?? false} />
          <FreezeDrop active={pwrToastP1?.includes("Freeze") ?? false} />
          <EnergyDrop active={pwrToastP1?.includes("multiplier") ?? false} />
          {is2P && <ShieldDrop active={pwrToastP2?.includes("Shield") ?? false} />}
          {is2P && <FreezeDrop active={pwrToastP2?.includes("Freeze") ?? false} />}
          {is2P && <EnergyDrop active={pwrToastP2?.includes("multiplier") ?? false} />}

          <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim} 
            onTap={i => { handleTap(1, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
            onHoldStart={i => handleHoldStart(1,i)} onHoldEnd={i => handleHoldEnd(1,i)}
            keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP1)}
            label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
            colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={shakeGrid1}
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
            practiceMode={practiceMode} />
          {is2P && (
            <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim} 
              onTap={i => { handleTap(2, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
              onHoldStart={i => handleHoldStart(2,i)} onHoldEnd={i => handleHoldEnd(2,i)}
              keyLabels={p2Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP2)}
              label="P2" heartAnim={heartAnimP2} mode={gameMode}
              colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={shakeGrid2}
              cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
              onPause={pauseGame} isFS={isFS}
              equippedSkin={shopData.equippedSkin} snapshot={snapshot}
              pwrToast={pwrToastP2}
              storedFreezeCharges={snapshot.p2.storedFreezeCharges}
              storedShieldCharges={snapshot.p2.storedShieldCharges}
              onActivateFreeze={() => activateStoredFreeze(2)}
              onActivateShield={() => activateStoredShield(2)}
              showStoredPwr={screen === "playing"}
              practiceMode={practiceMode} />
          )}        </div>
      )}

      {screen === "menu" && (
        <footer className="credit">
          {loginStreak.count >= 2 && (
            <span className="daily-streak-badge">🗓 Day {loginStreak.count} streak</span>
          )}
          <span>By Mohammed Ahmed Siddiqui · <a href="https://mscarabia.com" target="_blank" rel="noopener noreferrer" className="credit-link">mscarabia.com</a></span>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="credit-link" style={{marginLeft:6}}>Privacy</a>
        </footer>
      )}
    </div>
  );
}
