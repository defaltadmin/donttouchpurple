import { BossShowcase } from "./BossShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { TechStats } from "./TechStats";
import { LandingCTA } from "./LandingCTA";

interface LearnMoreOverlayProps {
  onClose: () => void;
}

export function LearnMoreOverlay({ onClose }: LearnMoreOverlayProps) {
  return (
    <div className="learn-more-overlay" data-testid="learn-more-overlay">
      <div className="learn-more-header">
        <span className="learn-more-title">Don&apos;t Touch Purple</span>
        <button className="btn-ghost learn-more-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="learn-more-scroll">
        <BossShowcase />
        <FeatureGrid />
        <TechStats />
        <LandingCTA />
      </div>
    </div>
  );
}
