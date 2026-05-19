export type DailyChallenge = {
  id: string;
  description: string;
  reward: number;
  target: number;
  progress: number;
  claimed: boolean;
  completed: boolean;
};

export type WeeklyTask = {
  id: string;
  description: string;
  reward: number;
  target: number;
  progress: number;
  claimed: boolean;
  completed: boolean;
};

export function buildDailyChallenges(dateStr: string): DailyChallenge[] {
  const CHALLENGES_KEY = `dtp-challenges-${dateStr}`;
  const PROGRESS_KEY   = `dtp-challenge-progress-${dateStr}`;

  const pool = [
    { id:'play3',    description:'Play 3 games',         reward:30,  target:3  },
    { id:'score50',  description:'Score 50+ in one game', reward:40,  target:50 },
    { id:'streak5',  description:'Reach a 5-tap streak', reward:35,  target:5  },
    { id:'survive60',description:'Survive 60 ticks',      reward:45,  target:60 },
    { id:'dustspend',description:'Spend 20 dust in shop', reward:25,  target:20 },
  ];

  // Pick 3 deterministically by date
  const seed = dateStr.split('').reduce((h,c)=>h*31+c.charCodeAt(0)|0, 0);
  const picked = [
    pool[Math.abs(seed) % pool.length],
    pool[Math.abs(seed * 7) % pool.length],
    pool[Math.abs(seed * 13) % pool.length],
  ].filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i).slice(0,3);

  // Load progress and claimed state
  let progress: Record<string,number> = {};
  let claimedIds: string[] = [];
  try {
    progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
    claimedIds = JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? '[]');
  } catch { /* corrupt localStorage — use defaults */ }

  return picked.map(c => ({
    ...c,
    progress: progress[c.id] ?? 0,
    claimed: claimedIds.includes(c.id),
    completed: (progress[c.id] ?? 0) >= c.target,
  }));
}

export function buildWeeklyTasks(): WeeklyTask[] {
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
  } catch { /* corrupt localStorage — use defaults */ }
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
