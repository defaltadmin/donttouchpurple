import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MouseFollowerProps {
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
  delay?: number;
}

export function MouseFollower({
  // Brand magenta #c026d3 @ 40% — matches DESIGN.md / background overhaul
  color = "rgba(192, 38, 211, 0.4)",
  size = 300,
  blur = 80,
  opacity = 0.6,
  delay = 0.15,
}: MouseFollowerProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (!elRef.current) return;

    const el = elRef.current;
    // quickTo for smooth pointer following — replaces manual RAF + lerp
    const xTo = gsap.quickTo(el, "left", { duration: delay, ease: "power3" });
    const yTo = gsap.quickTo(el, "top", { duration: delay, ease: "power3" });

    const handleMove = (e: PointerEvent) => {
      xTo(e.clientX - size / 2);
      yTo(e.clientY - size / 2);
      gsap.to(el, { opacity, duration: 0.3, overwrite: true });
    };

    const handleLeave = () => {
      gsap.to(el, { opacity: opacity * 0.3, duration: 0.3 });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerleave", handleLeave);
    // Start with subtle glow
    gsap.set(el, { opacity: opacity * 0.3 });

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      // Kill quickTo tweens to prevent lingering animations
      xTo.tween.kill();
      yTo.tween.kill();
    };
  }, [delay, opacity, size]);

  return (
    <div
      ref={elRef}
      className="mouse-follower-blob"
      style={{
        position: "fixed",
        left: -size,
        top: -size,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
}
