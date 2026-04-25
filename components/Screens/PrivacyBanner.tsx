import React, { useEffect } from "react";

interface PrivacyBannerProps {
  onDismiss: () => void;
}

export function PrivacyBanner({ onDismiss }: PrivacyBannerProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div className="privacy-banner">
      <span className="privacy-txt">
        By playing you accept our terms.{" "}
        <a href="/privacy.html" className="privacy-link-inline">Learn more</a>.
      </span>
      <button className="privacy-dismiss-btn" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
