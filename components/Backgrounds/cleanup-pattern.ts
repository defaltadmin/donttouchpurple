import { useEffect, useRef, useCallback } from 'react';

const IS_COARSE = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)')?.matches ?? false);

export function useSafeRaf(callback: (time: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const lastFrameTimeRef = useRef(0);
  const TARGET_MS = IS_COARSE ? 33.3 : 0;

  const start = useCallback(() => {
    if (!rafRef.current) {
      const loop = (timestamp: number) => {
        rafRef.current = requestAnimationFrame(loop);
        if (document.hidden) return;
        if (IS_COARSE && timestamp - lastFrameTimeRef.current < TARGET_MS) return;
        lastFrameTimeRef.current = timestamp;
        callbackRef.current(timestamp);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [TARGET_MS]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop };
}
