import React, { useRef } from 'react';
import { animateDustClaim } from '../../utils/dustAnimation';
import { useTranslation } from '../../hooks/useTranslation';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface LoginStreakPopupProps {
  streak: number;
  dustReward: number;
  onClaim: () => void;
  onClose: () => void;
}

// Dust reward per streak day (caps at day 7)
export function getStreakReward(streak: number): number {
  const rewards = [50, 75, 100, 125, 150, 200, 300];
  if (!streak || streak < 1) return rewards[0];
  return rewards[Math.min(streak - 1, rewards.length - 1)];
}

export default function LoginStreakPopup({ streak, dustReward, onClaim, onClose }: LoginStreakPopupProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClaim = () => {
    if (btnRef.current) {
      animateDustClaim(btnRef.current, '.dust-counter', dustReward, false, onClaim);
    } else {
      onClaim();
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="popup-overlay" role="dialog" aria-modal="true" aria-label={t('streak.title')} onClick={onClose} ref={trapRef}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <span className="popup-title">🔥 {t('streak.title')}</span>
          <button className="popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="streak-days">
          {days.map(day => (
            <div
              key={day}
              className={`streak-day ${day < streak ? 'streak-day--done' : day === streak ? 'streak-day--today' : 'streak-day--future'}`}
            >
              <span className="streak-day-num">{t('streak.day', { n: day })}</span>
              <span className="streak-day-reward">+{getStreakReward(day)}💜</span>
              {day < streak && <span className="streak-day-check">✓</span>}
              {day === streak && <span className="streak-day-glow">★</span>}
            </div>
          ))}
        </div>

        <div className="popup-reward-line">
          {t('streak.today_reward')} <strong>+{dustReward} 💜</strong>
        </div>

        <button ref={btnRef} className="btn-primary popup-claim-btn" onClick={handleClaim}>
          {t('streak.claim', { n: dustReward })} 💜
        </button>
      </div>
    </div>
  );
}
