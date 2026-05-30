import { TechStats } from "./TechStats";
import { LandingCTA } from "./LandingCTA";

export function RightPanel() {
  return (
    <div className="side-panel side-panel--right" data-testid="right-panel">
      <TechStats />
      <LandingCTA />
      <footer className="landing-footer">
        <span>&copy; {new Date().getFullYear()} Don&apos;t Touch Purple &middot; Open Source (MIT)</span>
      </footer>
    </div>
  );
}
