import React, { useState } from "react";
import type { DailyChallenge } from "./DailyChallengesPopup";
import { playSoundEffect } from "../../hooks/useGameEngine";
import { useTranslation } from "../../hooks/useTranslation";
import { useFocusTrap } from "../../hooks/useFocusTrap";

// ─── Types ────────────────────────────────────────────────
export interface WeeklyTask {
  id: string;
  description: string;
  reward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface RewardsHubProps {
  // Login streak (Daily Check-in tab)
  loginStreak: number;
  loginReward: number;
  loginClaimedToday: boolean;
  onClaimLogin: () => void;

  // Daily tasks tab
  dailyChallenges: DailyChallenge[];
  onClaimChallenge: (id: string, reward: number) => void;

  // Weekly tasks tab
  weeklyTasks: WeeklyTask[];
  onClaimWeekly: (id: string, reward: number) => void;

  onClose: () => void;
}

type HubTab = "checkin" | "daily" | "weekly";

// ─── Component ────────────────────────────────────────────
export function RewardsHub({
  loginStreak,
  loginReward,
  loginClaimedToday,
  onClaimLogin,
  dailyChallenges,
  onClaimChallenge,
  weeklyTasks,
  onClaimWeekly,
  onClose,
}: RewardsHubProps) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const [tab, setTab] = useState<HubTab>("checkin");
  const [closing, setClosing] = useState(false);

  // Badge counts for tab headers
  const loginBadge  = loginClaimedToday ? 0 : 1;
  const dailyBadge  = dailyChallenges.filter(c => c.completed && !c.claimed).length;
  const weeklyBadge = weeklyTasks.filter(t => t.completed && !t.claimed).length;

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 420);
  };

  const handleClaimLogin = () => {
    onClaimLogin();
    // Trigger close animation after claim
    setTimeout(() => { setClosing(true); setTimeout(onClose, 420); }, 600);
  };

  return (
    // No outside-click dismiss (E8) — modal is persistent until explicit ✕
    <div className={`modal-overlay rewards-hub-overlay${closing ? " rewards-hub-overlay--closing" : ""}`} role="dialog" aria-modal="true" aria-label={t('rewards.title')} onClick={(e) => e.stopPropagation()} ref={trapRef}>
      <div className={`modal-panel rewards-hub-panel${closing ? " rewards-hub-panel--closing" : ""}`} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">🎁 {t('rewards.title')}</span>
          <button className="btn-icon" onClick={handleClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="hub-tabs">
          <HubTabBtn label={t('rewards.checkin')} badge={loginBadge} active={tab === "checkin"} onClick={() => setTab("checkin")} />
          <HubTabBtn label={t('rewards.daily')} badge={dailyBadge} active={tab === "daily"} onClick={() => setTab("daily")} />
          <HubTabBtn label={t('rewards.weekly')} badge={weeklyBadge} active={tab === "weekly"} onClick={() => setTab("weekly")} />
        </div>

        {/* Tab content */}
        <div className="hub-content">
          {tab === "checkin" && (
            <CheckinTab
              streak={loginStreak}
              reward={loginReward}
              claimed={loginClaimedToday}
              onClaim={handleClaimLogin}
            />
          )}
          {tab === "daily" && (
            <DailyTab challenges={dailyChallenges} onClaim={onClaimChallenge} />
          )}
          {tab === "weekly" && (
            <WeeklyTab tasks={weeklyTasks} onClaim={onClaimWeekly} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────
function HubTabBtn({ label, badge, active, onClick }: { label: string; badge: number; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`hub-tab-btn${active ? " hub-tab-btn--active" : ""}`}
      onClick={onClick}
    >
      {label}
      {badge > 0 && <span className="hub-tab-badge">{badge}</span>}
    </button>
  );
}

// ─── Check-in tab ─────────────────────────────────────────
const STREAK_MILESTONES = [
  { day: 1, reward: 30 },
  { day: 3, reward: 60 },
  { day: 7, reward: 150 },
  { day: 14, reward: 300 },
  { day: 30, reward: 600 },
];

function CheckinTab({ streak, reward, claimed, onClaim }: {
  streak: number; reward: number; claimed: boolean; onClaim: () => void;
}) {
  const { t } = useTranslation();
  const next = STREAK_MILESTONES.find(m => m.day > streak);
  return (
    <div className="hub-checkin">
      <div className="hub-streak-display">
        <span className="hub-streak-num">{streak}</span>
        <span className="hub-streak-lbl">{t('rewards.day_streak')} 🔥</span>
      </div>

      {/* Milestone pips */}
      <div className="hub-milestones">
        {STREAK_MILESTONES.map(m => (
          <div
            key={m.day}
            className={`hub-milestone${streak >= m.day ? " hub-milestone--done" : ""}${streak + 1 === m.day ? " hub-milestone--next" : ""}`}
          >
            <span className="hub-milestone-day">{t('streak.day', { n: m.day })}</span>
            <span className="hub-milestone-reward">+{m.reward} 💜</span>
          </div>
        ))}
      </div>

      {next && (
        <div className="hub-next-milestone">
          {t('rewards.next_milestone', { n: next.day })}
        </div>
      )}

      <div className="hub-claim-row">
        <span className="hub-today-reward">{t('rewards.today_reward')} <strong>+{reward} 💜</strong></span>
        <button
          className="btn-primary"
          disabled={claimed}
          onClick={() => { onClaim(); playSoundEffect("claim"); }}
        >
          {claimed ? `✓ ${t('rewards.claimed')}` : t('rewards.claim')}
        </button>
      </div>
    </div>
  );
}

// ─── Daily tab ────────────────────────────────────────────
function DailyTab({ challenges, onClaim }: {
  challenges: DailyChallenge[];
  onClaim: (id: string, reward: number) => void;
}) {
  const { t } = useTranslation();
  if (challenges.length === 0) {
    return <div className="hub-empty">{t('rewards.no_daily')}</div>;
  }
  return (
    <div className="hub-tasks-list">
      {challenges.map(c => (
        <TaskRow
          key={c.id}
          description={c.description}
          reward={c.reward}
          progress={c.progress}
          target={c.target}
          completed={c.completed}
          claimed={c.claimed}
          onClaim={() => { onClaim(c.id, c.reward); playSoundEffect("claim"); }}
        />
      ))}
    </div>
  );
}

// ─── Weekly tab ───────────────────────────────────────────
function WeeklyTab({ tasks, onClaim }: {
  tasks: WeeklyTask[];
  onClaim: (id: string, reward: number) => void;
}) {
  const { t } = useTranslation();
  if (tasks.length === 0) {
    return <div className="hub-empty">{t('rewards.no_weekly')}</div>;
  }
  return (
    <div className="hub-tasks-list">
      {tasks.map(t => (
        <TaskRow
          key={t.id}
          description={t.description}
          reward={t.reward}
          progress={t.progress}
          target={t.target}
          completed={t.completed}
          claimed={t.claimed}
          onClaim={() => { onClaim(t.id, t.reward); playSoundEffect("claim"); }}
        />
      ))}
    </div>
  );
}

// ─── Shared task row ──────────────────────────────────────
function TaskRow({ description, reward, progress, target, completed, claimed, onClaim }: {
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const { t } = useTranslation();
  const pct = Math.min(100, target > 0 ? (progress / target) * 100 : 0);
  return (
    <div className={`hub-task-row${claimed ? " hub-task-row--claimed" : completed ? " hub-task-row--done" : ""}`}>
      <div className="hub-task-top">
        <span className="hub-task-desc">{description}</span>
        <span className="hub-task-reward">+{reward} 💜</span>
      </div>
      <div className="hub-task-bar">
        <div className="hub-task-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="hub-task-bottom">
        <span className="hub-task-progress">{Math.min(progress, target)}/{target}</span>
        <button
          className="btn-primary btn-sm"
          disabled={!completed || claimed}
          onClick={onClaim}
        >
          {claimed ? "✓" : completed ? t('rewards.claim') : "…"}
        </button>
      </div>
    </div>
  );
}

// ─── Notification badge count helper (exported for App.tsx) ───────
export function countUnclaimedRewards(
  loginClaimedToday: boolean,
  dailyChallenges: DailyChallenge[],
  weeklyTasks: WeeklyTask[],
): number {
  let count = loginClaimedToday ? 0 : 1;
  count += dailyChallenges.filter(c => c.completed && !c.claimed).length;
  count += weeklyTasks.filter(t => t.completed && !t.claimed).length;
  return count;
}
