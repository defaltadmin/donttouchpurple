import React from "react";

interface InstallBannerProps {
  isIOS: boolean;
  hasDeferredPrompt: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallBanner = React.memo(function InstallBanner({
  isIOS, hasDeferredPrompt, onInstall, onDismiss,
}: InstallBannerProps) {
  return (
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

        {!isIOS && hasDeferredPrompt && (
          <button className="btn-primary" onClick={onInstall}>
            📲 Add to Home Screen
          </button>
        )}

        <button className="btn-ghost" onClick={onDismiss}>
          Not Now
        </button>
      </div>
    </div>
  );
});
