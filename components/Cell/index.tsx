// components/Cell/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ActiveCell } from '../../engine/types';
import { getRareModeConfig } from '../../config/gridPatterns';
import { Icon } from '../UI/Icon';

const SPARK_DANGER_COLOR = '#ff2200';
const SPARK_DEFAULT_COLOR = '#c026d3';

interface CellProps {
  cell: ActiveCell;
  onTap: (idx: number) => void;
  onHoldStart?: (idx: number) => void;
  onHoldEnd?: (idx: number) => void;
  colorblindMode?: string;
  showKeyLabel?: boolean;
  keyLabel?: string;
  isPressing?: boolean;
  botPulse?: boolean;
  botDustCost?: number;
  holdProgress?: number;
  bombFuse?: number;
}

function BombTimer({ expiresAt }: { expiresAt: number }) {
  const TOTAL_MS = 2000;
  const [ms, setMs] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      if (document.hidden) { rafId = requestAnimationFrame(tick); return; }
      const remaining = Math.max(0, expiresAt - Date.now());
      setMs(remaining);
      if (remaining > 0) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [expiresAt]);

  const pct = Math.max(0, Math.min(1, ms / TOTAL_MS));
  const R = 20;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - pct);
  const isUrgent = pct < 0.35;

  return (
    <svg className="bomb-ring" viewBox="0 0 52 52" width="100%" height="100%">
      <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={R}
        fill="none"
        stroke={isUrgent ? "#ff2200" : "#ff6600"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.06s linear, stroke 0.3s ease" }}
      />
      <text
        x="26" y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#fff"
        fontFamily="monospace"
        style={{ filter: isUrgent ? "drop-shadow(0 0 4px #ff2200)" : "none" }}
      >
        {(ms / 1000).toFixed(1)}
      </text>
    </svg>
  );
}

const CellContent = ({
  cell,
  onTap,
  onHoldStart,
  onHoldEnd,
  colorblindMode = '',
  showKeyLabel = false,
  keyLabel = '',
  isPressing = false,
  botPulse = false,
  botDustCost,
  holdProgress,
  bombFuse,
}: CellProps) => {

  const isBomb = cell.type === 'bomb';
  const bombUrgent = isBomb && (bombFuse !== undefined ? bombFuse < 700 : false);
  const isClicked = cell.clicked;
  const shape = cell.shape || 'circle';
  const shapeClass = "cell-shape--" + shape;

  const rareConfig = cell.shape && colorblindMode !== '' 
    ? getRareModeConfig(cell.type) 
    : null;

  const isHold = cell.type === 'hold';
  const isIce = cell.type === 'ice';

  const [isTouched, setIsTouched] = useState(false);
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<{ x: number; y: number; angle: number; startTime: number }[]>([]);
  const sparkRafRef = useRef(0);

  useEffect(() => {
    return () => { if (sparkRafRef.current) cancelAnimationFrame(sparkRafRef.current); };
  }, []);

  const emitSparks = useCallback((e: React.PointerEvent) => {
    const canvas = sparkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const count = 8;
    sparksRef.current.push(...Array.from({ length: count }, (_, i) => ({
      x, y, angle: (2 * Math.PI * i) / count, startTime: now,
    })));
    if (!sparkRafRef.current && ctx) {
      const SPARK_DURATION = 350;
      const draw = (ts: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sparksRef.current = sparksRef.current.filter(s => {
          const elapsed = ts - s.startTime;
          if (elapsed >= SPARK_DURATION) return false;
          const p = elapsed / SPARK_DURATION;
          const eased = p * (2 - p);
          const dist = eased * 14;
          const len = 8 * (1 - eased);
          ctx.strokeStyle = cell.type === 'purple' ? SPARK_DANGER_COLOR : SPARK_DEFAULT_COLOR;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - eased;
          ctx.beginPath();
          ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
          ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
          ctx.stroke();
          ctx.globalAlpha = 1;
          return true;
        });
        if (sparksRef.current.length > 0) sparkRafRef.current = requestAnimationFrame(draw);
        else sparkRafRef.current = 0;
      };
      sparkRafRef.current = requestAnimationFrame(draw);
    }
  }, [cell.type]);

  const iceCount = cell.type === 'ice' ? (cell as any).iceCount : undefined;
  const prevIceCount = useRef(iceCount);
  const [iceFlash, setIceFlash] = useState(false);
  useEffect(() => {
    if (cell.type === 'ice' && prevIceCount.current !== undefined && iceCount < prevIceCount.current) {
      setIceFlash(true);
      const t = setTimeout(() => setIceFlash(false), 200);
      prevIceCount.current = iceCount;
      return () => clearTimeout(t);
    }
    if (cell.type === 'ice') prevIceCount.current = iceCount;
  }, [cell.type, iceCount]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isClicked) return;
    setIsTouched(true);
    emitSparks(e);
    if (isHold && onHoldStart) {
      onHoldStart(cell.idx);
    } else {
      onTap(cell.idx);
    }
  };

  const handlePointerUp = () => {
    setIsTouched(false);
    if (isHold && onHoldEnd) {
      onHoldEnd(cell.idx);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap(cell.idx);
    }
  };

  const cbClass = colorblindMode ? "cb-pattern cb-" + cell.type : '';
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div
      className={"cell " + (cell.type || '') + (isClicked ? ' clicked inactive' : '') + " " + shapeClass + (cell.shape ? ' rare-danger' : '') + (isPressing || isTouched ? ' pressing' : '') + (botPulse ? ' bot-assisted' : '') + (bombUrgent ? ' bomb--urgent' : '') + " " + cbClass}
      data-testid="grid-cell"
      role="gridcell"
      tabIndex={isClicked ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={() => { setIsTouched(false); if (isHold && onHoldEnd) onHoldEnd(cell.idx); }}
      onKeyDown={handleKeyDown}
      data-shape={shape}
      style={{ '--cb-type': cell.type } as React.CSSProperties}
    >
      {!isMobile && (
        <canvas
          ref={sparkCanvasRef}
          width={120}
          height={120}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
        />
      )}
      <div className={"cell-shape-overlay " + shapeClass} />
      {iceFlash && <div className="ice-hit-flash" />}
      <div className="cell-icon">
        {(cell.type === 'medpack' || cell.type === 'shield' || cell.type === 'freeze' || cell.type === 'multiplier') ? (
          <span className="cell-icon-spring">
            {cell.type === 'medpack' && <Icon name="medpack" size={26} />}
            {cell.type === 'shield' && <Icon name="shield" size={26} />}
            {cell.type === 'freeze' && <Icon name="freeze" size={26} />}
            {cell.type === 'multiplier' && <Icon name="multiplier" size={26} />}
          </span>
        ) : null}
        {isHold && <Icon name="clock" size={22} />}
        {isIce && (
          <div className="multi-tap-visual" aria-hidden="true">
            <div className="multi-tap-core"><Icon name="ice" size={20} /></div>
            <div className="multi-tap-count">{iceCount || 1}</div>
          </div>
        )}
        {cell.type === 'bomb' && (
          <BombTimer expiresAt={cell.expiresAt} />
        )}
      </div>

      {/* Ice pips (bottom) */}
      {isIce && iceCount !== undefined && (
        <div className="ice-pip-container" aria-label={"Ice: " + iceCount + " taps remaining"}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={"ice-pip " + (i < iceCount ? 'active' : 'spent')} />
          ))}
        </div>
      )}

      {isHold && holdProgress !== undefined && (
        <svg className="hold-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
          <path className="hold-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path
            className="hold-fill"
            strokeDasharray={(holdProgress * 100) + ", 100"}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      )}
      {isBomb && bombFuse !== undefined && (
        <div
          className="bomb-timer-ring"
          style={{ '--bomb-remaining': (Math.max(0, bombFuse / 3000)) } as React.CSSProperties}
        />
      )}
      {cell.shape && (
        <span className="rare-danger-symbol" aria-label="Rare danger">
          <Icon name="warning" size={20} />
        </span>
      )}
      {botPulse && (
        <div className="bot-tap-fx" aria-hidden="true">
          <span className="bot-tap-orbit" />
          <span className="bot-tap-label">BOT</span>
        </div>
      )}
      {botDustCost !== undefined && (
        <div className="bot-dust-marker">
          -{botDustCost}
        </div>
      )}
      {rareConfig && (
        <div className="cell-rare-emoji">
          {rareConfig.emoji}
        </div>
      )}
      {showKeyLabel && keyLabel && (
        <div className="cell-key-label">{keyLabel}</div>
      )}
    </div>
  );
};

export default React.memo(CellContent, (prev, next) => {
  return prev.cell.idx === next.cell.idx &&
         prev.cell.type === next.cell.type &&
         prev.cell.clicked === next.cell.clicked &&
         prev.isPressing === next.isPressing &&
         prev.botPulse === next.botPulse &&
         prev.colorblindMode === next.colorblindMode &&
         prev.showKeyLabel === next.showKeyLabel &&
         prev.keyLabel === next.keyLabel &&
         Math.abs((prev.bombFuse ?? 0) - (next.bombFuse ?? 0)) < 100;
});
