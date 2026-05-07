// components/Cell/index.tsx
import React, { useState, useEffect } from 'react';
import type { ActiveCell } from '../../engine/types';
import { getRareModeConfig } from '../../config/gridPatterns';

interface CellProps {
  cell: ActiveCell;
  onTap: (idx: number) => void;
  onHoldStart?: (idx: number) => void;
  onHoldEnd?: (idx: number) => void;
  colorblindMode?: string;
  showKeyLabel?: boolean;
  keyLabel?: string;
  isPressing?: boolean;
}

function BombTimer({ expiresAt }: { expiresAt: number }) {
  const [ms, setMs] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setMs(remaining);
      if (remaining === 0) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span className="bomb-timer">{(ms / 1000).toFixed(1)}s</span>;
}

export default function Cell({ 
  cell, 
  onTap, 
  onHoldStart, 
  onHoldEnd, 
  colorblindMode = '',
  showKeyLabel = false,
  keyLabel = '',
  isPressing = false 
}: CellProps) {

  const isClicked = cell.clicked;
  const shape = cell.shape || 'circle';
  const shapeClass = `cell-shape--${shape}`;

  const rareConfig = cell.shape && colorblindMode !== '' 
    ? getRareModeConfig(cell.type) 
    : null;

  const isHold = cell.type === 'hold';
  const isIce = cell.type === 'ice';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isClicked) return;
    
    if (isHold && onHoldStart) {
      onHoldStart(cell.idx);
    } else {
      onTap(cell.idx);
    }
  };

  const handlePointerUp = () => {
    if (isHold && onHoldEnd) {
      onHoldEnd(cell.idx);
    }
  };

  return (
    <div
      className={`
        cell 
        ${cell.type || ''} 
        ${isClicked ? 'clicked inactive' : ''} 
        ${shapeClass}
        ${cell.shape ? 'rare-danger' : ''}
        ${isPressing ? 'pressing' : ''}
      `.trim()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      data-shape={shape}
    >
      {/* Shape background layer */}
      <div className={`cell-shape-overlay ${shapeClass}`} />

      {/* Powerup / Special icons */}
      <div className="cell-icon">
        {cell.type === 'medpack' && '❤️'}
        {cell.type === 'shield' && '🛡️'}
        {cell.type === 'freeze' && '❄️'}
        {cell.type === 'multiplier' && '×2'}
        {isHold && '⏳'}
        {isIce && `🧊 ${cell.iceCount || ''}`}
        {cell.type === 'bomb' && (
          <span className="bomb-icon">
            💣 <BombTimer expiresAt={(cell as any).expiresAt} />
          </span>
        )}
      </div>

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
