# Phase E — App.tsx diff instructions (apply manually or via Gemini CLI)

## 1. Add import near other screen imports (after DailyChallengesPopup import)

REPLACE:
  import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";

WITH:
  import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
  import { RewardsHub, countUnclaimedRewards, type WeeklyTask } from "./components/Screens/RewardsHub";


## 2. Add state vars after `showDailyChallenges` state (around line 333)

ADD after `const [dailyChallenges, setDailyChallenges] = ...`:

  const [showRewardsHub, setShowRewardsHub] = useState(false);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => buildWeeklyTasks());


## 3. Add buildWeeklyTasks() function after buildDailyChallenges() (around line 916)

ADD:
  function buildWeeklyTasks(): WeeklyTask[] {
    const now = new Date();
    // Week key: ISO year + week number
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);

    const WEEKLY_PROGRESS_KEY = `dtp-weekly-progress-${weekKey}`;
    const WEEKLY_CLAIMED_KEY  = `dtp-weekly-claimed-${weekKey}`;

    let progress: Record<string, number> = {};
    let claimedIds: string[] = [];
    try {
      progress  = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY) ?? '{}');
      claimedIds = JSON.parse(localStorage.getItem(WEEKLY_CLAIMED_KEY) ?? '[]');
    } catch {}

    const tasks = [
      { id: 'top10',    description: 'Reach top 10 leaderboard this week', reward: 200, target: 1 },
      { id: 'bothmode', description: 'Play both Classic and Evolve mode',   reward: 100, target: 2 },
      { id: 'play10',   description: 'Complete 10 rounds',                  reward: 80,  target: 10 },
      { id: 'score100', description: 'Reach score 100 in one game',         reward: 150, target: 1 },
    ];

    return tasks.map(t => ({
      ...t,
      progress: progress[t.id] ?? 0,
      completed: (progress[t.id] ?? 0) >= t.target,
      claimed: claimedIds.includes(t.id),
    }));
  }


## 4. Add handleClaimWeekly() after handleChallengeClaim() (around line 879)

ADD:
  const handleClaimWeekly = (taskId: string, reward: number) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const WEEKLY_CLAIMED_KEY = `dtp-weekly-claimed-${weekKey}`;
    const claimed: string[] = JSON.parse(localStorage.getItem(WEEKLY_CLAIMED_KEY) ?? '[]');
    claimed.push(taskId);
    localStorage.setItem(WEEKLY_CLAIMED_KEY, JSON.stringify(claimed));
    const safeReward = isNaN(reward) ? 0 : reward;
    const newDust = dust + safeReward;
    persistDust(newDust);
    setDust(newDust);
    setWeeklyTasks(buildWeeklyTasks());
  };


## 5. Update updateChallengeProgress() to also refresh weekly tasks + track weekly progress

INSIDE `updateChallengeProgress`, after `localStorage.setItem(PROGRESS_KEY, ...)`:
ADD:
    // Weekly task progress
    const now2 = new Date();
    const weekStart2 = new Date(now2);
    weekStart2.setDate(now2.getDate() - now2.getDay());
    const weekKey2 = weekStart2.toISOString().slice(0, 10);
    const WEEKLY_PROGRESS_KEY2 = `dtp-weekly-progress-${weekKey2}`;
    let weeklyProgress: Record<string, number> = {};
    try { weeklyProgress = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY2) ?? '{}'); } catch {}
    weeklyProgress['play10'] = (weeklyProgress['play10'] ?? 0) + 1;
    if (p1Score >= 100) weeklyProgress['score100'] = (weeklyProgress['score100'] ?? 0) + 1;
    // Track both-mode: store set of played modes this week
    const modesKey = `dtp-weekly-modes-${weekKey2}`;
    const modesPlayed = new Set(JSON.parse(localStorage.getItem(modesKey) ?? '[]'));
    modesPlayed.add(gameMode);
    localStorage.setItem(modesKey, JSON.stringify([...modesPlayed]));
    weeklyProgress['bothmode'] = modesPlayed.size;
    localStorage.setItem(WEEKLY_PROGRESS_KEY2, JSON.stringify(weeklyProgress));
    setWeeklyTasks(buildWeeklyTasks());


## 6. Compute notification badge count (add near isPlaying computation around line 1001)

ADD after `const cbActive = ...`:
  const loginClaimedToday = localStorage.getItem('dtp-login-claimed') === new Date().toISOString().slice(0, 10);
  const rewardsBadgeCount = countUnclaimedRewards(loginClaimedToday, dailyChallenges, weeklyTasks);


## 7. In StartScreen props (around line 1301), REPLACE:
  onOpenChallenges={() => setShowDailyChallenges(true)}

WITH:
  onOpenRewardsHub={() => setShowRewardsHub(true)}
  rewardsBadgeCount={rewardsBadgeCount}

(Also update StartScreen component signature to accept these props instead of onOpenChallenges)


## 8. REPLACE the two old popup JSX blocks at the bottom of App return (lines 1488-1502):

REMOVE:
  {showLoginStreak && (
    <LoginStreakPopup ... />
  )}
  {showDailyChallenges && (
    <DailyChallengesPopup ... />
  )}

ADD:
  {showRewardsHub && (
    <RewardsHub
      loginStreak={loginStreakCount}
      loginReward={loginStreakReward}
      loginClaimedToday={loginClaimedToday}
      onClaimLogin={() => {
        handleLoginStreakClaim();
        setShowRewardsHub(false);
      }}
      dailyChallenges={dailyChallenges}
      onClaimChallenge={handleChallengeClaim}
      weeklyTasks={weeklyTasks}
      onClaimWeekly={handleClaimWeekly}
      onClose={() => setShowRewardsHub(false)}
    />
  )}
  {/* Show login streak popup on app start if not claimed today — auto-open hub on checkin tab */}
  {/* showLoginStreak triggers hub auto-open */}

NOTE: In the login streak useEffect (line 233), REPLACE:
  setShowLoginStreak(true);
WITH:
  setShowRewardsHub(true);


## 9. Replace rare-active-badge text badge (Phase G1 prep — remove text content):

Line 1078-1080, keep the element but remove text (will be replaced with visual ring in Phase G):
CHANGE:
  ⚠️ Don't touch {snapshot.rareMode.color.toUpperCase()} — {snapshot.rareMode.turnsLeft} left
TO: (empty — Phase G1 replaces this with CSS ring)


## CSS to add to game.css (new rules for Rewards Hub):

```css
/* ─── Rewards Hub ─────────────────────────────────── */
.rewards-hub-overlay {
  z-index: 200;
}
.rewards-hub-panel {
  width: min(96vw, 420px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.hub-tabs {
  display: flex;
  gap: 4px;
  padding: 0 0 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 12px;
}
.hub-tab-btn {
  flex: 1;
  position: relative;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 4px;
  cursor: pointer;
  transition: background 0.15s;
  letter-spacing: 0.02em;
}
.hub-tab-btn--active {
  background: rgba(192,38,211,0.25);
  border-color: var(--accent);
  color: var(--accent);
}
.hub-tab-badge {
  position: absolute;
  top: -5px; right: -5px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.hub-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.hub-empty {
  padding: 32px 0;
  text-align: center;
  opacity: 0.55;
  font-size: 13px;
  font-family: var(--font-ui);
}

/* Check-in tab */
.hub-checkin {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}
.hub-streak-display {
  text-align: center;
  padding: 12px 0 4px;
}
.hub-streak-num {
  display: block;
  font-size: 52px;
  font-weight: 900;
  font-family: var(--font-score);
  color: var(--accent);
  line-height: 1;
}
.hub-streak-lbl {
  font-size: 13px;
  font-family: var(--font-ui);
  opacity: 0.7;
}
.hub-milestones {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0;
}
.hub-milestone {
  flex: 0 0 auto;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
  min-width: 64px;
  opacity: 0.5;
}
.hub-milestone--done {
  opacity: 1;
  background: rgba(192,38,211,0.18);
  border-color: var(--accent);
}
.hub-milestone--next {
  opacity: 1;
  border-color: #facc15;
}
.hub-milestone-day {
  display: block;
  font-size: 10px;
  font-family: var(--font-ui);
  font-weight: 700;
  opacity: 0.7;
}
.hub-milestone-reward {
  display: block;
  font-size: 11px;
  font-family: var(--font-ui);
  font-weight: 800;
  color: var(--accent);
  margin-top: 2px;
}
.hub-next-milestone {
  font-size: 11px;
  font-family: var(--font-ui);
  opacity: 0.55;
  text-align: center;
}
.hub-claim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 4px;
}
.hub-today-reward {
  font-size: 13px;
  font-family: var(--font-ui);
}

/* Task rows */
.hub-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}
.hub-task-row {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 12px;
}
.hub-task-row--done {
  border-color: var(--accent);
}
.hub-task-row--claimed {
  opacity: 0.45;
}
.hub-task-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.hub-task-desc {
  font-size: 12px;
  font-family: var(--font-ui);
  font-weight: 600;
  line-height: 1.3;
}
.hub-task-reward {
  font-size: 12px;
  font-family: var(--font-ui);
  font-weight: 800;
  color: var(--accent);
  white-space: nowrap;
}
.hub-task-bar {
  height: 5px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.hub-task-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.hub-task-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hub-task-progress {
  font-size: 11px;
  font-family: var(--font-ui);
  opacity: 0.55;
}

/* Rewards Hub icon button (in StartScreen bottom nav) */
.rewards-hub-btn {
  position: relative;
  background: rgba(192,38,211,0.15);
  border: 1px solid rgba(192,38,211,0.35);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 20px;
  cursor: pointer;
  color: var(--text);
  transition: background 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.rewards-hub-btn:hover {
  background: rgba(192,38,211,0.28);
}
.rewards-hub-badge {
  position: absolute;
  top: -6px; right: -6px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  min-width: 18px; height: 18px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  font-family: var(--font-ui);
}
```
