import { useEffect, useRef, useCallback } from 'react';
import { logger } from './logger';

export function useSafeRaf(callback: (time: number) => void) {
  const rafRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

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

  useEffect(() => stop, [stop]);

  return { start, stop };
}
