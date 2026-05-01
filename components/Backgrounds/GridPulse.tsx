export function GridPulse() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none",
      overflow: "hidden", perspective: "400px",
    }}>
      <div style={{
        position: "absolute", width: "200%", height: "200%",
        left: "-50%", top: "30%",
        backgroundImage: "linear-gradient(rgba(192,38,211,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(192,38,211,0.15) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        transform: "rotateX(60deg)",
        animation: "gridScroll 3s linear infinite",
      }} />
      <style>{`@keyframes gridScroll { from { backgroundPositionY: 0 } to { backgroundPositionY: 60px } }`}</style>
    </div>
  );
}
