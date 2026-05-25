import React, { useEffect, useRef, useState, useCallback } from "react";

// Lazy-load dotlottie-web only when LottiePlayer mounts
let DotLottieClass: typeof import("@lottiefiles/dotlottie-web").DotLottie | null = null;
let loadPromise: Promise<typeof import("@lottiefiles/dotlottie-web")> | null = null;

async function ensureLoaded() {
  if (DotLottieClass) return DotLottieClass;
  if (!loadPromise) {
    loadPromise = import("@lottiefiles/dotlottie-web").then((mod) => {
      DotLottieClass = mod.DotLottie;
      return mod;
    });
  }
  const mod = await loadPromise;
  return mod.DotLottie;
}

interface LottiePlayerProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
  onComplete?: () => void;
  reducedMotion?: boolean;
  style?: React.CSSProperties;
}

export const LottiePlayer = React.memo(function LottiePlayer({
  src,
  autoplay = true,
  loop = false,
  className = "",
  onComplete,
  reducedMotion = false,
  style,
}: LottiePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotLottieRef = useRef<InstanceType<typeof import("@lottiefiles/dotlottie-web").DotLottie> | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Respect reduced motion — show nothing
  const prefersReducedData =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-data: reduce)").matches;

  const initDotLottie = useCallback(async () => {
    if (!canvasRef.current || reducedMotion || prefersReducedData) return;

    const DotLottie = await ensureLoaded();
    if (!canvasRef.current) return; // unmounted during load

    try {
      const instance = new DotLottie({
        canvas: canvasRef.current,
        src,
        autoplay,
        loop,
      });

      instance.addEventListener("complete", () => {
        onComplete?.();
      });

      instance.addEventListener("load", () => {
        setLoaded(true);
      });

      instance.addEventListener("loadError", () => {
        // Lottie file invalid (e.g., S3 AccessDenied XML response) — fail silently
        setLoaded(false);
      });

      dotLottieRef.current = instance;
    } catch {
      // DotLottie constructor threw (invalid JSON) — fail silently
    }
  }, [src, autoplay, loop, onComplete, reducedMotion, prefersReducedData]);

  useEffect(() => {
    initDotLottie();
    return () => {
      dotLottieRef.current?.destroy();
      dotLottieRef.current = null;
    };
  }, [initDotLottie]);

  if (reducedMotion || prefersReducedData) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`dtp-lottie ${className}`}
      style={{
        opacity: loaded ? 1 : 0,
        transition: "opacity 200ms ease",
        ...style,
      }}
    />
  );
});
