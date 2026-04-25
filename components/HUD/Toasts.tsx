import React from "react";
// ─── Toast ────────────────────────────────────────────────────────
interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

// ─── Rare color splash ────────────────────────────────────────────
interface RareSplashProps {
  splash: { color: string; cssColor: string } | null;
}

export function RareSplash({ splash }: RareSplashProps) {
  if (!splash) return null;
  return (
    <div className="rare-splash">
      <span
        className="rare-splash-text"
        style={{
          color:      splash.cssColor,
          textShadow: `0 0 60px ${splash.cssColor}, 0 0 120px ${splash.cssColor}66`,
        }}>
        DON'T<br />TOUCH<br />{splash.color.toUpperCase()}!
      </span>
    </div>
  );
}
