import React, { useState, useEffect } from "react";

interface EnergyDropProps {
  active: boolean;
  onComplete?: () => void;
}

export function EnergyDrop({ active, onComplete: _onComplete }: EnergyDropProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="shield-drop-anchor">
      <span className="energy-drop">⚡</span>
    </div>
  );
}
