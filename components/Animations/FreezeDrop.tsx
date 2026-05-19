import React, { useState, useEffect } from "react";

interface FreezeDropProps {
  active: boolean;
  onComplete?: () => void;
}

export function FreezeDrop({ active, onComplete: _onComplete }: FreezeDropProps) {
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
      <span className="freeze-drop">❄️</span>
    </div>
  );
}
