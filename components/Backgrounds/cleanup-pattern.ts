import { useEffect, useRef, useCallback } from 'react';

export function useSafeRaf(callback: (time: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback(() => {
    if (!rafRef.current) {
      const loop = (time: number) => {
        callbackRef.current(time);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  }, []);

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
