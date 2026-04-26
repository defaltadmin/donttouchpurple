import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles/game.css";

// Engine & Config
import { computeMs, speedLabel, speedPct } from "./engine/DifficultyScaler";
import { GAME, LS_KEYS } from "./config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "./config/gridPatterns";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, loadKeys, saveKeys, toLabel } from "./config/keybindings";
import { SHOP_THEMES } from "./config/powerupWeights";
import { setAudioMuted, useGameEngine } from "./hooks/useGameEngine";
import { useInputHandler } from "./hooks/useInputHandler";
import type { GameConfig as EngineGameConfig, Winner } from "./engine/types";

// Components - HUD
import { EnergyBar } from "./components/HUD/EnergyBar";
import { DustWidget } from "./components/HUD/DustWidget";
import { Toast, RareSplash } from "./components/HUD/Toasts";
import { Hearts } from "./components/HUD/Hearts";
import { PwrBadges } from "./components/HUD/PwrBadges";
import { PlayerPanel } from "./components/HUD/PlayerPanel";

// Components - Screens
import { LoadingScreen } from "./components/Screens/LoadingScreen";
import { StartScreen } from "./components/Screens/StartScreen";
import { HowToPlay } from "./components/Screens/HowToPlay";
import { GameOver, getMessage } from "./components/Screens/GameOver";
import { PrivacyBanner } from "./components/Screens/PrivacyBanner";

// Components - Settings & Shop
import { SettingsDrawer } from "./components/Settings/SettingsDrawer";
import { KeyBinder } from "./components/Settings/KeyBinder";
import { ShopPanel } from "./components/Shop/ShopPanel";
import { LeaderboardPanel } from "./components/Leaderboard/LeaderboardPanel";
import { DevOverlay, DevUnlockModal, DevFab } from "./components/Settings/DevOverlay";
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";

// Services
import {
  fbAddScoreGlobal,
  fbCheckWeeklyBonus,
  fbFetchTop20Global,
  fbSyncDust,
} from "./services/firebase";

// Types
type GameMode        = "classic" | "evolve";
type InputMode       = "touch" | "keyboard";
type Screen          = "menu" | "howto" | "leaderboard" | "keybind" | "playing" | "gameover" | "shop";
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

function saveShopData(d: any) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch {}
}

function loadStoredPwr() {
  try {
    const r = localStorage.getItem(LS_KEYS.STORED_PWR);
    if (r) return JSON.parse(r);
  } catch {}
  return { freeze: 0, shield: 0, mult: 0, heart: 0 };
}

function saveStoredPwr(d: any) {
  try { localStorage.setItem(LS_KEYS.STORED_PWR, JSON.stringify(d)); } catch {}
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

  // UI State
  const [screen, setScreen]         = useState<Screen>("menu");
  const [gameMode, setGameMode]      = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers]  = useState<NumPlayers>(1);
  const [inputMode, setInputMode]    = useState<InputMode>("touch");
  const [muted, setMuted]            = useState(false);
  const [isFS, setIsFS]              = useState(false);
  const [toast, setToast]            = useState<string|null>(null);
  const [shareMsg, setShareMsg]      = useState("");
  const [lbMode, setLbMode]          = useState<GameMode>("classic");
  const [initials, setInitials]      = useState("");
  const [initialsEntered, setIE]     = useState(false);
  const [theme, setTheme]            = useState<"dark"|"light">("dark");
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [showSettings, setShowSettings]     = useState(false);
  const [showPrivacy, setShowPrivacy]       = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [best1, setBest1]           = useState(0);
  const [best2, setBest2]           = useState(0);
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
    toastRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Dev Toggle — type //dev// in name field to unlock
  useEffect(() => {
    // Shortcut removed for stealth (Task 6)
  }, []);

  // Engine Setup
  const [speedMult, setSpeedMult] = useState(1);
  const engineConfig: EngineGameConfig = React.useMemo(() => ({
    mode: gameMode,
    numPlayers,
    speedMult,
  }), [gameMode, numPlayers, speedMult]);

  const handleEngineGameOver = useCallback((engineWinner: Winner, p1Score: number, p2Score: number) => {
    const earned = numPlayers === 1 ? p1Score : Math.max(p1Score, p2Score);
    const newDust = dust + earned;
    setDust(newDust);
    localStorage.setItem(LS_KEYS.DUST, newDust.toString());
    fbSyncDust(playerName, newDust).catch(() => {});
    setBest1((b: number) => Math.max(b, p1Score));
    setBest2((b: number) => Math.max(b, p2Score));
    setShareMsg(getMessage(earned));
    setInitials(playerName || "Player");
    setIE(false);
    setPaused(false);
    setScreen("gameover");
  }, [numPlayers, dust, playerName]);

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

  // Dev Events
  useEffect(() => {
    const s = (e: any) => devForceStage(e.detail);
    const p = (e: any) => devForcePattern(e.detail);
    const r = (e: any) => devForceRare(e.detail);
    window.addEventListener("dtp-dev-stage", s);
    window.addEventListener("dtp-dev-pattern", p);
    window.addEventListener("dtp-dev-rare", r);
    return () => {
      window.removeEventListener("dtp-dev-stage", s);
      window.removeEventListener("dtp-dev-pattern", p);
      window.removeEventListener("dtp-dev-rare", r);
    };
  }, [devForceStage, devForcePattern, devForceRare]);

  useEffect(() => { devSetGodMode(godMode); }, [godMode, devSetGodMode]);
  useEffect(() => { devSetFreezeTime(devFreezeTime); }, [devFreezeTime, devSetFreezeTime]);
  useEffect(() => { devSetRotationSpeed(devRotationSpeed); }, [devRotationSpeed, devSetRotationSpeed]);

  useEffect(() => {
    if (!devAutoPlay || !snapshot || snapshot.phase !== "playing") return;
    const dangerColor = snapshot.rareMode.active ? snapshot.rareMode.color : "purple";
    const id = setInterval(() => {
      snapshot.p1.active.forEach(cell => {
        if (cell.type !== dangerColor && cell.type !== "purple") {
          handleTap(1, cell.idx);
        }
      });
      if (numPlayers === 2 && snapshot.p2) {
        snapshot.p2.active.forEach(cell => {
          if (cell.type !== dangerColor && cell.type !== "purple") {
            handleTap(2, cell.idx);
          }
        });
      }
    }, 120);
    return () => clearInterval(id);
  }, [devAutoPlay, snapshot, handleTap, numPlayers]);

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
    }, 30000);
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
    if (energyData.count <= 0) {
      toast$("⚡ No energy! Wait or refill with 💜 dust.");
      return;
    }
    const newEd = { ...energyData, count: energyData.count - 1 };
    localStorage.setItem(LS_KEYS.ENERGY, JSON.stringify(newEd));
    setEnergyData(newEd);
    setScreen("playing");
    setPaused(false);
    startEngine();
  }, [startEngine, energyData, toast$]);

  const resumeGame = useCallback(() => {
    resumeEngine();
    setPaused(false);
  }, [resumeEngine]);

  const pauseGame = useCallback(() => {
    pauseEngine();
    setPaused(true);
  }, [pauseEngine]);

  const goMenu = useCallback(() => {
    pauseEngine();
    setPaused(false);
    setScreen("menu");
  }, [pauseEngine]);

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
    const entry = { score: score || 0, initials, date: new Date().toLocaleDateString(), mode: gameMode, badge: shopData.equippedBadge };
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
      style={{ "--cell-1p": cellSizeVar, ...themeVars } as any}>
      
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

      {showSettings && (
        <SettingsDrawer
          colorblindMode={colorblindMode} setColorblindMode={setColorblindMode}
          theme={theme} setTheme={setTheme}
          muted={muted} setMuted={setMuted}
          isFS={isFS} toggleFS={toggleFS}
          onClose={() => setShowSettings(false)}
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
        <div className="drawer-overlay" style={{ zIndex: 9999 }} onClick={() => setShowNameEntry(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <div className="drawer-header">
              <span className="drawer-title">✏️ Change Name</span>
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
            <div className="pause-score">Score: <strong>{snapshot?.p1.score}{is2P ? ` · ${snapshot?.p2.score}` : ""}</strong></div>
            <button className="btn-play" onClick={resumeGame}>▶ RESUME</button>
            <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={() => { resumeGame(); setTimeout(() => startGame(), 50); }}>↺ Restart</button>
            <div className="pause-settings-row">
              <button className="pause-setting-btn" onClick={() => setMuted(m => !m)} title="Sound">
                {muted ? "🔇" : "🔊"}<span>{muted ? "Muted" : "Sound On"}</span>
              </button>
              <button className="pause-setting-btn" onClick={toggleFS} title="Fullscreen">
                {isFS ? "⊡" : "⊞"}<span>{isFS ? "Exit FS" : "Fullscreen"}</span>
              </button>
              <button className="pause-setting-btn" onClick={() => { resumeGame(); setTimeout(() => setShowSettings(true), 100); }} title="Settings">
                ⚙<span>Settings</span>
              </button>
            </div>
            <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={goMenu}>🏠 Exit to Menu</button>
            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>Exiting will end your current game</div>
          </div>
        </div>
      )}

      <header className={`hdr${isFS ? " hdr--hidden" : ""}`}>
        <span className="logo" style={{cursor: screen !== "menu" && screen !== "playing" && screen !== "gameover" ? "pointer" : "default"}}
          onClick={() => { if (screen !== "menu" && screen !== "playing" && screen !== "gameover") setScreen("menu"); }}>
          Don't Touch the{" "}
          <span className="txt-p" style={snapshot?.rareMode.active
            ? { color: snapshot.rareMode.cssColor, textShadow: `0 0 20px ${snapshot.rareMode.cssColor}99`, transition:"color 0.5s, text-shadow 0.5s" }
            : {}}>
            {snapshot?.rareMode.active ? snapshot.rareMode.color.charAt(0).toUpperCase() + snapshot.rareMode.color.slice(1) : "Purple"}
          </span>
        </span>
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
          p1={snapshot?.p1 || { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: 0, alive: true, active: [] } as any}
          p2={snapshot?.p2 || { score: 0, health: 0, gridStage: 0, patternIdx: 0, streak: 0, shield: 0, alive: true, active: [] } as any}
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
              <div className="hud-val">{snapshot.p1.score}</div>
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

      {!is2P && isPlaying && snapshot && (
        <>
          <div className="pwr-zone pwr-zone--1p" style={{ flexDirection: "column", gap: 2 }}>
            <PwrBadges shield={snapshot.p1.shield} freezeEnd={snapshot.p1.freezeEnd} multiplierEnd={snapshot.p1.multiplierEnd} levelUpBadge={levelUpBadge} />
          </div>
          {screen === "playing" && (snapshot.p1.storedFreezeCharges > 0 || snapshot.p1.storedShieldCharges > 0) && (
            <div className="stored-pwr-inline">
              {snapshot.p1.storedFreezeCharges > 0 && (
                <button className="stored-pwr-inline-btn stored-pwr-inline-btn--freeze" onClick={() => activateStoredFreeze(1)}>
                  <span className="stored-pwr-inline-icon">❄</span>
                  <span className="stored-pwr-inline-label">Freeze</span>
                  <span className="stored-pwr-inline-count">×{snapshot.p1.storedFreezeCharges}</span>
                </button>
              )}
              {snapshot.p1.storedShieldCharges > 0 && (
                <button className="stored-pwr-inline-btn stored-pwr-inline-btn--shield" onClick={() => activateStoredShield(1)}>
                  <span className="stored-pwr-inline-icon">◈</span>
                  <span className="stored-pwr-inline-label">Shield</span>
                  <span className="stored-pwr-inline-count">×{snapshot.p1.storedShieldCharges}</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {isPlaying && snapshot && (
        <div className="game-area">
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
                p1={snapshot.p1 as any}
                initialsEntered={initialsEntered}
                initials={initials}
                onInitialsChange={setInitials}
                onSubmitScore={submitScore}
                onPlay={startGame}
                onLeaderboard={() => { setLbMode(gameMode); setScreen("leaderboard"); }}
                onMenu={goMenu}
                spinLevel={snapshot.spinLevel}
              />
            </div>
          )}

          <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim} 
            onTap={i => { handleTap(1, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
            onHoldStart={i => handleHoldStart(1,i)} onHoldEnd={i => handleHoldEnd(1,i)}
            keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP1)}
            label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
            colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={shakeGrid1}
            cellShape={snapshot.cellShape} rareMode={snapshot.rareMode}
            onPause={pauseGame} isFS={isFS}
            equippedSkin={shopData.equippedSkin} snapshot={snapshot}
            pwrToast={pwrToastP1} />
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
              pwrToast={pwrToastP2} />
          )}        </div>
      )}

      {screen === "menu" && (
        <footer className="credit">
          <span>By Mohammed Ahmed Siddiqui · <a href="https://mscarabia.com" target="_blank" rel="noopener noreferrer" className="credit-link">mscarabia.com</a></span>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="credit-link" style={{marginLeft:6}}>Privacy</a>
        </footer>
      )}
    </div>
  );
}
