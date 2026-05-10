import React from "react";

interface GameHeaderProps {
  screen: string;
  paused: boolean;
  onSettingsClick: () => void;
  onPauseClick: () => void;
  onLogoClick: () => void;
  showDevPanel?: boolean;
}

export const GameHeader = React.memo(function GameHeader({
  screen,
  paused,
  onSettingsClick,
  onPauseClick,
  onLogoClick,
  showDevPanel = false,
}: GameHeaderProps) {
  return (
    <header className="hdr" role="banner">
      <button
        className="btn-icon dtp-logo-btn"
        onClick={onLogoClick}
        aria-label="Don't Touch Purple — go to menu"
        title="Menu"
      >
        <span className="dtp-logo-text">
          <span className="dtp-logo-dont">Don't</span>
          <span className="dtp-logo-touch"> Touch</span>
          <span className="dtp-logo-purple"> Purple</span>
        </span>
      </button>

      <div className="hdr-actions">
        {screen === "playing" && (
          <button
            className={`btn-icon${paused ? " btn-icon--active" : ""}`}
            onClick={onPauseClick}
            aria-label={paused ? "Resume game" : "Pause game"}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? "▶" : "⏸"}
          </button>
        )}
        <button
          className="btn-icon"
          onClick={onSettingsClick}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
        {showDevPanel && (
          <span className="dtp-dev-badge" title="Dev Mode">🔧</span>
        )}
      </div>
    </header>
  );
});
