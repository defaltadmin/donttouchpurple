import { useEffect, useRef } from "react";
import { BossShowcase } from "./BossShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { TechStats } from "./TechStats";
import { LandingCTA } from "./LandingCTA";

interface LearnMoreOverlayProps {
  onClose: () => void;
}

export function LearnMoreOverlay({ onClose }: LearnMoreOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus close button on mount
    closeRef.current?.focus();

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key handler
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="learn-more-overlay" data-testid="learn-more-overlay" role="dialog" aria-modal="true" aria-label="Game features and details">
      <div className="learn-more-header">
        <span className="learn-more-title">Don&apos;t Touch Purple</span>
        <button
          ref={closeRef}
          className="btn-ghost learn-more-close"
          onClick={onClose}
          aria-label="Close"
          data-testid="learn-more-close"
        >
          ✕
        </button>
      </div>
      <div className="learn-more-scroll">
        <BossShowcase />
        <FeatureGrid />
        <TechStats />
        <LandingCTA />
        <footer className="landing-footer">
          <span>&copy; {new Date().getFullYear()} Don&apos;t Touch Purple &middot; Open Source (MIT)</span>
        </footer>
      </div>
    </div>
  );
}
