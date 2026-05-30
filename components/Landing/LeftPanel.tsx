import { BossShowcase } from "./BossShowcase";
import { FeatureGrid } from "./FeatureGrid";

export function LeftPanel() {
  return (
    <div className="side-panel side-panel--left" data-testid="left-panel">
      <BossShowcase />
      <FeatureGrid />
    </div>
  );
}
