import React, { useState, useEffect } from "react";
import { GAME } from "../../config/difficulty";

interface ShieldDropProps {
  active: boolean;
  onComplete?: () => void;
}

export function ShieldDrop({ active, onComplete }: ShieldDropProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, GAME.SHIELD_DROP_MS);
      return () => clearTimeout(timeout);
    }
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div className="shield-drop-anchor">
      <span className="shield-drop">🛡️</span>
    </div>
  );
}
