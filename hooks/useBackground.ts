// hooks/useBackground.ts
import { useEffect, useRef, useCallback } from 'react';

export type BackgroundController = {
  pause: () => void;
  resume: () => void;
};

export function useBackgroundController(shouldAnimate: boolean) {
  const controllers = useRef<Set<BackgroundController>>(new Set());

  const applyState = useCallback((animate: boolean) => {
    controllers.current.forEach((ctrl) => {
      if (animate) ctrl.resume(); else ctrl.pause();
    });
  }, []);

  const register = useCallback((controller: BackgroundController) => {
    controllers.current.add(controller);
    // Apply current state immediately, respecting document visibility
    const effective = shouldAnimate && !document.hidden;
    if (effective) controller.resume(); else controller.pause();
    return () => { controllers.current.delete(controller); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- applyState is stable (useCallback w/ [] deps)
  }, [shouldAnimate, applyState]);

  // React to shouldAnimate changes
  useEffect(() => {
    applyState(shouldAnimate && !document.hidden);
  }, [shouldAnimate, applyState]);

  // React to tab visibility changes — this replaces the empty handler in App.tsx
  // The App.tsx visibilitychange listener is safe to DELETE; this hook owns it.
  useEffect(() => {
    const handler = () => applyState(shouldAnimate && !document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [shouldAnimate, applyState]);

  return { register };
}
