import { BossShowcase } from "./BossShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { TechStats } from "./TechStats";
import { LandingCTA } from "./LandingCTA";

export function LandingSections() {
  return (
    <div className="landing-sections" data-testid="landing-sections">
      <BossShowcase />
      <FeatureGrid />
      <TechStats />
      <LandingCTA />
      <footer className="landing-footer">
        <span>&copy; {new Date().getFullYear()} Don&apos;t Touch Purple &middot; Open Source (MIT)</span>
      </footer>
    </div>
  );
}
