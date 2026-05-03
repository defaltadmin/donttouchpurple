// components/Screens/EvolveTutorial.tsx
import React, { useState, useEffect } from 'react';
import { TUTORIAL_STEPS } from '../../config/tutorial';

interface EvolveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep?: number;
}

export default function EvolveTutorial({ isOpen, onClose, currentStep = 0 }: EvolveTutorialProps) {
  const [step, setStep] = useState(currentStep);
  const current = TUTORIAL_STEPS[step];

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (!current || !current.duration) return;
    
    const timer = setTimeout(() => {
      if (step < TUTORIAL_STEPS.length - 1) {
        setStep(step + 1);
      } else {
        onClose();
      }
    }, current.duration);

    return () => clearTimeout(timer);
  }, [step, current, onClose]);

  if (!isOpen || !current) return null;

  const c = current;
  const isAutoAdvance = (c.duration ?? 0) > 0;
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const goNext = () => {
    if (isLast) onClose();
    else setStep(step + 1);
  };

  const renderVisual = () => {
    if (current.highlight === 'basics') {
      return (
        <div className="tutorial-grid-demo">
          <div className="tutorial-demo-cell tutorial-demo-cell--safe">Tap</div>
          <div className="tutorial-demo-cell tutorial-demo-cell--danger">Avoid</div>
          <div className="tutorial-demo-cell tutorial-demo-cell--safe">Tap</div>
          <div className="tutorial-demo-cell tutorial-demo-cell--empty" />
        </div>
      );
    }
    if (current.highlight === 'rare') {
      return (
        <div className="tutorial-warning-demo">
          <span className="tutorial-warning-chip">Don't touch red</span>
          <div className="tutorial-demo-row">
            <div className="tutorial-demo-cell tutorial-demo-cell--safe">Safe</div>
            <div className="tutorial-demo-cell tutorial-demo-cell--rare">Avoid</div>
          </div>
        </div>
      );
    }
    if (current.highlight === 'powerup') {
      return (
        <div className="tutorial-powerups">
          <div className="tutorial-pwr"><span className="tutorial-pwr-icon">♥</span><span className="tutorial-pwr-label">Heal</span></div>
          <div className="tutorial-pwr"><span className="tutorial-pwr-icon">◈</span><span className="tutorial-pwr-label">Shield</span></div>
          <div className="tutorial-pwr"><span className="tutorial-pwr-icon">❄</span><span className="tutorial-pwr-label">Slow</span></div>
          <div className="tutorial-pwr"><span className="tutorial-pwr-icon">2x</span><span className="tutorial-pwr-label">Score</span></div>
        </div>
      );
    }
    return (
      <div className="tutorial-shapes">
        <div className="tutorial-shape tutorial-shape--circle" />
        <div className="tutorial-shape tutorial-shape--triangle" />
        <div className="tutorial-shape tutorial-shape--diamond" />
      </div>
    );
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-header">
          <span className="tutorial-step-counter">
            {step + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button className="tutorial-close-btn" onClick={onClose}>✕</button>
        </div>

        <h2 className="tutorial-title">{current.title}</h2>
        <p className="tutorial-body">{current.body}</p>

        <div className="tutorial-visual">
          {renderVisual()}
          <div className="tutorial-visual-hint">{current.hint}</div>
        </div>

        <div className="tutorial-dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((item, index) => (
            <span key={item.id} className={`tutorial-dot-btn${index === step ? " tutorial-dot-btn--on" : ""}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={onClose}>Skip</button>
          <button 
            className="tutorial-next"
            disabled={isAutoAdvance}
            style={{ opacity: isAutoAdvance ? 0.4 : 1, cursor: isAutoAdvance ? "default" : "pointer" }}
            onClick={() => {
              if (isAutoAdvance) return;
              goNext();
            }}
          >
            {isAutoAdvance ? "Wait" : isLast ? "Start" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
