import { useState, useCallback } from "react";
import type { WeeklyTask } from "../components/Screens/WeeklyTasksPopup";

function safeGetJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return start.toISOString().slice(0, 10);
}

export function useWeeklyTasks(
  playerName: string,
  lbMode: "classic" | "evolve",
  best1: number,
  best2: number,
  addDust: (amount: number, source: string) => number
) {
  const WPK = `dtp-weekly-progress-${getWeekKey()}`;
  const WCK = `dtp-weekly-claimed-${getWeekKey()}`;

  const buildWeeklyTasks = useCallback((): WeeklyTask[] => {
    const progress: Record<string, number> = safeGetJSON(WPK, {});
    const claimed:  string[]               = safeGetJSON(WCK, []);

    const best = lbMode === "classic" ? best1 : best2;

    const taskDefs = [
      { id: "play5",     label: "Play 5 games",          target: 5,    reward: 50,  progress: progress["play5"]     ?? 0 },
      { id: "score100",  label: "Score 100+ in one game",target: 100,  reward: 75,  progress: progress["score100"]  ?? 0 },
      { id: "streak10",  label: "Reach a 10-tap streak", target: 10,   reward: 60,  progress: progress["streak10"]  ?? 0 },
      { id: "top10",     label: "Reach the top 10",      target: 1,    reward: 100, progress: progress["top10"]     ?? 0 },
      { id: "dust200",   label: "Earn 200 dust",         target: 200,  reward: 40,  progress: progress["dust200"]   ?? 0 },
    ];

    return taskDefs.map(t => ({
      ...t,
      completed: t.progress >= t.target,
      claimed:   claimed.includes(t.id),
    }));
  }, [WPK, WCK, lbMode, best1, best2]);

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => buildWeeklyTasks());

  const refreshWeeklyTasks = useCallback(() => {
    setWeeklyTasks(buildWeeklyTasks());
  }, [buildWeeklyTasks]);

  const updateWeeklyProgress = useCallback((
    p1Score: number,
    peakStreak: number,
    dustEarned: number,
    gamesPlayedNew: number
  ) => {
    const wk = getWeekKey();
    const key = `dtp-weekly-progress-${wk}`;
    const wp: Record<string, number> = safeGetJSON(key, {});

    wp["play5"]    = (wp["play5"]    ?? 0) + 1;
    wp["dust200"]  = (wp["dust200"]  ?? 0) + dustEarned;
    if (p1Score >= 100)    wp["score100"]  = Math.max(wp["score100"] ?? 0, p1Score);
    if (peakStreak >= 10)  wp["streak10"]  = Math.max(wp["streak10"] ?? 0, peakStreak);

    safeSet(key, JSON.stringify(wp));
    setWeeklyTasks(buildWeeklyTasks());
  }, [buildWeeklyTasks]);

  const handleClaimWeekly = useCallback((taskId: string, reward: number) => {
    const wk = getWeekKey();
    const key = `dtp-weekly-claimed-${wk}`;
    const claimed: string[] = safeGetJSON(key, []);
    claimed.push(taskId);
    safeSet(key, JSON.stringify(claimed));
    addDust(reward, "WeeklyTask");
    setWeeklyTasks(buildWeeklyTasks());
  }, [addDust, buildWeeklyTasks]);

  const checkTop10Achievement = useCallback((
    entries: { score: number; initials: string }[]
  ) => {
    const wk  = getWeekKey();
    const key = `dtp-weekly-progress-${wk}`;
    const wp: Record<string, number> = safeGetJSON(key, {});
    const best = lbMode === "classic" ? best1 : best2;
    const inTop10 = entries
      .slice(0, 10)
      .some(e => e.initials === playerName && e.score >= best);
    if (!inTop10) return;
    if ((wp["top10"] ?? 0) < 1) {
      wp["top10"] = 1;
      safeSet(key, JSON.stringify(wp));
      setWeeklyTasks(buildWeeklyTasks());
    }
  }, [lbMode, best1, best2, playerName, buildWeeklyTasks]);

  return {
    weeklyTasks,
    refreshWeeklyTasks,
    updateWeeklyProgress,
    handleClaimWeekly,
    checkTop10Achievement,
  };
}
