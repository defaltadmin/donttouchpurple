import { useState, useCallback, useRef } from "react";
import type { DailyChallenge } from "../components/Screens/DailyChallengesPopup";

function buildDailyChallenges(dateStr: string): DailyChallenge[] {
  const CHALLENGES_KEY = `dtp-challenges-${dateStr}`;
  const PROGRESS_KEY   = `dtp-challenge-progress-${dateStr}`;

  const pool = [
    { id: 'play3',     description: 'Play 3 games',          reward: 30,  target: 3  },
    { id: 'score50',   description: 'Score 50+ in one game', reward: 40,  target: 50 },
    { id: 'streak5',   description: 'Reach a 5-tap streak',  reward: 35,  target: 5  },
    { id: 'survive60', description: 'Survive 60 ticks',      reward: 45,  target: 60 },
    { id: 'dustspend', description: 'Spend 20 dust in shop', reward: 25,  target: 20 },
  ];

  const seed = dateStr.split('').reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 0);
  const picked = [
    pool[Math.abs(seed)       % pool.length],
    pool[Math.abs(seed * 7)   % pool.length],
    pool[Math.abs(seed * 13)  % pool.length],
  ].filter((c, i, a) => a.findIndex(x => x.id === c.id) === i).slice(0, 3);

  let progress: Record<string, number> = {};
  let claimedIds: string[] = [];
  try {
    progress   = JSON.parse(localStorage.getItem(PROGRESS_KEY)   ?? '{}');
    claimedIds = JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? '[]');
  } catch {}

  return picked.map(c => ({
    ...c,
    progress:  progress[c.id]   ?? 0,
    claimed:   claimedIds.includes(c.id),
    completed: (progress[c.id] ?? 0) >= c.target,
  }));
}

export function useDailyChallenges(
  peakStreakRef: React.RefObject<number>,
  addDust: (amount: number, source: string) => number
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(
    () => buildDailyChallenges(todayStr)
  );

  const updateChallengeProgress = useCallback((p1Score: number, finalTick: number, gameMode: string) => {
    const today = new Date().toISOString().split('T')[0];
    const PROGRESS_KEY = `dtp-challenge-progress-${today}`;
    let progress: Record<string, number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50)                    progress['score50']   = p1Score;
    if (finalTick >= 60)                  progress['survive60'] = finalTick;
    if ((peakStreakRef.current ?? 0) >= 5) progress['streak5']  = peakStreakRef.current ?? 0;

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(today));
  }, [peakStreakRef]);

  const handleChallengeClaim = useCallback((challengeId: string, reward: number) => {
    const today = new Date().toISOString().split('T')[0];
    const CHALLENGES_KEY = `dtp-challenges-${today}`;
    const claimed: string[] = JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? '[]');
    claimed.push(challengeId);
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(claimed));
    addDust(reward, 'DailyChallenge');
    setDailyChallenges(buildDailyChallenges(today));
  }, [addDust]);

  return {
    dailyChallenges,
    setDailyChallenges,
    updateChallengeProgress,
    handleChallengeClaim,
    buildDailyChallenges,
  };
}
