import { useEffect, useRef } from 'react';

interface GridTapHandler { (x: number, y: number, cellId: string): void; }

export function useZeroLatencyInput(onGridTap: GridTapHandler) {
  const gridRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onGridTap);

  // ✅ FIX: Update ref when callback changes (safe, no render impact)
  useEffect(() => {
    handlerRef.current = onGridTap;
  }, [onGridTap]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const onPointer = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cols = 6;
      const rows = parseInt(el.dataset.rows || '8', 10);
      const col = Math.floor((x / rect.width) * cols);
      const row = Math.floor((y / rect.height) * rows);
      const cellId = `cell_${row}_${col}`;

      // ✅ FIX: Call via ref to avoid stale closure
      handlerRef.current(x, y, cellId);
    };

    el.addEventListener('pointerdown', onPointer, { passive: false });
    return () => el.removeEventListener('pointerdown', onPointer);
  }, []); // ✅ FIX: Empty deps — handlerRef always current

  return gridRef;
}
