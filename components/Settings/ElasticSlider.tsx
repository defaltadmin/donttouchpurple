// components/Settings/ElasticSlider.tsx — Springy slider (adapted from React Bits)
import { useCallback, useRef, useState, useEffect } from 'react';

const MAX_OVERFLOW = 50;

function decay(value: number, max: number): number {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

interface ElasticSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

export function ElasticSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  leftLabel = '🔈',
  rightLabel = '🔊',
}: ElasticSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getPercentage = () => ((value - min) / (max - min)) * 100;

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !sliderRef.current || disabled) return;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    let newValue = min + ((e.clientX - left) / width) * (max - min);
    newValue = Math.round(newValue / step) * step;
    newValue = Math.min(Math.max(newValue, min), max);
    onChange(newValue);

    // Calculate overflow for elastic effect
    if (e.clientX < left) {
      setOverflow(decay(left - e.clientX, MAX_OVERFLOW));
    } else if (e.clientX > left + width) {
      setOverflow(decay(e.clientX - (left + width), MAX_OVERFLOW));
    } else {
      setOverflow(0);
    }
  }, [isDragging, min, max, step, disabled, onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setOverflow(0);
  };

  // Animate overflow back to 0
  useEffect(() => {
    if (!isDragging && overflow !== 0) {
      const id = requestAnimationFrame(() => {
        setOverflow(prev => prev * 0.85);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isDragging, overflow]);

  const scale = isHovered || isDragging ? 1.2 : 1;
  const trackHeight = isHovered || isDragging ? 12 : 6;

  return (
    <div
      className="elastic-slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (!isDragging) setOverflow(0); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: `scale(${scale})` }}>{leftLabel}</span>
      <div
        ref={sliderRef}
        style={{
          flex: 1, position: 'relative', height: 24,
          display: 'flex', alignItems: 'center', cursor: 'pointer',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div style={{
          width: '100%', height: trackHeight, borderRadius: 6,
          background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
          transition: 'height 0.2s, transform 0.2s',
          transform: `scaleX(${1 + overflow / 200})`,
        }}>
          <div style={{
            width: `${getPercentage()}%`, height: '100%', borderRadius: 6,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-bright, #c026d3))',
            transition: isDragging ? 'none' : 'width 0.15s ease-out',
          }} />
        </div>
      </div>
      <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: `scale(${scale})` }}>{rightLabel}</span>
    </div>
  );
}
