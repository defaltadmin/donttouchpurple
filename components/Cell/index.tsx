// components/Cell/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ActiveCell } from '../../engine/types';
import { getRareModeConfig } from '../../config/gridPatterns';
import { settingsManager } from '../../utils/settings';

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
  const TOTAL_MS = 2000; // bomb fuse duration
  const [ms, setMs] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setMs(remaining);
      if (remaining === 0) clearInterval(id);
    }, 33); // ~30fps for smooth arc
    return () => clearInterval(id);
  }, [expiresAt]);

  const pct = Math.max(0, Math.min(1, ms / TOTAL_MS));
  const R = 20;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - pct); // drains clockwise
  const isUrgent = pct < 0.35;

  return (
    <svg className="bomb-ring" viewBox="0 0 52 52" width="100%" height="100%">
      {/* Track */}
      <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      {/* Draining arc */}
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
      {/* Center label */}
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

export default function Cell({ 
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
}: CellProps) {

  const isBomb = cell.type === 'bomb';
  const bombUrgent = isBomb && (bombFuse !== undefined ? bombFuse < 700 : Date.now() > (cell as import('../../engine/types').BombCell).expiresAt - 700); // last 700ms = urgent
  const isClicked = cell.clicked;
  const shape = cell.shape || 'circle';
  const shapeClass = `cell-shape--${shape}`;

  const rareConfig = cell.shape && colorblindMode !== '' 
    ? getRareModeConfig(cell.type) 
    : null;

  const isHold = cell.type === 'hold';
  const isIce = cell.type === 'ice';

  // ── Touch feedback: immediate visual response on pointer down ──
  const [isTouched, setIsTouched] = useState(false);

  // ── Ice hit flash tracking ──
  const prevIceCount = useRef(cell.type === 'ice' ? cell.iceCount : undefined);
  const [iceFlash, setIceFlash] = useState(false);
  useEffect(() => {
    if (cell.type === 'ice' && prevIceCount.current !== undefined && cell.iceCount < prevIceCount.current) {
      setIceFlash(true);
      const t = setTimeout(() => setIceFlash(false), 200);
      prevIceCount.current = cell.iceCount;
      return () => clearTimeout(t);
    }
    if (cell.type === 'ice') prevIceCount.current = cell.iceCount;
  }, [cell.type === 'ice' ? cell.iceCount : false]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isClicked) return;
    setIsTouched(true); // Instant visual feedback
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

  const cbClass = colorblindMode ? `cb-pattern cb-${cell.type}` : '';

  return (
    <div
      className={`
        cell
        ${cell.type || ''}
        ${isClicked ? 'clicked inactive' : ''}
        ${shapeClass}
        ${cell.shape ? 'rare-danger' : ''}
        ${isPressing || isTouched ? 'pressing' : ''}
        ${botPulse ? 'bot-assisted' : ''}
        ${bombUrgent ? 'bomb--urgent' : ''}
        ${cbClass}
      `.trim()}
      role="button"
      tabIndex={-1}
      aria-label={`${cell.type === 'purple' ? 'Danger: purple cell' : cell.type === 'bomb' ? 'Bomb cell' : `Tap ${cell.type} cell`}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={() => setIsTouched(false)}
      data-shape={shape}
      style={{ '--cb-type': cell.type } as any}
    >
      {/* Shape background layer */}
      <div className={`cell-shape-overlay ${shapeClass}`} />

      {/* Ice hit flash overlay */}
      {iceFlash && <div className="ice-hit-flash" />}

      {/* Powerup / Special icons */}
      <div className="cell-icon">
        {(cell.type === 'medpack' || cell.type === 'shield' || cell.type === 'freeze' || cell.type === 'multiplier') ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20, mass: 0.5 }}
          >
            {cell.type === 'medpack' && '❤️'}
            {cell.type === 'shield' && '🛡️'}
            {cell.type === 'freeze' && '❄️'}
            {cell.type === 'multiplier' && '×2'}
          </motion.span>
        ) : null}
        {isHold && '⏳'}
        {isIce && (
          <div className="multi-tap-visual" aria-hidden="true">
            <div className="multi-tap-core">✦</div>
            <div className="multi-tap-count">{cell.iceCount || 1}</div>
            <div className="multi-tap-pips">
              {Array.from({ length: Math.max(1, Math.min(4, cell.iceCount || 1)) }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
        )}
        {cell.type === 'bomb' && (
          <BombTimer expiresAt={(cell as any).expiresAt} />
        )}
      </div>

      {/* Ice pips (bottom) */}
      {isIce && cell.iceCount !== undefined && (
        <div className="ice-pip-container" aria-label={`Ice: ${cell.iceCount} taps remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`ice-pip ${i < cell.iceCount! ? 'active' : 'spent'}`} />
          ))}
        </div>
      )}

      {/* Hold cell SVG progress ring */}
      {isHold && holdProgress !== undefined && (
        <svg className="hold-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
          <path className="hold-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path
            className="hold-fill"
            strokeDasharray={`${holdProgress * 100}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      )}

      {/* Bomb escalation ring */}
      {isBomb && bombFuse !== undefined && (
        <div
          className="bomb-timer-ring"
          style={{ '--bomb-remaining': `${Math.max(0, bombFuse / 3000)}` } as React.CSSProperties}
        />
      )}

      {/* Rare danger symbol */}
      {cell.shape && (
        <span className="rare-danger-symbol" aria-label="Rare danger">⛔</span>
      )}

      {botPulse && (
        <div className="bot-tap-fx" aria-hidden="true">
          <span className="bot-tap-orbit" />
          <span className="bot-tap-label">BOT</span>
        </div>
      )}

      {botDustCost !== undefined && (
        <div className="bot-dust-marker" aria-label={`Bot spent ${botDustCost} dust`}>
          -{botDustCost}
        </div>
      )}

      {/* Rare mode emoji for colorblind players */}
      {rareConfig && (
        <div className="cell-rare-emoji">
          {rareConfig.emoji}
        </div>
      )}

      {/* Keyboard label */}
      {showKeyLabel && keyLabel && (
        <div className="cell-key-label">{keyLabel}</div>
      )}
    </div>
  );
}
