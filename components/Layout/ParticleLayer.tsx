import React, { useEffect, useRef } from "react";

interface ParticleLayerProps {
  count?: number;
  variant?: "stream";
  className?: string;
}

export function ParticleLayer({
  count = 45,
  variant = "stream",
  className = "",
}: ParticleLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "stream") return;
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced motion
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("root--reduced-motion");
    if (prefersReduced) return;

    // Clear existing
    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = "dtp-particle";
      const left = Math.random() * 100;
      const duration = 10 + Math.random() * 15;
      const delay = Math.random() * 15;
      const size = 2 + Math.random() * 2;
      particle.style.setProperty("--left", `${left}vw`);
      particle.style.setProperty("--duration", `${duration}s`);
      particle.style.setProperty("--delay", `${delay}s`);
      particle.style.setProperty("--size", `${size}px`);
      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = "";
    };
  }, [count, variant]);

  return (
    <div ref={containerRef} className={`dtp-particles ${className}`.trim()} />
  );
}
