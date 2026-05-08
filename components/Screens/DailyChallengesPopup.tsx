import React, { useRef, useState } from 'react';
import { animateDustClaim } from '../../utils/dustAnimation';

export interface DailyChallenge {
  id: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  claimed: boolean;
  completed: boolean;
}

interface DailyChallengesPopupProps {
  challenges: DailyChallenge[];
  onClaim: (challengeId: string, reward: number) => void;
  onClose: () => void;
}

export default function DailyChallengesPopup({ challenges, onClaim, onClose }: DailyChallengesPopupProps) {
  const [claimed, setClaimed] = useState<Set<string>>(
    () => new Set(challenges.filter(c => c.claimed).map(c => c.id))
  );
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleClaim = (challenge: DailyChallenge) => {
    if (claimed.has(challenge.id)) return;
    const btn = btnRefs.current[challenge.id];
    const doComplete = () => {
      setClaimed(prev => new Set([...prev, challenge.id]));
      onClaim(challenge.id, challenge.reward);
    };
    if (btn) {
      animateDustClaim(btn, '.dust-counter', challenge.reward, false, doComplete);
    } else {
      doComplete();
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <span className="popup-title">🎯 Daily Challenges</span>
          <button className="popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="challenges-list">
          {challenges.map(ch => {
            const isClaimed = claimed.has(ch.id);
            const pct = Math.min(100, (ch.progress / ch.target) * 100);
            return (
              <div key={ch.id} className={`challenge-row ${isClaimed ? 'challenge-row--done' : ''}`}>
                <div className="challenge-info">
                  <div className="challenge-desc">{ch.description}</div>
                  <div className="challenge-bar-wrap">
                    <div className="challenge-bar">
                      <div className="challenge-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="challenge-progress">
                      {Math.min(ch.progress, ch.target)}/{ch.target}
                    </span>
                  </div>
                </div>
                <button
                  ref={el => { btnRefs.current[ch.id] = el; }}
                  className={`challenge-claim-btn ${isClaimed ? 'challenge-claim-btn--done' : ''}`}
                  disabled={!ch.completed || isClaimed}
                  onClick={() => handleClaim(ch)}
                >
                  {isClaimed ? '✓' : `+${ch.reward}💜`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="popup-footer-note">Resets at midnight 🕛</div>
      </div>
    </div>
  );
}
