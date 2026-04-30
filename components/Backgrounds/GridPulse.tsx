import { useEffect, useRef } from "react";

export function GridPulse({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current!;

    const handleAnimationEnd = () => {
      el.style.transform = `perspective(500px) rotateX(${40 + Math.random() * 10}deg) translateZ(${Math.random() * 50}px)`;
      el.style.opacity = (0.3 + Math.random() * 0.3).toString();
    };
    el.addEventListener("animationend", handleAnimationEnd);
    return () => el.removeEventListener("animationend", handleAnimationEnd);
  }, [active]);

  if (!active) return null;
  return (
    <div ref={ref} style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      zIndex: -1, pointerEvents: "none",
      background: "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(128,0,255,0.1) 50px, rgba(128,0,255,0.1) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(128,0,255,0.1) 50px, rgba(128,0,255,0.1) 51px)",
      animation: "gridPulse 2s ease-in-out infinite",
      transform: "perspective(500px) rotateX(45deg)",
    }} />
  );
}
