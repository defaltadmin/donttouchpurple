'use client';

interface CrescentRingProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CrescentRing({ width = 850, height = 400, className = '' }: CrescentRingProps) {
  return (
    <>
      {/* Ambient backlight behind the crescent */}
      <div
        className="crescent-backlight"
        style={{ width: width * 0.7, height: height * 0.6 }}
      />
      {/* The crescent ring */}
      <div
        className={`crescent-ring ${className}`}
        style={{ width, height }}
      />
    </>
  );
}
