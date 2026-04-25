import React from "react";

interface DustWidgetProps {
  dust: number;
}

export function DustWidget({ dust }: DustWidgetProps) {
  return (
    <div className="dust-widget">
      <span className="dust-icon">💜</span>
      <span className="dust-val">{dust.toLocaleString()}</span>
    </div>
  );
}
