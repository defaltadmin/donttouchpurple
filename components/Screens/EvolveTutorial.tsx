import React, { useState } from "react";

const TUTORIAL_KEY = "dtp_evolve_tutorial_done";

interface EvolveTutorialProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to Evolve Mode!",
    body: "The grid evolves as you play. New shapes, colors, and challenges appear as your score grows. Survive as long as you can!",
    emoji: "🧬",
    visual: "grid-preview",
    colors: ["#60a5fa", "#f87171", "#4ade80", "#c026d3", "#fbbf24"],
  },
  {
    title: "Cell Shapes",
    body: "Cells come in squares, circles, and triangles. Tap them all the same way — shape is just for visual variety!",
    emoji: "🔷",
    visual: "shapes",
    colors: ["#60a5fa", "#f472b6", "#22d3ee"],
  },
  {
    title: "Growing Color Palette",
    body: "Start with 3 colors. More colors join as you score higher. Each new color makes it trickier to spot the purple!",
    emoji: "🎨",
    visual: "color-stages",
    colors: ["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#a3e635", "#e879f9", "#fb923c"],
  },
  {
    title: "Powerups",
    body: "♥ heals a heart  ◈ shields from one hit  ❄ freezes the grid  ⚡ doubles your score. Grab them fast!",
    emoji: "⚡",
    visual: "powerups",
    colors: ["#f59e0b", "#06b6d4", "#3b82f6", "#f97316"],
  },
  {
    title: "Hazards",
    body: "❄ Ice cells need multiple taps to break. ⏱ Hold cells require a long press. Stay focused!",
    emoji: "⚠️",
    visual: "hazards",
    colors: ["#60a5fa", "#fb923c"],
  },
  {
    title: "Ready?",
    body: "Don't touch purple. Tap everything else. How long can you survive?",
    emoji: "🚀",
    visual: "start",
    colors: ["#c026d3"],
  },
];

function VisualPreview({ step }: { step: number }) {
  const s = STEPS[step];

  if (s.visual === "grid-preview") {
    return (
      <div className="tutorial-visual">
        <div className="tutorial-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="tutorial-cell"
              style={{
                background: s.colors[i % s.colors.length],
                opacity: i === 3 ? 0.3 : 1,
              }}
            >
              {i === 3 && <span className="tutorial-cell-x">✕</span>}
            </span>
          ))}
        </div>
        <span className="tutorial-visual-hint">Tap colored cells, avoid ✕</span>
      </div>
    );
  }

  if (s.visual === "shapes") {
    return (
      <div className="tutorial-visual">
        <div className="tutorial-shapes">
          <div className="tutorial-shape tutorial-shape--square" style={{ background: s.colors[0] }} />
          <div className="tutorial-shape tutorial-shape--circle" style={{ background: s.colors[1] }} />
          <div className="tutorial-shape tutorial-shape--triangle" style={{ background: s.colors[2] }} />
        </div>
        <span className="tutorial-visual-hint">All shapes are safe to tap</span>
      </div>
    );
  }

  if (s.visual === "color-stages") {
    return (
      <div className="tutorial-visual">
        <div className="tutorial-stages">
          <div className="tutorial-stage">
            <span className="tutorial-stage-label">Early</span>
            <div className="tutorial-stage-dots">
              {s.colors.slice(0, 3).map((c, i) => (
                <span key={i} className="tutorial-stage-dot" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="tutorial-stage">
            <span className="tutorial-stage-label">Mid</span>
            <div className="tutorial-stage-dots">
              {s.colors.slice(0, 5).map((c, i) => (
                <span key={i} className="tutorial-stage-dot" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="tutorial-stage">
            <span className="tutorial-stage-label">Late</span>
            <div className="tutorial-stage-dots">
              {s.colors.map((c, i) => (
                <span key={i} className="tutorial-stage-dot" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <span className="tutorial-visual-hint">More colors = harder to spot purple</span>
      </div>
    );
  }

  if (s.visual === "powerups") {
    return (
      <div className="tutorial-visual">
        <div className="tutorial-powerups">
          {[
            { icon: "♥", label: "Heal", color: s.colors[0] },
            { icon: "◈", label: "Shield", color: s.colors[1] },
            { icon: "❄", label: "Freeze", color: s.colors[2] },
            { icon: "⚡", label: "2× Score", color: s.colors[3] },
          ].map((p, i) => (
            <div key={i} className="tutorial-pwr">
              <span className="tutorial-pwr-icon" style={{ background: p.color }}>{p.icon}</span>
              <span className="tutorial-pwr-label">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (s.visual === "hazards") {
    return (
      <div className="tutorial-visual">
        <div className="tutorial-hazards">
          <div className="tutorial-hazard">
            <span className="tutorial-hazard-icon" style={{ background: s.colors[0] }}>❄</span>
            <span className="tutorial-hazard-label">Ice: Tap 3×</span>
          </div>
          <div className="tutorial-hazard">
            <span className="tutorial-hazard-icon" style={{ background: s.colors[1] }}>⏱</span>
            <span className="tutorial-hazard-label">Hold: Long Press</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-visual">
      <div className="tutorial-start-grid">
        <div className="tutorial-start-cell" style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>∞</span>
        </div>
      </div>
      <span className="tutorial-visual-hint">Practice Mode: No energy cost, no damage</span>
    </div>
  );
}

export function EvolveTutorial({ onClose }: EvolveTutorialProps) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  const next = () => {
    if (step >= STEPS.length - 1) {
      localStorage.setItem(TUTORIAL_KEY, "1");
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-card" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <span className="tutorial-step-counter">{step + 1} / {STEPS.length}</span>
          <button className="tutorial-close-btn" onClick={() => { localStorage.setItem(TUTORIAL_KEY, "1"); onClose(); }}>✕</button>
        </div>
        <div className="tutorial-emoji">{s.emoji}</div>
        <h2 className="tutorial-title">{s.title}</h2>
        <VisualPreview step={step} />
        <p className="tutorial-body">{s.body}</p>
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`tutorial-dot-btn${i === step ? " tutorial-dot-btn--on" : ""}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <div className="tutorial-actions">
          {step > 0 ? (
            <button className="btn-ghost tutorial-nav-btn" onClick={prev}>← Back</button>
          ) : (
            <button className="btn-link tutorial-skip" onClick={() => { localStorage.setItem(TUTORIAL_KEY, "1"); onClose(); }}>
              Skip
            </button>
          )}
          <button className="btn-play tutorial-next" onClick={next}>
            {step >= STEPS.length - 1 ? "Let's Go!" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowEvolveTutorial(): boolean {
  try { return !localStorage.getItem(TUTORIAL_KEY); } catch { return true; }
}
