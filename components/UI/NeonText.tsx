import React from "react";

interface NeonTextProps {
  variant?: "title" | "gold" | "danger";
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}

export function NeonText({
  variant = "title",
  as: Tag = "span",
  className = "",
  children,
}: NeonTextProps) {
  const cls = `dtp-neon-${variant} ${className}`.trim();
  return <Tag className={cls}>{children}</Tag>;
}
