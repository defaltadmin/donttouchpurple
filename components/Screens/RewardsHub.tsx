import React, { useState } from "react";
import type { DailyChallenge } from "./DailyChallengesPopup";

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
  const [tab, setTab] = useState<HubTab>("checkin");

  // Badge counts for tab headers
  const loginBadge  = loginClaimedToday ? 0 : 1;
  const dailyBadge  = dailyChallenges.filter(c => c.completed && !c.claimed).length;
  const weeklyBadge = weeklyTasks.filter(t => t.completed && !t.claimed).length;

  return (
    // No outside-click dismiss (E8) — modal is persistent until explicit ✕
    <div className="modal-overlay rewards-hub-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-panel rewards-hub-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">🎁 Rewards Hub</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="hub-tabs">
          <HubTabBtn label="Check-in" badge={loginBadge} active={tab === "checkin"} onClick={() => setTab("checkin")} />
          <HubTabBtn label="Daily" badge={dailyBadge} active={tab === "daily"} onClick={() => setTab("daily")} />
          <HubTabBtn label="Weekly" badge={weeklyBadge} active={tab === "weekly"} onClick={() => setTab("weekly")} />
        </div>

        {/* Tab content */}
        <div className="hub-content">
          {tab === "checkin" && (
            <CheckinTab
              streak={loginStreak}
              reward={loginReward}
              claimed={loginClaimedToday}
              onClaim={onClaimLogin}
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
  const next = STREAK_MILESTONES.find(m => m.day > streak);
  return (
    <div className="hub-checkin">
      <div className="hub-streak-display">
        <span className="hub-streak-num">{streak}</span>
        <span className="hub-streak-lbl">Day streak 🔥</span>
      </div>

      {/* Milestone pips */}
      <div className="hub-milestones">
        {STREAK_MILESTONES.map(m => (
          <div
            key={m.day}
            className={`hub-milestone${streak >= m.day ? " hub-milestone--done" : ""}${streak + 1 === m.day ? " hub-milestone--next" : ""}`}
          >
            <span className="hub-milestone-day">Day {m.day}</span>
            <span className="hub-milestone-reward">+{m.reward} 💜</span>
          </div>
        ))}
      </div>

      {next && (
        <div className="hub-next-milestone">
          Next milestone: Day {next.day} (+{next.reward} 💜) — {next.day - streak} day{next.day - streak !== 1 ? "s" : ""} away
        </div>
      )}

      <div className="hub-claim-row">
        <span className="hub-today-reward">Today's reward: <strong>+{reward} 💜</strong></span>
        <button
          className="btn-primary"
          disabled={claimed}
          onClick={onClaim}
        >
          {claimed ? "✓ Claimed" : "Claim"}
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
  if (challenges.length === 0) {
    return <div className="hub-empty">No daily tasks today.</div>;
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
          onClaim={() => onClaim(c.id, c.reward)}
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
  if (tasks.length === 0) {
    return <div className="hub-empty">No weekly tasks this week.</div>;
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
          onClaim={() => onClaim(t.id, t.reward)}
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
          {claimed ? "✓" : completed ? "Claim" : "…"}
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
