import { useState } from "react";

export function useDevToolsState() {
  const [devMode, setDevMode] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [devFreezeTime, setDevFreezeTime] = useState(false);
  const [devRotationSpeed, setDevRotationSpeed] = useState(1);
  const [devAutoPlay, setDevAutoPlay] = useState(false);
  const [devHeatmap, setDevHeatmap] = useState<Record<number, number>>({});

  return {
    devMode, setDevMode,
    godMode, setGodMode,
    devFreezeTime, setDevFreezeTime,
    devRotationSpeed, setDevRotationSpeed,
    devAutoPlay, setDevAutoPlay,
    devHeatmap, setDevHeatmap,
  };
}
