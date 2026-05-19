import React from "react";
import type { GameSnapshot } from "../../engine/types";
import { DustWidget } from "./DustWidget";
import { useTranslation } from "../../hooks/useTranslation";

interface GameHeaderProps {
  screen: string;
  isFS: boolean;
  isPlaying: boolean;
  practiceMode: boolean;
  snapshot: GameSnapshot | null;
  dust: number;
  onPause: () => void;
  onToggleSettings: () => void;
  onLogoClick: () => void;
}

export const GameHeader = React.memo(function GameHeader({
  screen, isFS, isPlaying, practiceMode, snapshot, dust,
  onPause, onToggleSettings, onLogoClick,
}: GameHeaderProps) {
  const { t } = useTranslation();
  const rareActive = snapshot?.rareMode.active && screen !== "menu" && screen !== "leaderboard" && screen !== "shop";

  return (
    <header className={`hdr${isFS ? " hdr--hidden" : ""}`}>
      <span className="logo logo--shimmer"
        style={{cursor: screen !== "menu" && screen !== "playing" && screen !== "gameover" ? "pointer" : "default"}}
        onClick={onLogoClick}>
        {t('header.dont_touch')}{" "}
        <span className="txt-p" style={rareActive
          ? { color: snapshot!.rareMode.cssColor, textShadow: `0 0 20px ${snapshot!.rareMode.cssColor}99`, transition:"color 0.5s, text-shadow 0.5s" }
          : {}}>
          {rareActive ? snapshot!.rareMode.color.charAt(0).toUpperCase() + snapshot!.rareMode.color.slice(1) : t('header.purple')}
        </span>
      </span>
      {screen === "playing" && practiceMode && <span className="practice-badge">∞ {t('header.practice')}</span>}
      <div className="hdr-right" style={{display:"flex",alignItems:"center",gap:4}}>
        <div className="dust-counter"><DustWidget dust={dust} /></div>
        {isPlaying && screen === "playing"
          ? <button className="btn-icon btn-icon--pause" onClick={onPause} title={t('header.pause')}>⏸</button>
          : <button className="btn-icon" onClick={onToggleSettings} title={t('settings.title')}>⚙</button>
        }
      </div>
    </header>
  );
});
