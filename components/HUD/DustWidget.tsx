import React, { useEffect, useRef, useState } from "react";

interface DustWidgetProps {
  dust: number;
}

export function DustWidget({ dust }: DustWidgetProps) {
  const prevDust = useRef(dust);
  const [gained, setGained] = useState(false);

  useEffect(() => {
    if (dust > prevDust.current) {
      setGained(true);
      const t = setTimeout(() => setGained(false), 600);
      prevDust.current = dust;
      return () => clearTimeout(t);
    }
    prevDust.current = dust;
  }, [dust]);

  return (
    <div className="dust-widget" role="status" aria-label={`Dust: ${dust}`}>
      <span className="dust-icon">💜</span>
      <span className={`dust-val${gained ? ' dust--gained' : ''}`}>{dust.toLocaleString()}</span>
    </div>
  );
}
