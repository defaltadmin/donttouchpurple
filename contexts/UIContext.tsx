// contexts/UIContext.tsx
// Centralises modal/overlay/panel visibility state.
// Toggling any panel here will NOT re-render game grid consumers.
import React, { createContext, useContext, useState } from "react";
import { LS_KEYS } from "../config/difficulty";

interface UIContextValue {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  settingsFromPause: boolean;
  setSettingsFromPause: (v: boolean) => void;
  showTutorial: boolean;
  setShowTutorial: (v: boolean) => void;
  showWhatsNew: boolean;
  setShowWhatsNew: (v: boolean) => void;
  showPrivacy: boolean;
  setShowPrivacy: (v: boolean) => void;
  showLoginStreak: boolean;
  setShowLoginStreak: (v: boolean) => void;
  showDailyChallenges: boolean;
  setShowDailyChallenges: (v: boolean) => void;
  showRewardsHub: boolean;
  setShowRewardsHub: (v: boolean) => void;
  showDevPanel: boolean;
  setShowDevPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  showBuildDeploy: boolean;
  setShowBuildDeploy: (v: boolean) => void;
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  showEnergyPopup: boolean;
  setShowEnergyPopup: (v: boolean) => void;
  showShare: boolean;
  setShowShare: (v: boolean) => void;
  showNameEntry: boolean;
  setShowNameEntry: (v: boolean) => void;
  showInstallBanner: boolean;
  setShowInstallBanner: (v: boolean) => void;
  showDevUnlock: boolean;
  setShowDevUnlock: (v: boolean) => void;
  showRotatePrompt: boolean;
  setShowRotatePrompt: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  shareToast: boolean;
  setShareToast: (v: boolean) => void;
  showLangMenu: boolean;
  setShowLangMenu: (v: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings]           = useState(false);
  const [settingsFromPause, setSettingsFromPause] = useState(false);
  const [showTutorial, setShowTutorial]           = useState(false);
  const [showWhatsNew, setShowWhatsNew]           = useState(false);
  // Use LS_KEYS.PRIVACY_OK — the exact same key App.tsx uses
  const [showPrivacy, setShowPrivacy]             = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [showLoginStreak, setShowLoginStreak]     = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showRewardsHub, setShowRewardsHub]       = useState(false);
  // import.meta.env.DEV is valid — this file is processed by Vite
  const [showDevPanel, setShowDevPanel]           = useState<boolean>(() => import.meta.env.DEV && localStorage.getItem('dtp:dev') === 'true');
  const [showBuildDeploy, setShowBuildDeploy]     = useState(false);
  const [showExitConfirm, setShowExitConfirm]     = useState(false);
  const [showEnergyPopup, setShowEnergyPopup]     = useState(false);
  const [showShare, setShowShare]                 = useState(false);
  const [showNameEntry, setShowNameEntry]         = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showDevUnlock, setShowDevUnlock]         = useState(false);
  const [showRotatePrompt, setShowRotatePrompt]   = useState(false);
  const [settingsOpen, setSettingsOpen]           = useState(false);
  const [shareToast, setShareToast]               = useState(false);
  const [showLangMenu, setShowLangMenu]           = useState(false);

  return (
    <UIContext.Provider value={{
      showSettings, setShowSettings,
      settingsFromPause, setSettingsFromPause,
      showTutorial, setShowTutorial,
      showWhatsNew, setShowWhatsNew,
      showPrivacy, setShowPrivacy,
      showLoginStreak, setShowLoginStreak,
      showDailyChallenges, setShowDailyChallenges,
      showRewardsHub, setShowRewardsHub,
      showDevPanel, setShowDevPanel,
      showBuildDeploy, setShowBuildDeploy,
      showExitConfirm, setShowExitConfirm,
      showEnergyPopup, setShowEnergyPopup,
      showShare, setShowShare,
      showNameEntry, setShowNameEntry,
      showInstallBanner, setShowInstallBanner,
      showDevUnlock, setShowDevUnlock,
      showRotatePrompt, setShowRotatePrompt,
      settingsOpen, setSettingsOpen,
      shareToast, setShareToast,
      showLangMenu, setShowLangMenu,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIContext must be used within <UIProvider>");
  return ctx;
}
