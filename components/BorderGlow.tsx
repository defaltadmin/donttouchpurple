import { useEffect, useRef, memo } from "react";
import gsap from "gsap";

interface BorderGlowProps {
  active: boolean;
  color: string;
  onReady?: () => void;
}

export const BorderGlow = memo(function BorderGlow({ active, color, onReady }: BorderGlowProps) {
  const ref = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>(".border-path"));
    if (paths.length === 0) return;

    // Calculate total path length once
    const totalLength = paths.reduce((acc, p) => acc + p.getTotalLength(), 0);

    // Set initial state — all paths hidden
    paths.forEach(p => {
      const len = p.getTotalLength();
      gsap.set(p, {
        strokeDasharray: `${len} ${totalLength}`,
        strokeDashoffset: len,
        stroke: color,
        opacity: 0,
      });
    });

    // Kill previous timeline
    if (tlRef.current) {
      tlRef.current.kill();
    }

    const tl = gsap.timeline({ paused: true, onComplete: onReady });

    // Animate each path segment sequentially
    let accumulatedDelay = 0;
    paths.forEach(p => {
      const len = p.getTotalLength();
      const duration = (len / totalLength) * 1.2; // Scale to total duration

      tl.to(p, {
        strokeDashoffset: 0,
        opacity: 1,
        duration,
        ease: "power2.inOut",
      }, accumulatedDelay);

      accumulatedDelay += duration;
    });

    tlRef.current = tl;

    if (active) {
      tl.restart();
    }

    return () => {
      tl.kill();
    };
  }, [active, color, onReady]);

  return (
    <svg
      ref={ref}
      className="border-glow-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* Top edge */}
      <path
        className="border-path"
        d="M 0,1 L 99,1"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Right edge */}
      <path
        className="border-path"
        d="M 99,1 L 99,99"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Bottom edge */}
      <path
        className="border-path"
        d="M 99,99 L 1,99"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left edge */}
      <path
        className="border-path"
        d="M 1,99 L 1,1"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
});
