import { useEffect, useRef, useCallback } from 'react';

interface GridTapHandler { (x: number, y: number, cellId: string): void; }

export function useZeroLatencyInput(onGridTap: GridTapHandler) {
  const gridRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef(onGridTap);
  handlerRef.current = onGridTap;

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

      const cols = parseInt(el.dataset.cols || '5', 10);
      const rows = parseInt(el.dataset.rows || '5', 10);
      const col = Math.floor((x / rect.width) * cols);
      const row = Math.floor((y / rect.height) * rows);
      const cellId = `cell_${row}_${col}`;

      handlerRef.current(x, y, cellId);
    };

    el.addEventListener('pointerdown', onPointer, { passive: false });

    return () => el.removeEventListener('pointerdown', onPointer);
  }, []);

  return gridRef;
}
