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
        if (activeRef.current) { setPos({ x: 0, y: 0, visible: false }); activeRef.current = false; }
        return;
      }
      activeRef.current = true;
      setPos({ x: e.clientX, y: e.clientY - 40, visible: true });
    };

    const leave = () => { if (activeRef.current) setPos({ x: 0, y: 0, visible: false }); };
    const cancel = () => { activeRef.current = false; setPos(p => ({ ...p, visible: false })); };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', cancel);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [enabled, rootRef.current]);

  return pos;
}
