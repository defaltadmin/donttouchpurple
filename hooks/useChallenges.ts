import { useState, useCallback, useEffect } from "react";
import { buildDailyChallenges, buildWeeklyTasks, type DailyChallenge, type WeeklyTask } from "../utils/rewards";

export function useChallenges(gamesPlayed: number) {
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);

  const refresh = useCallback(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setDailyChallenges(buildDailyChallenges(todayStr));
    setWeeklyTasks(buildWeeklyTasks());
  }, []);

  useEffect(() => {
    refresh();
  }, [gamesPlayed, refresh]);

  return { dailyChallenges, setDailyChallenges, weeklyTasks, setWeeklyTasks, refresh };
}
