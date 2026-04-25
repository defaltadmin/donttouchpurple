import React, { useCallback, useEffect, useRef } from "react";

interface PillOption<T extends string | number> {
  value: T;
  label: string;
}

interface PillRowProps<T extends string | number> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function PillRow<T extends string | number>({ options, value, onChange }: PillRowProps<T>) {
  const selIdx = options.findIndex((option) => option.value === value);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const row = rowRef.current;
    const thumb = thumbRef.current;
    if (!row || !thumb) return;

    const btns = row.querySelectorAll<HTMLButtonElement>(".pill-opt");
    const btn = btns[selIdx];
    if (!btn) return;

    thumb.style.left = `${btn.offsetLeft}px`;
    thumb.style.width = `${btn.offsetWidth}px`;
  }, [selIdx]);

  useEffect(() => {
    reposition();

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(reposition);
    });

    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") {
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    const ro = new ResizeObserver(() => {
      reposition();
      requestAnimationFrame(reposition);
    });
    ro.observe(row);
    if (row.parentElement) ro.observe(row.parentElement);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [reposition, selIdx]);

  return (
    <div className="pill-row" ref={rowRef}>
      <div className="pill-thumb" ref={thumbRef} />
      {options.map((option, i) => (
        <button
          key={option.value}
          className={`pill-opt${i === selIdx ? " pill-opt--on" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
