import { useEffect, useRef, useState } from "react";

interface MouseFollowerProps {
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
  delay?: number;
}

export function MouseFollower({
  color = "rgba(138, 43, 226, 0.4)",
  size = 300,
  blur = 80,
  opacity = 0.6,
  delay = 0.15,
}: MouseFollowerProps) {
  const posRef = useRef({ x: -size, y: -size });
  const targetRef = useRef({ x: -size, y: -size });
  const rafRef = useRef<number | null>(null);
  const [style, setStyle] = useState({ left: -size, top: -size, opacity: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;

      // Ease toward target (lower = more lag/inertia)
      posRef.current.x += dx * delay;
      posRef.current.y += dy * delay;

      // Fade in when moving, fade out when stopped
      const isMoving = Math.abs(dx) > 1 || Math.abs(dy) > 1;
      const targetOpacity = isMoving ? opacity : 0;

      setStyle({
        left: posRef.current.x - size / 2,
        top: posRef.current.y - size / 2,
        opacity: targetOpacity,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [delay, opacity, size]);

  return (
    <div
      className="mouse-follower-blob"
      style={{
        position: "fixed",
        left: style.left,
        top: style.top,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: style.opacity,
        pointerEvents: "none",
        zIndex: 1,
        transition: "opacity 0.3s ease",
      }}
      aria-hidden="true"
    />
  );
}