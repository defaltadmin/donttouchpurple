import { useEffect, useRef, useCallback } from 'react';
import { logger } from './logger';

export function useSafeRaf(callback: (time: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);

  // ✅ FIX: Update callback ref safely
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loop = useCallback((time: number) => {
    callbackRef.current(time);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
      logger.debug('🎬 RAF started');
    }
  }, [loop]);

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
