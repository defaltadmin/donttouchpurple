import { useState, useEffect, useRef } from 'react';

export interface CursorPos { x: number; y: number; visible: boolean; }

export function useOffsetCursor(enabled: boolean, rootRef: React.RefObject<HTMLDivElement | null>) {
  const [pos, setPos] = useState<CursorPos>({ x: 0, y: 0, visible: false });
  const activeRef = useRef(false);

  useEffect(() => {
    if (!enabled || !rootRef.current) return;
    const el = rootRef.current;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') {
        if (activeRef.current) {
          setPos({ x: 0, y: 0, visible: false });
          activeRef.current = false;
        }
        return;
      }
      activeRef.current = true;
      // ✅ FIX: Use functional update to avoid stale closure
      setPos(prev => ({ x: e.clientX, y: e.clientY - 40, visible: true }));
    };

    const leave = () => {
      if (activeRef.current) {
        setPos({ x: 0, y: 0, visible: false });
        activeRef.current = false;
      }
    };

    const cancel = () => {
      activeRef.current = false;
      setPos(prev => ({ ...prev, visible: false }));
    };

    // ✅ FIX: Use passive: true for pointer events
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave, { passive: true });
    el.addEventListener('pointercancel', cancel, { passive: true });

    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [enabled, rootRef]); // ✅ FIX: rootRef is stable, no .current in deps

  return pos;
}
