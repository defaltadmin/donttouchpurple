import { lazy, Suspense, ComponentType, useMemo } from 'react';

const VoidTunnel = lazy(() => import("../Backgrounds/VoidTunnel"));
const StarWarp   = lazy(() => import("../Backgrounds/StarWarp"));
const GridPulse  = lazy(() => import("../Backgrounds/GridPulse"));
const PurpleRain = lazy(() => import("../Backgrounds/PurpleRain"));
const PurpleCascade = lazy(() => import("../Backgrounds/PurpleCascade"));
const BlockOrbit    = lazy(() => import("../Backgrounds/BlockOrbit"));
const DataStream    = lazy(() => import("../Backgrounds/DataStream"));
const CellBreath    = lazy(() => import("../Backgrounds/CellBreath"));
const WarpGate      = lazy(() => import("../Backgrounds/WarpGate"));
const PulseField    = lazy(() => import("../Backgrounds/PulseField"));
const GlitchGrid    = lazy(() => import("../Backgrounds/GlitchGrid"));
const AmbientFlow   = lazy(() => import("../Backgrounds/AmbientFlow"));
const Nebula        = lazy(() => import("../Backgrounds/Nebula"));
const DigitalRain   = lazy(() => import("../Backgrounds/DigitalRain"));
const AuroraBorealis = lazy(() => import("../Backgrounds/AuroraBorealis"));

const BG_MAP: Record<string, ComponentType<{ reducedMotion?: boolean }>> = {
  'default': PurpleRain,
  'void-tunnel': VoidTunnel,
  'star-warp': StarWarp,
  'grid-pulse': GridPulse,
  'purple-cascade': PurpleCascade,
  'block-orbit': BlockOrbit,
  'data-stream': DataStream,
  'cell-breath': CellBreath,
  'warp-gate': WarpGate,
  'pulse-field': PulseField,
  'glitch-grid': GlitchGrid,
  'ambient-flow': AmbientFlow,
  'nebula': Nebula,
  'digital-rain': DigitalRain,
  'aurora-borealis': AuroraBorealis,
};

interface BackgroundControllerProps {
  equippedBackground: string;
  reducedMotion: boolean;
  screen: string;
}

export function BackgroundController({ equippedBackground, reducedMotion, screen }: BackgroundControllerProps) {
  // Backgrounds active on all screens except loading/onboarding
  const shouldAnimate = !reducedMotion && screen !== "loading" && screen !== "onboarding";
  const BgComponent = useMemo(() => BG_MAP[equippedBackground] || PurpleRain, [equippedBackground]);

  if (!shouldAnimate) return null;

  return (
    <Suspense fallback={null}>
      <BgComponent key={`bg-${equippedBackground || 'default'}`} reducedMotion={reducedMotion} />
    </Suspense>
  );
}
