import React from "react";
import Cell from "../Cell";
import { Hearts } from "./Hearts";
import { useRef, useEffect, useState } from "react";
import type { PlayerState, CellShape, RareColorMode, GameMode, GameSnapshot } from "../../engine/types";


// ─── Dynamic cell size ────────────────────────────────────────────
function getDynamicCellVar(cols: number, rows: number, is2P: boolean, mode?: string): string {
  const maxDim = Math.max(cols, rows);
  if (is2P) {
    if (mode === "classic") return "clamp(62px, 18vw, 90px)";
    return "clamp(38px, 9vw, 56px)";
  }
  if (maxDim <= 2) return "clamp(100px, 28vw, 140px)";
  if (maxDim <= 3) return "clamp(80px, 22vw, 110px)";
  if (maxDim <= 4) return "clamp(60px, 16vw, 84px)";
  return "clamp(48px, 13vw, 66px)";
}

// ─── Props ────────────────────────────────────────────────────────
export interface PlayerPanelProps {
  ps:           PlayerState;
  anim:         Record<number, string>;
  onTap:        (i: number) => void;
  onHoldStart:  (i: number) => void;
  onHoldEnd:    (i: number) => void;
  keyLabels:    string[];
  showKeys:     boolean;
  pressing:     Set<number>;
  label:        string | null;
  heartAnim:    boolean;
  mode:         GameMode;
  colorblind:   boolean;
  cbFilter:     string;
  is2P:         boolean;
  practiceMode?: boolean;
  shakeGrid:    boolean;
  cellShape:    CellShape;
  rareMode:     RareColorMode;
  onPause:      () => void;
  isFS:         boolean;
  equippedSkin?: string;
  levelUpBadge?: string | null;
  snapshot?:    GameSnapshot;
  pwrToast?:    string | null;
  storedFreezeCharges?: number;
  storedShieldCharges?: number;
  onActivateFreeze?: () => void;
  onActivateShield?: () => void;
  showStoredPwr?: boolean;
  onStartBot?:   () => void;
  onStopBot?:    () => void;
  isBotActive?:  boolean;
  onToggleBotAssist?: () => void;
  showBotAssist?: boolean;
  dust?:         number;
}

// ─── PlayerPanel ──────────────────────────────────────────────────
export function PlayerPanel({
  ps, anim, onTap, onHoldStart, onHoldEnd,
  keyLabels, showKeys, pressing,
  label, heartAnim, mode,
  colorblind, cbFilter, is2P, shakeGrid,
  cellShape, rareMode, onPause, isFS,
  equippedSkin,
  levelUpBadge, snapshot,
  pwrToast,
  storedFreezeCharges = 0,
  storedShieldCharges = 0,
  onActivateFreeze,
  onActivateShield,
  showStoredPwr = false,
  practiceMode = false,
  onStartBot,
  onStopBot,
  isBotActive = false,
  onToggleBotAssist,
  showBotAssist = false,
  dust = 0,
}: PlayerPanelProps) {
  const now = Date.now();
  const { cols, rows, mask } = snapshot?.grid ?? { 
    cols: 3, 
    rows: 3, 
    mask: null 
  };
  const spinCfg = snapshot?.spinCfg;
  const spinLevel = snapshot?.spinLevel ?? 0;
  const gridTotal = cols * rows;
  const frozen    = ps.freezeEnd > now;
  const maskSet   = mask ? new Set(mask) : null;

  const gridRef = useRef<HTMLDivElement>(null);

  const spinClass = snapshot?.spinCfg
    ? (snapshot.spinCfg.direction === 1 ? "gpanel--cw" : "gpanel--ccw")
    : "";

  const skinClass = equippedSkin && equippedSkin !== "default" ? `grid-skin--${equippedSkin}` : "";

  const counterSpinDur: string | null =
    spinLevel >= 20 ? (spinCfg ? `${(spinCfg.duration * 1.4).toFixed(2)}s` : null) : null;

  const cellVar = getDynamicCellVar(cols, rows, is2P, mode);

  // K5: Slide animation helper
  function getSlideStyle(
    idx: number,
    fromIdx: number,
    cols: number,
    startMs: number,
    durationMs: number,
  ): React.CSSProperties {
    const elapsed = Date.now() - startMs;
    const progress = Math.min(1, elapsed / durationMs);
    // Eased progress (ease-out quad)
    const eased = 1 - Math.pow(1 - progress, 2);

    const fromRow = Math.floor(fromIdx / cols);
    const fromCol = fromIdx % cols;
    const toRow   = Math.floor(idx / cols);
    const toCol   = idx % cols;
    const dRow    = fromRow - toRow;
    const dCol    = fromCol - toCol;

    // Offset in cell units — CSS will interpret via percentage
    const tx = dCol * (1 - eased) * 100;
    const ty = dRow * (1 - eased) * 100;

    return {
      transform: `translate(${tx}%, ${ty}%)`,
      transition: `transform ${durationMs}ms ease-out`,
      zIndex: 5,
    };
  }

  return (
    <div className={`ppanel${!ps.alive ? " ppanel--dead" : ""}`}>
      {label && (
        <div className="plabel-row">
          <div className="plabel">{label}</div>
        </div>
      )}
      {is2P && (
        <div className={`phud${mode === "classic" ? " phud--classic" : ""}`}>
          <div className="phud-pill phud-pill--score">
            <div className="phud-score-row">
              <div className="phud-score">{ps.score}</div>
              {ps.streak >= 3 && <div className="combo-wrap combo-wrap--sm">×{ps.streak}</div>}
            </div>
          </div>
          <div className="phud-pill phud-pill--hearts">
            <Hearts health={ps.health} anim={heartAnim} shieldCount={ps.shieldCount} practiceMode={practiceMode} />
          </div>
        </div>
      )}
      <div className="gpanel-wrap" style={{ "--cell": cellVar } as any}>
        <div className={shakeGrid ? "gpanel-shake-wrap shake-grid" : "gpanel-shake-wrap"}>
          <div
            ref={gridRef}
            className={`gpanel${skinClass ? " " + skinClass : ""} ${spinClass}${showKeys ? " keyboard-mode" : ""}`}
            style={{
              "--cell": cellVar,
              gridTemplateColumns: `repeat(${cols}, var(--cell))`,
              gridTemplateRows:    `repeat(${rows}, var(--cell))`,
              animationDuration: snapshot?.spinCfg ? `${snapshot.spinCfg.duration}s` : undefined,
              ...(frozen        ? { outline: "2px solid #60a5fa" } : {}),
              ...(ps.health === 1 && !frozen ? { outline: "2px solid #ef4444", animation: "heartDanger 0.75s ease-in-out infinite" } : {}),
              ...(cbFilter      ? { filter: cbFilter } : {}),
              ...(rareMode.active ? { outline: `2px solid ${rareMode.cssColor}` } : {}),
            } as React.CSSProperties}>
            {Array.from({ length: gridTotal }, (_, i) => {
            const isVoid = maskSet && !maskSet.has(i);
            if (isVoid) return <div key={i} className="cell-void" />;

            const type = ps.cells[i] ?? "inactive";
            if (type === "inactive" || type === "void") return <div key={i} className="cell-void" />;

            const activeCell = ps.active.find(c => c.idx === i) || {
              idx: i,
              clicked: true,
              type: type as any,
              shape: undefined as any
            };

            const keyIdx = Math.floor(i / cols) * 4 + (i % cols);

            return (
              (() => {
                if (activeCell.type === "hold") {
                  return (
                    <HoldCellDisplay
                      key={i}
                      holdRequired={(activeCell as any).holdRequired ?? 800}
                      holdStart={(activeCell as any).holdStart}
                    />
                  );
                }
                // K5: Apply slide animation if cell was shuffled
                const slideInfo = ps.slideAnim?.[activeCell.idx];
                const slideStyle = slideInfo
                  ? getSlideStyle(activeCell.idx, slideInfo.fromIdx, cols, slideInfo.startMs, 200)
                  : {};
                const slideClass = slideInfo ? "cell--sliding" : "";

                return (
                  <div key={i} className={slideClass} style={slideStyle}>
                  <Cell 
                    cell={activeCell}
                    onTap={(idx: number) => onTap(idx)}
                    onHoldStart={onHoldStart ? (idx: number) => onHoldStart(idx) : undefined}
                    onHoldEnd={onHoldEnd ? (idx: number) => onHoldEnd(idx) : undefined}
                    colorblindMode={colorblind ? 'colorblind' : ''}
                    showKeyLabel={showKeys}
                    keyLabel={keyLabels[keyIdx] || ''}
                    isPressing={pressing.has(i)}
                  />
                  </div>
                );
              })()
            );
          })}
          </div>
        </div>
      </div>
      {showBotAssist && !practiceMode && onToggleBotAssist && (
        <div className="bot-assist-row">
          <button
            className={`bot-assist-btn${isBotActive ? " bot-assist-btn--active" : ""}${(dust ?? 0) < 30 ? " bot-assist-btn--disabled" : ""}`}
            onClick={() => { if ((dust ?? 0) >= 30) onToggleBotAssist(); }}
            title={(dust ?? 0) < 30 ? "Need 30+ dust to activate" : isBotActive ? "Bot ON — click to deactivate" : "Activate bot assist"}
          >
            🤖 {isBotActive ? `ON · 3💜/tap` : `OFF`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Hold Cell Display (I2) ───────────────────────────────
function HoldCellDisplay({ holdRequired, holdStart }: { holdRequired: number; holdStart?: number }) {
  const [pct, setPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (holdStart === undefined) { setPct(0); return; }
    const animate = () => {
      const elapsed = Date.now() - holdStart;
      const p = Math.min(1, elapsed / holdRequired);
      setPct(p);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [holdStart, holdRequired]);

  // conic-gradient arc - fills clockwise from top
  const deg = Math.round(pct * 360);
  return (
    <div className="hold-cell">
      <div
        className="hold-arc"
        style={{
          background: `conic-gradient(var(--accent) ${deg}deg, rgba(255,255,255,0.12) ${deg}deg)`,
        }}
      />
      <div className="hold-icon">
         {holdStart !== undefined ? "??" : "??"}
      </div>
    </div>
  );
}
