import { useEffect, useRef } from "react";

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
  const elRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -size, y: -size });
  const targetRef = useRef({ x: -size, y: -size });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;

      posRef.current.x += dx * delay;
      posRef.current.y += dy * delay;

      const isMoving = Math.abs(dx) > 1 || Math.abs(dy) > 1;
      const targetOpacity = isMoving ? opacity : opacity * 0.3; // Subtle glow when stationary

      // Update DOM directly — no React re-render
      if (elRef.current) {
        elRef.current.style.left = `${posRef.current.x - size / 2}px`;
        elRef.current.style.top = `${posRef.current.y - size / 2}px`;
        elRef.current.style.opacity = String(targetOpacity);
      }

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
        transition: "opacity 0.3s ease",
      }}
      aria-hidden="true"
    />
  );
}
