# Phase E — Rewards Hub —  Patch Blocks
# Apply each block in order. Run `.\node_modules\.bin\vite.cmd build` after all blocks applied.

## FILE: src/components/Screens/RewardsHub.tsx
CREATE new file (content in RewardsHub.tsx output)
Place at: src/components/Screens/RewardsHub.tsx

## FILE: src/App.tsx — 6 str_replace patches

### PATCH 1 — Import
FIND (exact):
  import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";

REPLACE WITH:
  import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
  import { RewardsHub, countUnclaimedRewards, type WeeklyTask } from "./components/Screens/RewardsHub";

---

### PATCH 2 — State vars (add showRewardsHub + weeklyTasks after dailyChallenges state)
FIND (exact):
  const [dailyChallenges, setDailyChallenges]         = useState<DailyChallenge[]>([]);

REPLACE WITH:
  const [dailyChallenges, setDailyChallenges]         = useState<DailyChallenge[]>([]);
  const [showRewardsHub, setShowRewardsHub]           = useState(false);
  const [weeklyTasks, setWeeklyTasks]                 = useState<WeeklyTask[]>([]);

---

### PATCH 3 — Login streak useEffect: replace setShowLoginStreak(true) with setShowRewardsHub(true)
FIND (exact):
      setShowLoginStreak(true);

REPLACE WITH:
      setShowRewardsHub(true);

---

### PATCH 4 — After buildDailyChallenges function, add buildWeeklyTasks + handleClaimWeekly + weekly updateChallengeProgress
FIND (exact):
  // Update challenge progress from game over
  const updateChallengeProgress = (p1Score: number, finalTick: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const PROGRESS_KEY = `dtp-challenge-progress-${todayStr}`;
    let progress: Record<string,number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50) progress['score50'] = p1Score;
    if (finalTick >= 60) progress['survive60'] = finalTick;
    if (peakStreakRef.current >= 5) progress['streak5'] = peakStreakRef.current;

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(todayStr));
  };

REPLACE WITH:
  function buildWeeklyTasks(): WeeklyTask[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const WEEKLY_PROGRESS_KEY = `dtp-weekly-progress-${weekKey}`;
    const WEEKLY_CLAIMED_KEY  = `dtp-weekly-claimed-${weekKey}`;
    let progress: Record<string, number> = {};
    let claimedIds: string[] = [];
    try {
      progress   = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY) ?? '{}');
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

  // Update challenge progress from game over
  const updateChallengeProgress = (p1Score: number, finalTick: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const PROGRESS_KEY = `dtp-challenge-progress-${todayStr}`;
    let progress: Record<string,number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50) progress['score50'] = p1Score;
    if (finalTick >= 60) progress['survive60'] = finalTick;
    if (peakStreakRef.current >= 5) progress['streak5'] = peakStreakRef.current;

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(todayStr));

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
    const modesKey = `dtp-weekly-modes-${weekKey2}`;
    const modesPlayed = new Set<string>(JSON.parse(localStorage.getItem(modesKey) ?? '[]'));
    modesPlayed.add(gameMode);
    localStorage.setItem(modesKey, JSON.stringify([...modesPlayed]));
    weeklyProgress['bothmode'] = modesPlayed.size;
    localStorage.setItem(WEEKLY_PROGRESS_KEY2, JSON.stringify(weeklyProgress));
    setWeeklyTasks(buildWeeklyTasks());
  };

---

### PATCH 5 — Badge count + StartScreen prop change
FIND (exact):
  const isPlaying = screen === "playing" || screen === "gameover";
  const is2P = numPlayers === 2;
  const cbFilter = getCBFilterStyle(colorblindMode);
  const cbActive = colorblindMode !== "none";

REPLACE WITH:
  const isPlaying = screen === "playing" || screen === "gameover";
  const is2P = numPlayers === 2;
  const cbFilter = getCBFilterStyle(colorblindMode);
  const cbActive = colorblindMode !== "none";
  const loginClaimedToday = localStorage.getItem('dtp-login-claimed') === new Date().toISOString().slice(0, 10);
  const rewardsBadgeCount = countUnclaimedRewards(loginClaimedToday, dailyChallenges, weeklyTasks);

---

### PATCH 6 — StartScreen prop: replace onOpenChallenges with onOpenRewardsHub + rewardsBadgeCount
FIND (exact):
          onOpenChallenges={() => setShowDailyChallenges(true)}

REPLACE WITH:
          onOpenRewardsHub={() => setShowRewardsHub(true)}
          rewardsBadgeCount={rewardsBadgeCount}

---

### PATCH 7 — Replace two old popups with RewardsHub at bottom of return
FIND (exact):
      {showLoginStreak && (
        <LoginStreakPopup
          streak={loginStreakCount}
          dustReward={loginStreakReward}
          onClaim={handleLoginStreakClaim}
          onClose={() => setShowLoginStreak(false)}
        />
      )}
      {showDailyChallenges && (
        <DailyChallengesPopup
          challenges={dailyChallenges}
          onClaim={handleChallengeClaim}
          onClose={() => setShowDailyChallenges(false)}
        />
      )}

REPLACE WITH:
      {showRewardsHub && (
        <RewardsHub
          loginStreak={loginStreakCount}
          loginReward={loginStreakReward}
          loginClaimedToday={loginClaimedToday}
          onClaimLogin={() => {
            handleLoginStreakClaim();
          }}
          dailyChallenges={dailyChallenges}
          onClaimChallenge={handleChallengeClaim}
          weeklyTasks={weeklyTasks}
          onClaimWeekly={handleClaimWeekly}
          onClose={() => setShowRewardsHub(false)}
        />
      )}

---

## FILE: src/components/Screens/StartScreen.tsx — 1 patch
(Update props interface and render to accept onOpenRewardsHub + rewardsBadgeCount, replace Daily Challenges button)

Add to StartScreen props interface:
  onOpenRewardsHub: () => void;
  rewardsBadgeCount?: number;

Replace Daily Challenges button (search for "onOpenChallenges" usage in StartScreen):
  <button className="rewards-hub-btn" onClick={onOpenRewardsHub}>
    🎁
    {(rewardsBadgeCount ?? 0) > 0 && (
      <span className="rewards-hub-badge">{rewardsBadgeCount}</span>
    )}
  </button>

---

## FILE: src/styles/game.css — append CSS
ADD the CSS block from PHASE_E_DIFF.md at end of game.css

---

## CHANGELOG update (add to v5.5.0 Unreleased section):
### Phase E — Rewards Hub ✅ DONE
- E1–E8: RewardsHub.tsx created; 3-tab modal (Check-in, Daily, Weekly); notification badge on hub icon; login streak auto-opens hub; no outside-click dismiss; Daily Challenges button replaced; weekly task tracking with dtp-weekly-* keys
