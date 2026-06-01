'use client';

interface CrescentRingProps {
  className?: string;
}

export function CrescentRing({ className = '' }: CrescentRingProps) {
  return (
    <>
      {/* Ambient backlight behind the crescent */}
      <div className="crescent-backlight" />
      {/* The crescent ring */}
      <div className={`crescent-ring ${className}`} />
    </>
  );
}
