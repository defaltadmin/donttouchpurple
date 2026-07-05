import React, { memo } from "react";
import gsap from "gsap";
import Cell from "../Cell";
import { Hearts } from "./Hearts";
import { ScoreFloat } from "./ScoreFloat";
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
    return "clamp(48px, 9vw, 56px)";
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
  scoreFloats = [],
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
  const maskSet   = React.useMemo(() => mask ? new Set(mask) : null, [mask]);

  // Pre-compute botTapFx map for O(1) per-cell lookup instead of O(n) findLast
  const botTapFxMap = React.useMemo(() => {
    if (!botTapFx?.length) return null;
    const m = new Map<number, number>();
    // Iterate forward so last value wins (findLast semantics)
    for (const fx of botTapFx) m.set(fx.idx, fx.dustCost);
    return m;
  }, [botTapFx]);

  // Stable callback refs to avoid re-renders breaking Cell memo
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onHoldStartRef = useRef(onHoldStart);
  onHoldStartRef.current = onHoldStart;
  const onHoldEndRef = useRef(onHoldEnd);
  onHoldEndRef.current = onHoldEnd;
  const stableOnTap = React.useCallback((idx: number) => onTapRef.current(idx), []);
  const stableOnHoldStart = React.useCallback((idx: number) => onHoldStartRef.current?.(idx), []);
  const stableOnHoldEnd = React.useCallback((idx: number) => onHoldEndRef.current?.(idx), []);

  const gridRef = useRef<HTMLDivElement>(null);
  const botBtnRef = useRef<HTMLButtonElement>(null);
  const dustCleanupRef = useRef<(() => void) | null>(null);
  const prevStageRef = useRef(ps.gridStage);
  useEffect(() => () => { dustCleanupRef.current?.(); }, []);

  // GSAP stagger on grid stage change — center-out entrance for all cells
  useEffect(() => {
    if (!gridRef.current || ps.gridStage === prevStageRef.current) return;
    prevStageRef.current = ps.gridStage;
    const cells = gridRef.current.querySelectorAll('.cell:not(.cell-void)');
    if (cells.length === 0) return;
    gsap.from(cells, {
      scale: 0,
      opacity: 0,
      duration: 0.35,
      stagger: { amount: 0.25, from: "center" },
      ease: "back.out(1.7)",
      clearProps: "scale,opacity",
    });
  }, [ps.gridStage]);

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
            role="grid"
            aria-label={`Game grid ${cols} by ${rows}`}
            data-testid="game-grid"
            className={`gpanel${skinClass ? " " + skinClass : ""} ${spinClass}${showKeys ? " keyboard-mode" : ""}${isBotActive ? " gpanel--bot-active" : ""}`}
            style={{
              "--cell": cellVar,
              gridTemplateColumns: `repeat(${cols}, var(--cell))`,
              gridTemplateRows:    `repeat(${rows}, var(--cell))`,
              animationDuration: snapshot?.spinCfg ? `${snapshot.spinCfg.duration}s` : undefined,
              ...(frozen        ? { outline: "2px solid var(--color-freeze, #60a5fa)" } : {}),
              ...(ps.health === 1 && !frozen ? { outline: "2px solid var(--color-danger, #ef4444)", animation: "heartDanger 0.75s ease-in-out infinite" } : {}),
              ...(cbFilter      ? { filter: cbFilter } : {}),
              ...(rareMode.active ? { outline: `2px solid ${rareMode.cssColor}` } : {}),
            } as React.CSSProperties}>
            {/* Pre-build active cell map for O1 lookup instead of On find per cell */}
            {React.useMemo(() => {
              const nowInner = Date.now();
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
                  ? Math.max(0, activeCell.expiresAt - nowInner)
                  : undefined;

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

                const slideInfo = ps.slideAnim?.[activeCell.idx];

                const cellComp = (
                  <Cell
                    cell={activeCell}
                    onTap={stableOnTap}
                    onHoldStart={stableOnHoldStart}
                    onHoldEnd={stableOnHoldEnd}
                    colorblindMode={colorblind ? 'colorblind' : ''}
                    showKeyLabel={showKeys}
                    keyLabel={keyLabels[keyIdx] || ''}
                    isPressing={pressing.has(i)}
                    botPulse={Boolean(botTapHighlights[i])}
                    botDustCost={botTapFxMap?.get(i)}
                    bombFuse={bombFuse}
                  />
                );

                return slideInfo ? (
                  <SlidingCell
                    key={i}
                    idx={activeCell.idx}
                    fromIdx={slideInfo.fromIdx}
                    startMs={slideInfo.startMs}
                    cols={cols}
                    durationMs={200}
                  >
                    {cellComp}
                  </SlidingCell>
                ) : (
                  <div key={i}>
                    {cellComp}
                  </div>
                );
              });
            }, [gridTotal, maskSet, ps.cells, ps.active, ps.slideAnim, cols, keyLabels, showKeys, pressing, botTapHighlights, botTapFxMap, colorblind, onHoldStart, onHoldEnd, stableOnTap, stableOnHoldStart, stableOnHoldEnd])}
          </div>
        </div>
        {scoreFloats.map(float => (
          <ScoreFloat
            key={float.id}
            player={float.player}
            idx={float.idx}
            amount={float.amount}
            cols={cols}
            rows={rows}
            gridRef={gridRef}
          />
        ))}
      </div>
      {showBotAssist && !practiceMode && onToggleBotAssist && (
        <button
          ref={botBtnRef}
          className={`bot-icon-btn${isBotActive ? " bot-icon-btn--active" : ""}${(dust ?? 0) < 30 ? " bot-icon-btn--disabled" : ""}`}
          onClick={() => {
            if ((dust ?? 0) >= 30 && !isBotActive && botBtnRef.current) {
              dustCleanupRef.current?.();
              dustCleanupRef.current = animateDustClaim(botBtnRef.current, '.dust-counter', 30, true);
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

// ─── Sliding Cell (K5) — GSAP-driven slide animation ─────────────
function SlidingCell({
  idx, fromIdx, startMs, cols, durationMs, children,
}: {
  idx: number; fromIdx: number; startMs: number; cols: number; durationMs: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dCol = (fromIdx % cols) - (idx % cols);
    const dRow = Math.floor(fromIdx / cols) - Math.floor(idx / cols);
    const elapsed = (Date.now() - startMs) / 1000;
    const dur = Math.max(0.01, durationMs / 1000 - elapsed);
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { xPercent: dCol * 100, yPercent: dRow * 100 },
        { xPercent: 0, yPercent: 0, duration: dur, ease: 'power2.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, [idx, fromIdx, cols, startMs, durationMs]);

  return <div ref={ref} className="cell--sliding" style={{ zIndex: 5 }}>{children}</div>;
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
      onPointerCancel={() => onHoldEnd(idx)}
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
