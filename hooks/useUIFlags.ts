import { useState } from "react";
import { LS_KEYS } from "../config/difficulty";

export function useUIFlags() {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsFromPause, setSettingsFromPause] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(() => !localStorage.getItem(LS_KEYS.PRIVACY_OK));
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEnergyPopup, setShowEnergyPopup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginStreak, setShowLoginStreak] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showRewardsHub, setShowRewardsHub] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(() => import.meta.env.DEV && localStorage.getItem('dtp:dev') === 'true');
  const [showDevUnlock, setShowDevUnlock] = useState(false);
  const [showBuildDeploy, setShowBuildDeploy] = useState(false);

  const EVOLVE_TUTORIAL_SEEN_KEY = 'dtp-evolve-tutorial-seen';
  const [evolveTutorialSeen, setEvolveTutorialSeen] = useState(() =>
    Boolean(localStorage.getItem(EVOLVE_TUTORIAL_SEEN_KEY))
  );

  return {
    showSettings, setShowSettings,
    settingsFromPause, setSettingsFromPause,
    showTutorial, setShowTutorial,
    showWhatsNew, setShowWhatsNew,
    showPrivacy, setShowPrivacy,
    showNameEntry, setShowNameEntry,
    showLangMenu, setShowLangMenu,
    showShare, setShowShare,
    shareUrl, setShareUrl,
    showRotatePrompt, setShowRotatePrompt,
    showExitConfirm, setShowExitConfirm,
    showEnergyPopup, setShowEnergyPopup,
    showOnboarding, setShowOnboarding,
    showLoginStreak, setShowLoginStreak,
    showDailyChallenges, setShowDailyChallenges,
    showRewardsHub, setShowRewardsHub,
    showDevPanel, setShowDevPanel,
    showDevUnlock, setShowDevUnlock,
    showBuildDeploy, setShowBuildDeploy,
    evolveTutorialSeen, setEvolveTutorialSeen,
    EVOLVE_TUTORIAL_SEEN_KEY,
  };
}
