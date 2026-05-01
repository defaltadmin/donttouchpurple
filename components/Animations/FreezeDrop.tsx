import React, { useState, useEffect } from "react";

interface FreezeDropProps {
  active: boolean;
  onComplete?: () => void;
}

export function FreezeDrop({ active, onComplete }: FreezeDropProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1100);
      return () => clearTimeout(timeout);
    }
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div className="shield-drop-anchor">
      <span className="freeze-drop">❄️</span>
    </div>
  );
}
