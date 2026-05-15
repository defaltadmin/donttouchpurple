import { useState, useEffect, useRef } from 'react';

export interface CursorPos { x: number; y: number; visible: boolean; }

export function useOffsetCursor(enabled: boolean, rootRef: React.RefObject<HTMLDivElement | null>) {
  const [pos, setPos] = useState<CursorPos>({ x: 0, y: 0, visible: false });
  const targetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !rootRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const el = rootRef.current;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') {
        if (activeRef.current) {
          activeRef.current = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          setPos({ x: 0, y: 0, visible: false });
        }
        return;
      }
      activeRef.current = true;
      targetRef.current = { x: e.clientX, y: e.clientY - 40 };
    };

    const leave = () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPos({ x: 0, y: 0, visible: false });
    };

    const cancel = () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPos(prev => ({ ...prev, visible: false }));
    };

    const animate = () => {
      const ease = 0.18;
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        posRef.current.x += dx * ease;
        posRef.current.y += dy * ease;
        setPos({ x: posRef.current.x, y: posRef.current.y, visible: true });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave, { passive: true });
    el.addEventListener('pointercancel', cancel, { passive: true });

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', cancel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, rootRef]);

  return pos;
}