import React from "react";
import { Cell } from "../Cell";
import { Hearts } from "./Hearts";
import { PwrBadges } from "./PwrBadges";
import { useRef, useEffect, useState } from "react";
import type { PlayerState, CellShape, RareColorMode, GameMode } from "../../engine/types";


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
  shakeGrid:    boolean;
  cellShape:    CellShape;
  rareMode:     RareColorMode;
  onPause:      () => void;
  isFS:         boolean;
  equippedSkin?: string;
  levelUpBadge?: string | null;
  snapshot?:    any; 
  pwrToast?:    string | null;
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
}: PlayerPanelProps) {
  const now = Date.now();
  const { cols, rows, mask } = snapshot?.grid ?? { 
    cols: mode === "evolve" ? 0 : 3, 
    rows: mode === "evolve" ? 0 : 3, 
    mask: null 
  };
  const spinCfg = snapshot?.spinCfg;
  const spinLevel = snapshot?.spinLevel ?? 0;
  const gridTotal = cols * rows;
  const frozen    = ps.freezeEnd > now;
  const maskSet   = mask ? new Set(mask) : null;

  const prevDirectionRef = useRef<number | null>(null);
  const [elasticClass, setElasticClass] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [preservedAngle, setPreservedAngle] = useState<number>(0);

  useEffect(() => {
    if (!spinCfg) { prevDirectionRef.current = null; return; }
    const prev = prevDirectionRef.current;
    const cur = spinCfg.direction;
    if (prev !== null && prev !== cur) {
      // Snapshot current computed rotation angle
      let angle = 0;
      if (gridRef.current) {
        const matrix = getComputedStyle(gridRef.current).transform;
        if (matrix && matrix !== "none") {
          const vals = matrix.match(/matrix\(([^)]+)\)/);
          if (vals) {
            const [a, b] = vals[1].split(",").map(Number);
            angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
          }
        }
      }
      setPreservedAngle(angle);
      const cls = cur === -1 ? "gpanel--elastic-cw-to-ccw" : "gpanel--elastic-ccw-to-cw";
      setElasticClass(cls);
      const t = setTimeout(() => {
        setElasticClass(null);
        setPreservedAngle(0);
      }, 650);
      return () => clearTimeout(t);
    }
    prevDirectionRef.current = cur;
  }, [spinCfg?.direction]);

  const spinStyle: React.CSSProperties = spinCfg && !elasticClass ? {
    animation: `gpanelSpinContinuous${spinCfg.direction === 1 ? "CW" : "CCW"} ${spinCfg.duration.toFixed(2)}s linear infinite`,
  } : {};

  const elasticStyle: React.CSSProperties = elasticClass && spinCfg ? {
    transform: `rotate(${preservedAngle}deg)`,
    animation: `${elasticClass === "gpanel--elastic-cw-to-ccw" ? "elasticCWtoCCW" : "elasticCCWtoCW"} 0.65s cubic-bezier(0.22,1,0.36,1) forwards`,
  } : {};

  const skinClass = equippedSkin && equippedSkin !== "default" ? `grid-skin--${equippedSkin}` : "";

  const counterSpinDur: string | null =
    spinLevel >= 20 ? (spinCfg ? `${(spinCfg.duration * 1.4).toFixed(2)}s` : null) : null;

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
            <Hearts health={ps.health} anim={heartAnim} shieldCount={ps.shieldCount} />
          </div>
        </div>
      )}
      {is2P && (
        <div className="pwr-zone">
          <PwrBadges shield={ps.shield} freezeEnd={ps.freezeEnd} multiplierEnd={ps.multiplierEnd}
            freezeTotal={15000} multTotal={24000} />
          {pwrToast && <div className="pwr-toast">{pwrToast}</div>}
        </div>
      )}
      <div className="gpanel-wrap" style={{ "--cell": getDynamicCellVar(cols, rows, is2P, mode) } as any}>
        <div className={shakeGrid ? "gpanel-shake-wrap shake-grid" : "gpanel-shake-wrap"}>
          <div
            ref={gridRef}
            className={`gpanel${skinClass ? " " + skinClass : ""}`}
            style={{
              gridTemplateColumns: `repeat(${cols}, var(--cell))`,
              gridTemplateRows:    `repeat(${rows}, var(--cell))`,
              ...(frozen        ? { outline: "2px solid #60a5fa" } : {}),
              ...(cbFilter      ? { filter: cbFilter } : {}),
              ...(rareMode.active ? { outline: `2px solid ${rareMode.cssColor}` } : {}),
              ...spinStyle,
              ...elasticStyle,
            }}>
            {Array.from({ length: gridTotal }, (_, i) => {
            const isVoid = maskSet && !maskSet.has(i);
            if (isVoid) return <div key={i} className="cell-void" />;
            const type       = ps.cells[i] ?? "inactive";
            const activeCell = ps.active.find(c => c.idx === i);
            const shape: CellShape = cellShape === "mixed"
              ? (["square", "circle", "triangle"] as CellShape[])[i % 3]
              : cellShape;
            const row2   = Math.floor(i / cols);
            const col2   = i % cols;
            const keyIdx = row2 * 4 + col2;
            return (
              <Cell key={i}
                type={type}
                animState={anim[i] || null}
                keyLabel={keyLabels[keyIdx] || ""}
                showKey={showKeys}
                pressing={pressing.has(i)}
                onTap={() => onTap(i)}
                onHoldStart={() => onHoldStart(i)}
                onHoldEnd={() => onHoldEnd(i)}
                colorblind={colorblind}
                cellShape={mode === "evolve" ? shape : "square"}
                counterSpinDur={counterSpinDur}
                iceCount={activeCell?.iceCount}
                holdRequired={activeCell?.holdRequired}
                holdStart={activeCell?.holdStart}
                cellIdx={i}
                skin={equippedSkin}
              />
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
