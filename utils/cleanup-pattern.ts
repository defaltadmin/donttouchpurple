import { useEffect, useRef, useCallback } from 'react';
import { logger } from './logger';

export function useSafeRaf(callback: (time: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);

  // ✅ FIX: Update callback ref safely
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loopRef = useRef<((time: number) => void) | null>(null);

  const start = useCallback(() => {
    if (!rafRef.current) {
      // Define the loop function once, using callbackRef for the callback
      const loop = (time: number) => {
        callbackRef.current(time);
        rafRef.current = requestAnimationFrame(loopRef.current!);
      };
      loopRef.current = loop;
      rafRef.current = requestAnimationFrame(loop);
      logger.debug('🎬 RAF started');
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
      logger.debug('⏹️ RAF stopped');
    }
  }, []);

  // ✅ FIX: Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop };
}
