import React, { useState, useEffect } from "react";

interface EnergyDropProps {
  active: boolean;
  onComplete?: () => void;
}

export function EnergyDrop({ active, onComplete }: EnergyDropProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div className="shield-drop-anchor">
      <span className="energy-drop">⚡</span>
    </div>
  );
}
