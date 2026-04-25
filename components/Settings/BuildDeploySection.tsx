import React, { useState, useCallback } from "react";
import { DIFFICULTY } from "../../config/difficulty";
import { difficultyOverrides, applyOverride, clearOverrides } from "../../config/difficultyOverrides";

interface SliderDef {
  key: keyof typeof DIFFICULTY;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  help: string;
}

const SLIDERS: SliderDef[] = [
  { key: "INIT_MS",     label: "Initial Tick (ms)",   min: 500, max: 4000, step: 50,
    format: v => v + "ms", help: "Starting tick interval. Higher = slower start." },
  { key: "MIN_MS",      label: "Min Tick (ms)",        min: 200, max: 800,  step: 10,
    format: v => v + "ms", help: "Fastest possible tick. Higher = easier ceiling." },
  { key: "DECAY_EXP",   label: "Decay Exponent",       min: 0.90, max: 0.999, step: 0.001,
    format: v => v.toFixed(3), help: "Per-step speed multiplier. Lower = faster ramp." },
  { key: "DECAY_EVERY", label: "Decay Every N taps",   min: 1, max: 20, step: 1,
    help: "How many taps between each decay step." },
  { key: "SPIN_BASE_DURATION", label: "Spin Base (s)", min: 4, max: 30, step: 0.5,
    format: v => v + "s", help: "Base rotation period at spin level 0." },
  { key: "SPIN_SPEED_CAP",     label: "Spin Speed Cap", min: 1, max: 5, step: 0.1,
    format: v => v.toFixed(1) + "×", help: "Max spin speed multiplier." },
  { key: "SPIN_GROWTH",  label: "Spin Growth/level",   min: 0.01, max: 0.15, step: 0.005,
    format: v => "+" + (v * 100).toFixed(1) + "%", help: "Speed increase per spin level." },
  { key: "SPIN_EPOCH_LEVELS", label: "Direction Flip", min: 1, max: 10, step: 1,
    help: "Spin direction flips every N levels." },
];

interface BuildDeploySectionProps {
  onClose: () => void;
}

export function BuildDeploySection({ onClose }: BuildDeploySectionProps) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]))
  );
  const [livePreview, setLivePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = useCallback((key: string, v: number) => {
    setVals(prev => {
      const next = { ...prev, [key]: v };
      if (livePreview) {
        applyOverride(key as keyof typeof DIFFICULTY, v);
      }
      return next;
    });
  }, [livePreview]);

  const togglePreview = () => {
    setLivePreview(p => {
      if (!p) {
        // Apply all current vals
        SLIDERS.forEach(s => applyOverride(s.key, vals[s.key]));
      } else {
        clearOverrides();
      }
      return !p;
    });
  };

  const reset = () => {
    const defaults = Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]));
    setVals(defaults);
    clearOverrides();
    if (livePreview) {
      SLIDERS.forEach(s => applyOverride(s.key, (DIFFICULTY as any)[s.key]));
    }
  };

  const generateScript = () => {
    const lines = [
      "// ─── Difficulty scaling constants ──────────────────────────────────",
      "export const DIFFICULTY = {",
      ...SLIDERS.map(s => `  ${s.key}: ${
        Number.isInteger(vals[s.key]) ? vals[s.key] : vals[s.key].toFixed(
          s.key === "DECAY_EXP" ? 3 : s.key === "SPIN_GROWTH" ? 3 : 2
        )
      },`),
      "} as const;",
    ].join("\n");
    navigator.clipboard?.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">⚙ Difficulty Tuning</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">Live Preview</div>
          <button
            className={livePreview ? "btn-primary" : "btn-ghost"}
            style={{ width: "100%" }}
            onClick={togglePreview}
          >
            {livePreview ? "🟢 Preview ON — changes affect live game" : "⚫ Preview OFF — safe to tune"}
          </button>
        </div>

        {SLIDERS.map(s => (
          <div key={s.key} className="opt-section">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="opt-label" title={s.help}>{s.label} ⓘ</div>
              <div className="opt-label" style={{ opacity: 0.7 }}>
                {s.format ? s.format(vals[s.key]) : vals[s.key]}
              </div>
            </div>
            <input type="range"
              className="devs-range"
              min={s.min} max={s.max} step={s.step}
              value={vals[s.key]}
              onChange={e => set(s.key, Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
              <span>{s.min}</span>
              <span>default: {(DIFFICULTY as any)[s.key]}</span>
              <span>{s.max}</span>
            </div>
          </div>
        ))}

        <div className="opt-section" style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={reset}>↺ Reset Defaults</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={generateScript}>
            {copied ? "✅ Copied!" : "📋 Copy difficulty.ts snippet"}
          </button>
        </div>

        <div style={{ fontSize: 10, opacity: 0.3, textAlign: "center", padding: "8px 0 4px" }}>
          Paste output into src/config/difficulty.ts → rebuild → deploy
        </div>
      </div>
    </div>
  );
}
