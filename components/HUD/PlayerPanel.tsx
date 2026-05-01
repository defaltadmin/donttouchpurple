import React from "react";
import { Cell } from "../Cell";
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
                iceCount={(activeCell as any)?.iceCount}
                holdRequired={(activeCell as any)?.holdRequired}
                holdStart={(activeCell as any)?.holdStart}
                cellIdx={i}
                skin={equippedSkin}
              />
            );
          })}
          </div>
        </div>
      </div>
      {mode === "evolve" && !practiceMode && onToggleBotAssist && (
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
