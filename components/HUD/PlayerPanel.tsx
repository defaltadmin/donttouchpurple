import React, { memo } from "react";
import Cell from "../Cell";
import { Hearts } from "./Hearts";
import { useRef, useEffect, useState } from "react";
import { animateDustClaim } from "../../utils/dustAnimation";
import type { PlayerState, CellShape, RareColorMode, GameMode, GameSnapshot, ActiveCell } from "../../engine/types";
import type { BotTapFx } from "../../hooks/useGameEngine";
import { useTranslation } from "../../hooks/useTranslation";


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
  botTapHighlights?: Record<number, number>;
  botTapFx?: BotTapFx[];
  onToggleBotAssist?: () => void;
  showBotAssist?: boolean;
  dust?:         number;
  scoreFloats?: { id: number; player: 1 | 2; idx: number; amount: number }[];
}

// ─── PlayerPanel ──────────────────────────────────────────────────
export const PlayerPanel = memo(function PlayerPanel({
  ps, anim: _anim, onTap, onHoldStart, onHoldEnd,
  keyLabels, showKeys, pressing,
  label, heartAnim, mode,
  colorblind, cbFilter, is2P, shakeGrid,
  cellShape: _cellShape, rareMode, onPause: _onPause, isFS: _isFS,
  equippedSkin,
  levelUpBadge: _levelUpBadge, snapshot,
  pwrToast: _pwrToast,
  storedFreezeCharges: _storedFreezeCharges = 0,
  storedShieldCharges: _storedShieldCharges = 0,
  onActivateFreeze: _onActivateFreeze,
  onActivateShield: _onActivateShield,
  showStoredPwr: _showStoredPwr = false,
  practiceMode = false,
  onStartBot: _onStartBot,
  onStopBot: _onStopBot,
  isBotActive = false,
  botTapHighlights = {},
  botTapFx,
  onToggleBotAssist,
  showBotAssist = false,
  dust = 0,
}: PlayerPanelProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const { cols, rows, mask } = snapshot?.grid ?? { 
    cols: 3, 
    rows: 3, 
    mask: null 
  };
  const gridTotal = cols * rows;
  const frozen    = ps.freezeEnd > now;
  const maskSet   = mask ? new Set(mask) : null;

  const gridRef = useRef<HTMLDivElement>(null);
  const botBtnRef = useRef<HTMLButtonElement>(null);

  const spinClass = snapshot?.spinCfg
    ? (snapshot.spinCfg.direction === 1 ? "gpanel--cw" : "gpanel--ccw")
    : "";

  const skinClass = equippedSkin && equippedSkin !== "default" ? `grid-skin--${equippedSkin}` : "";

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
      <div className="gpanel-wrap" style={{ "--cell": cellVar } as React.CSSProperties}>
        <div className={shakeGrid ? "gpanel-shake-wrap shake-grid" : "gpanel-shake-wrap"}>
          <div
            ref={gridRef}
            className={`gpanel${skinClass ? " " + skinClass : ""} ${spinClass}${showKeys ? " keyboard-mode" : ""}${isBotActive ? " gpanel--bot-active" : ""}`}
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
            {/* Pre-build active cell map for O(1) lookup instead of O(n) find per cell */}
            {(() => {
              const activeMap = new Map(ps.active.map(c => [c.idx, c]));
              return Array.from({ length: gridTotal }, (_, i) => {
              const isVoid = maskSet && !maskSet.has(i);
              if (isVoid) return <div key={i} className="cell-void" />;

              const type = ps.cells[i] ?? "inactive";
              if (type === "inactive" || type === "void") return <div key={i} className="cell-void" />;

              const activeCell = activeMap.get(i) || {
              idx: i,
              clicked: true,
              type,
              shape: undefined,
            } as unknown as ActiveCell;

            const keyIdx = Math.floor(i / cols) * 4 + (i % cols);

            const bombFuse = activeCell.type === 'bomb' && 'expiresAt' in activeCell
              ? Math.max(0, activeCell.expiresAt - now)
              : undefined;

            return (
              (() => {
                if (activeCell.type === "hold") {
                  return (
                    <HoldCellDisplay
                      key={i}
                      idx={activeCell.idx}
                      holdRequired={activeCell.holdRequired ?? 800}
                      holdStart={activeCell.holdStart}
                      onHoldStart={onHoldStart}
                      onHoldEnd={onHoldEnd}
                    />
                  );
                }
                // K5: Apply slide animation if cell was shuffled
                const slideInfo = ps.slideAnim?.[activeCell.idx];

                return slideInfo ? (
                  <SlidingCell
                    key={i}
                    idx={activeCell.idx}
                    fromIdx={slideInfo.fromIdx}
                    startMs={slideInfo.startMs}
                    cols={cols}
                    durationMs={200}
                  >
                    <Cell
                      cell={activeCell}
                      onTap={(idx: number) => onTap(idx)}
                      onHoldStart={onHoldStart ? (idx: number) => onHoldStart(idx) : undefined}
                      onHoldEnd={onHoldEnd ? (idx: number) => onHoldEnd(idx) : undefined}
                      colorblindMode={colorblind ? 'colorblind' : ''}
                      showKeyLabel={showKeys}
                      keyLabel={keyLabels[keyIdx] || ''}
                      isPressing={pressing.has(i)}
                      botPulse={Boolean(botTapHighlights[i])}
                      botDustCost={botTapFx?.findLast(fx => fx.idx === i)?.dustCost}
                      bombFuse={bombFuse}
                    />
                  </SlidingCell>
                ) : (
                  <div key={i}>
                  <Cell
                    cell={activeCell}
                    onTap={(idx: number) => onTap(idx)}
                    onHoldStart={onHoldStart ? (idx: number) => onHoldStart(idx) : undefined}
                    onHoldEnd={onHoldEnd ? (idx: number) => onHoldEnd(idx) : undefined}
                    colorblindMode={colorblind ? 'colorblind' : ''}
                    showKeyLabel={showKeys}
                    keyLabel={keyLabels[keyIdx] || ''}
                    isPressing={pressing.has(i)}
                    botPulse={Boolean(botTapHighlights[i])}
                    botDustCost={botTapFx?.findLast(fx => fx.idx === i)?.dustCost}
                    bombFuse={bombFuse}
                  />
                  </div>
                );
              })()
            );
          });
          })()}
          </div>
        </div>
      </div>
      {showBotAssist && !practiceMode && onToggleBotAssist && (
        <button
          ref={botBtnRef}
          className={`bot-icon-btn${isBotActive ? " bot-icon-btn--active" : ""}${(dust ?? 0) < 30 ? " bot-icon-btn--disabled" : ""}`}
          onClick={() => {
            if ((dust ?? 0) >= 30 && !isBotActive && botBtnRef.current) {
              animateDustClaim(botBtnRef.current, '.dust-counter', 30, true);
            }
            if ((dust ?? 0) >= 30) {
              onToggleBotAssist();
            }
          }}
          title={(dust ?? 0) < 30 ? t('player.need_dust') : isBotActive ? t('player.bot_on') : t('player.bot_off')}
          aria-label={isBotActive ? t('player.bot_active') : t('player.bot_inactive')}
        >
          🤖
        </button>
      )}
    </div>
  );
});

// ─── Sliding Cell (K5) — RAF-driven slide animation ─────────────
function SlidingCell({
  idx, fromIdx, startMs, cols, durationMs, children,
}: {
  idx: number; fromIdx: number; startMs: number; cols: number; durationMs: number;
  children: React.ReactNode;
}) {
  const [style, setStyle] = useState<React.CSSProperties>(() =>
    computeSlideStyle(idx, fromIdx, cols, startMs, durationMs)
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      const s = computeSlideStyle(idx, fromIdx, cols, startMs, durationMs);
      setStyle(s);
      if (Date.now() - startMs < durationMs) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [idx, fromIdx, cols, startMs, durationMs]);

  return <div className="cell--sliding" style={style}>{children}</div>;
}

function computeSlideStyle(
  idx: number, fromIdx: number, cols: number, startMs: number, durationMs: number
): React.CSSProperties {
  const elapsed = Date.now() - startMs;
  const progress = Math.min(1, elapsed / durationMs);
  const eased = 1 - Math.pow(1 - progress, 2);
  const dCol = (fromIdx % cols) - (idx % cols);
  const dRow = Math.floor(fromIdx / cols) - Math.floor(idx / cols);
  return {
    transform: `translate(${dCol * (1 - eased) * 100}%, ${dRow * (1 - eased) * 100}%)`,
    zIndex: 5,
  };
}

// ─── Hold Cell Display (I2) ───────────────────────────────
function HoldCellDisplay({
  holdRequired,
  holdStart,
  idx,
  onHoldStart,
  onHoldEnd,
}: {
  holdRequired: number;
  holdStart?: number;
  idx: number;
  onHoldStart: (idx: number) => void;
  onHoldEnd: (idx: number) => void;
}) {
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

  return (
    <div
      className={`hold-cell${pct > 0 ? ' is-holding' : ''}`}
      onPointerDown={(e) => { e.preventDefault(); onHoldStart(idx); }}
      onPointerUp={() => onHoldEnd(idx)}
      onPointerLeave={() => onHoldEnd(idx)}
    >
      <svg className="hold-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
        <path className="hold-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path
          className="hold-fill"
          strokeDasharray={`${pct * 100}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="hold-icon">⏳</div>
    </div>
  );
}
