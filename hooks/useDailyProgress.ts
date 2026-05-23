import { useState, useCallback, useEffect, useRef } from 'react';
import { safeSet, safeGetJSON } from '../utils/storage';
import { logger } from '../utils/logger';
import { safeSentry } from '../services/sentry';
import type { DailyChallenge, WeeklyTask } from '../utils/rewards';
import type { DailyObjective, BossObjectiveCounters } from '../config/dailyObjective';
import {
  getDailyObjectives,
  getObjectiveProgress,
  getObjectiveStreak,
  checkObjective,
  markObjectiveComplete,
} from '../config/dailyObjective';
import { buildDailyChallenges, buildWeeklyTasks } from '../utils/rewards';
import { speedLabel } from '../engine/DifficultyScaler';
import { countUnclaimedRewards } from '../components/Screens/RewardsHub';
import { getStreakReward } from '../components/Screens/LoginStreakPopup';

type FirebaseModule = typeof import('../services/firebase');

interface DailyProgressOptions {
  addDust: (amount: number, source: string) => number;
  getFirebase: () => Promise<FirebaseModule>;
  setToast: React.Dispatch<React.SetStateAction<string | null>>;
  toastRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  snapshotRef: React.RefObject<{ tick: number; gameSeed: number } | null>;
  peakStreakRef: React.RefObject<number | null>;
}

export interface DailyProgressReturn {
  dailyObjectives: DailyObjective[];
  setDailyObjectives: React.Dispatch<React.SetStateAction<DailyObjective[]>>;
  bossCounters: BossObjectiveCounters;
  setBossCounters: React.Dispatch<React.SetStateAction<BossObjectiveCounters>>;
  bossCountersRef: React.MutableRefObject<BossObjectiveCounters>;
  loginStreakCount: number;
  loginStreakReward: number;
  dailyChallenges: DailyChallenge[];
  setDailyChallenges: React.Dispatch<React.SetStateAction<DailyChallenge[]>>;
  weeklyTasks: WeeklyTask[];
  setWeeklyTasks: React.Dispatch<React.SetStateAction<WeeklyTask[]>>;
  shouldShowRewardsAfterGame: boolean;
  setShouldShowRewardsAfterGame: React.Dispatch<React.SetStateAction<boolean>>;
  shouldShowRewardsOnLogin: boolean;
  setShouldShowRewardsOnLogin: React.Dispatch<React.SetStateAction<boolean>>;
  gameOverProgress: number;
  setGameOverProgress: React.Dispatch<React.SetStateAction<number>>;
  dailyComplete: boolean;
  rewardsBadgeCount: number;
  loginClaimedToday: boolean;
  updateChallengeProgress: (p1Score: number, tick: number) => void;
  handleLoginStreakClaim: () => void;
  handleChallengeClaim: (challengeId: string, reward: number) => void;
  checkTop10Achievement: (initials: string, mode: string) => void;
  handleClaimWeekly: (taskId: string, reward: number) => void;
  processDailyObjectives: (p1Score: number) => void;
}

export function useDailyProgress(opts: DailyProgressOptions): DailyProgressReturn {
  const { addDust, getFirebase, setToast, toastRef, snapshotRef, peakStreakRef } = opts;

  const [dailyComplete, setDailyComplete] = useState(false);
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>(() => getDailyObjectives());
  const [bossCounters, setBossCounters] = useState<BossObjectiveCounters>({ bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 });
  const bossCountersRef = useRef(bossCounters);
  useEffect(() => { bossCountersRef.current = bossCounters; }, [bossCounters]);

  const [loginStreakCount, setLoginStreakCount] = useState(1);
  const [loginStreakReward, setLoginStreakReward] = useState(50);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [shouldShowRewardsAfterGame, setShouldShowRewardsAfterGame] = useState(false);
  const [shouldShowRewardsOnLogin, setShouldShowRewardsOnLogin] = useState(false);
  const [gameOverProgress, setGameOverProgress] = useState(0);

  // Login streak + daily challenge init
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const claimed = localStorage.getItem('dtp-login-claimed');
    const alreadyClaimed = claimed === todayStr;
    const streak = getObjectiveStreak();
    const reward = getStreakReward(streak);
    setLoginStreakCount(streak);
    setLoginStreakReward(reward);

    if (!alreadyClaimed && streak > 0) {
      setShouldShowRewardsOnLogin(true);
    }

    const todayISO = new Date().toISOString().slice(0, 10);
    setDailyChallenges(buildDailyChallenges(todayISO));

    getFirebase().then(fb => {
      fb.fbGetStreak({ clientDate: todayISO }).then(fbStreak => {
        const safeStreak = typeof fbStreak === 'number' && isFinite(fbStreak) ? fbStreak : streak;
        setLoginStreakCount(safeStreak);
        try {
          localStorage.setItem("dtp_login_streak", JSON.stringify({
            count: safeStreak,
            lastDate: new Date().toDateString()
          }));
        } catch {}
      }).catch(e => logger.warn('Firebase streak fetch failed', e));
    }).catch(e => logger.warn('Firebase init failed', e));

    if (localStorage.getItem('dtp-show-rewards-after-first-game') === '1') {
      // This is handled by the caller after game over
    }
  }, [getFirebase]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const updateChallengeProgress = useCallback((p1Score: number, tick: number) => {
    const PROGRESS_KEY = `dtp-challenge-progress-${todayStr}`;
    let progress: Record<string, number> = {};
    try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}'); } catch {}

    progress['play3'] = (progress['play3'] ?? 0) + 1;
    if (p1Score >= 50) progress['score50'] = p1Score;
    if (tick >= 60) progress['survive60'] = tick;
    const ps = peakStreakRef.current ?? 0;
    if (ps >= 5) progress['streak5'] = ps;

    safeSet(PROGRESS_KEY, JSON.stringify(progress));
    setDailyChallenges(buildDailyChallenges(todayStr));

    // Weekly task progress (UTC)
    const now2 = new Date();
    const utcDay2 = now2.getUTCDay();
    const weekStart2 = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() - utcDay2));
    const weekKey2 = weekStart2.toISOString().slice(0, 10);
    const WEEKLY_PROGRESS_KEY2 = `dtp-weekly-progress-${weekKey2}`;
    let weeklyProgress: Record<string, number> = {};
    try { weeklyProgress = JSON.parse(localStorage.getItem(WEEKLY_PROGRESS_KEY2) ?? '{}'); } catch {}
    weeklyProgress['play10'] = (weeklyProgress['play10'] ?? 0) + 1;
    if (p1Score >= 100) weeklyProgress['score100'] = (weeklyProgress['score100'] ?? 0) + 1;
    const modesKey = `dtp-weekly-modes-${weekKey2}`;
    const modesPlayed = new Set<string>(JSON.parse(localStorage.getItem(modesKey) ?? '[]'));
    modesPlayed.add('evolve'); // Default, overridden by caller
    safeSet(modesKey, JSON.stringify([...modesPlayed]));
    weeklyProgress['bothmode'] = modesPlayed.size;
    safeSet(WEEKLY_PROGRESS_KEY2, JSON.stringify(weeklyProgress));
    setWeeklyTasks(buildWeeklyTasks());
  }, [todayStr, peakStreakRef]);

  const handleLoginStreakClaim = useCallback(() => {
    const todayStr = new Date().toDateString();
    safeSet('dtp-login-claimed', todayStr);
    addDust(loginStreakReward, 'LoginStreak');
    setShouldShowRewardsOnLogin(false);
  }, [loginStreakReward, addDust]);

  const handleChallengeClaim = useCallback((challengeId: string, reward: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const CHALLENGES_KEY = `dtp-challenges-${todayStr}`;
    const claimed: string[] = safeGetJSON(CHALLENGES_KEY, []);
    if (claimed.includes(challengeId)) return;
    claimed.push(challengeId);
    safeSet(CHALLENGES_KEY, JSON.stringify(claimed));
    addDust(isNaN(reward) ? 0 : reward, 'DailyChallenge');
    setDailyChallenges(buildDailyChallenges(todayStr));
  }, [addDust]);

  const checkTop10Achievement = useCallback((_initials: string, _mode: string) => {
    try {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay));
      const weekKey = weekStart.toISOString().slice(0, 10);
      const WPK = `dtp-weekly-progress-${weekKey}`;
      const wp: Record<string, number> = safeGetJSON(WPK, {});
      wp['top10'] = (wp['top10'] ?? 0) + 1;
      safeSet(WPK, JSON.stringify(wp));
      setWeeklyTasks(buildWeeklyTasks());
    } catch {}
  }, []);

  const handleClaimWeekly = useCallback((taskId: string, reward: number) => {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay));
    const weekKey = weekStart.toISOString().slice(0, 10);
    const WEEKLY_CLAIMED_KEY = `dtp-weekly-claimed-${weekKey}`;
    const claimed: string[] = safeGetJSON(WEEKLY_CLAIMED_KEY, []);
    if (claimed.includes(taskId)) return;
    claimed.push(taskId);
    safeSet(WEEKLY_CLAIMED_KEY, JSON.stringify(claimed));
    addDust(isNaN(reward) ? 0 : reward, 'WeeklyTask');
    setWeeklyTasks(buildWeeklyTasks());
  }, [addDust]);

  const processDailyObjectives = useCallback((p1Score: number) => {
    const objs = getDailyObjectives();
    const spd = snapshotRef.current ? speedLabel(snapshotRef.current.tick, false) : "1.0×";
    const finalStreak = peakStreakRef.current ?? 0;
    const progress = objs.length > 0 ? getObjectiveProgress(objs[0], snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current) : 0;
    setGameOverProgress(progress);

    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      if (!obj.completed) {
        if (checkObjective(obj, snapshotRef.current?.tick ?? 0, finalStreak, p1Score, spd, bossCountersRef.current)) {
          const completed = markObjectiveComplete(i);
          if (completed) {
            setDailyObjectives(prev => prev.map((o, idx) => idx === i ? completed : o));
            const safeReward = isNaN(completed.reward) ? 0 : completed.reward;
            addDust(safeReward, 'DailyObjective');
            setTimeout(() => {
              setToast(`🎯 Daily Complete! +${completed.reward} 💜`);
              if (toastRef.current) clearTimeout(toastRef.current);
              toastRef.current = setTimeout(() => setToast(null), 3500);
              safeSentry.addBreadcrumb({
                category: "economy",
                message: "daily_complete",
                level: "info",
                data: { reward: completed.reward, objective: obj.type },
              });
              getFirebase().then(fb => fb.fbLogEvent("daily_complete", { reward: completed.reward, objective: obj.type })).catch(e => logger.warn('Firebase operation failed', e));
            }, 800);
          }
        }
      }
    }
  }, [addDust, getFirebase, setToast, toastRef, snapshotRef, peakStreakRef]);

  // Daily complete check
  useEffect(() => {
    try {
      const daily = JSON.parse(localStorage.getItem('dtp:daily') || '{}');
      if (daily && daily.date === todayStr && daily.allComplete) setDailyComplete(true);
    } catch {}
    const handle = (e: Event) => { if ((e as CustomEvent).detail?.date === todayStr) setDailyComplete(true); };
    window.addEventListener('dtp:daily-complete', handle);
    return () => window.removeEventListener('dtp:daily-complete', handle);
  }, [todayStr]);

  const loginClaimedToday = localStorage.getItem('dtp-login-claimed') === todayStr;
  const rewardsBadgeCount = countUnclaimedRewards(loginClaimedToday, dailyChallenges, weeklyTasks);

  return {
    dailyObjectives, setDailyObjectives,
    bossCounters, setBossCounters, bossCountersRef,
    loginStreakCount, loginStreakReward,
    dailyChallenges, setDailyChallenges,
    weeklyTasks, setWeeklyTasks,
    shouldShowRewardsAfterGame, setShouldShowRewardsAfterGame,
    shouldShowRewardsOnLogin, setShouldShowRewardsOnLogin,
    gameOverProgress, setGameOverProgress,
    dailyComplete,
    rewardsBadgeCount, loginClaimedToday,
    updateChallengeProgress,
    handleLoginStreakClaim,
    handleChallengeClaim,
    checkTop10Achievement,
    handleClaimWeekly,
    processDailyObjectives,
  };
}
