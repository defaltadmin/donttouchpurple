import { useEffect, useRef } from 'react';

export function useSafeRaf(loop: (time: number) => void) {
  const rafRef = useRef<number>();
  const loopRef = useRef(loop);
  loopRef.current = loop;

  useEffect(() => {
    const tick = (time: number) => {
      loopRef.current(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
