import React, { useState, useCallback } from "react";
import { i18n } from "../../utils/i18n";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type DemoCellKind = "safe" | "danger" | "special";

const DEMO_GRID: DemoCellKind[][] = [
  ["safe", "safe", "danger"],
  ["danger", "special", "safe"],
  ["safe", "special", "danger"],
];

const CELL_COLORS: Record<DemoCellKind, string> = {
  safe:    "#4ade80",
  danger:  "#a855f7",
  special: "#67e8f9",
};

const SPECIAL_LEGEND = [
  { icon: "❤️", label: "Extra Life" },
  { icon: "🛡️", label: "Shield" },
  { icon: "⚡", label: "Speed Boost" },
  { icon: "💰", label: "Double Points" },
];

interface Step {
  key: I18nStepKey;
  highlight?: DemoCellKind;
}

type I18nStepKey = "hint_intro" | "hint_safe" | "hint_danger" | "hint_special";

const STEPS: Step[] = [
  { key: "hint_intro" },
  { key: "hint_safe",  highlight: "safe" },
  { key: "hint_danger", highlight: "danger" },
  { key: "hint_special", highlight: "special" },
];

export function FirstRunOverlay({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);

  const isLast = step >= STEPS.length;

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const currentHighlight = !isLast ? STEPS[step].highlight : undefined;

  return (
    <div className="first-run-overlay" role="dialog" aria-label={i18n.t("onboarding.title")}>
      <div className="first-run-card">
        <h2 className="first-run-title">{i18n.t("onboarding.title")}</h2>

        <p className="first-run-sub">{i18n.t("onboarding.welcome")}</p>

        {/* Demo grid */}
        <div className="first-run-grid" role="img" aria-label="Demo game grid">
          {DEMO_GRID.flatMap((row, ri) =>
            row.map((kind, ci) => {
              const dimmed = currentHighlight && kind !== currentHighlight;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={`first-run-cell first-run-cell--${kind}${dimmed ? " first-run-cell--dim" : ""}`}
                  style={{ background: CELL_COLORS[kind] }}
                  aria-label={`${kind} cell`}
                />
              );
            })
          )}
        </div>

        {/* Step content */}
        {!isLast && (
          <div className="first-run-step">
            <p className="first-run-step-text">{i18n.t(`onboarding.${STEPS[step].key}` as any)}</p>
          </div>
        )}

        {/* Special cells legend (shown on last info step) */}
        {step === 3 && (
          <div className="first-run-legend">
            <p className="first-run-legend-title">{i18n.t("onboarding.special_cells")}</p>
            <div className="first-run-legend-grid">
              {SPECIAL_LEGEND.map(item => (
                <span key={item.label} className="first-run-legend-item">
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ready step */}
        {isLast && (
          <div className="first-run-ready">
            <p className="first-run-step-text">{i18n.t("onboarding.ready")}</p>
          </div>
        )}

        {/* Controls */}
        <div className="first-run-controls">
          <button className="first-run-btn first-run-btn--primary" onClick={handleNext}>
            {isLast ? i18n.t("onboarding.ready") : i18n.t("onboarding.start")}
          </button>
          <button className="first-run-btn first-run-btn--ghost" onClick={onSkip}>
            {i18n.t("onboarding.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
