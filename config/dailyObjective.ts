export interface DailyObjective {
  type: 'score' | 'tick' | 'streak' | 'speed' | 'boss_survive' | 'bomb_defuse' | 'survive_inversion';
  target: number;
  reward: number;
  description: string;
  completed: boolean;
  date: string;
}

const OBJECTIVE_POOL: Array<Omit<DailyObjective, 'completed' | 'date'>> = [
  { type: 'score',            target: 80,  reward: 25,  description: 'Score 80+ in one game' },
  { type: 'score',            target: 120, reward: 35,  description: 'Score 120+' },
  { type: 'score',            target: 200, reward: 50,  description: 'Score 200+' },
  { type: 'tick',             target: 60,  reward: 20,  description: 'Survive to tick 60' },
  { type: 'tick',             target: 100, reward: 30,  description: 'Survive to tick 100' },
  { type: 'streak',           target: 10,  reward: 25,  description: 'Reach 10 streak' },
  { type: 'streak',           target: 20,  reward: 35,  description: 'Reach 20 streak' },
  { type: 'speed',            target: 2.0, reward: 30,  description: 'Reach 2.0× speed' },
  { type: 'speed',            target: 3.0, reward: 40,  description: 'Reach 3.0× speed' },
  { type: 'boss_survive',     target: 1,   reward: 40,  description: 'Survive a Boss Event' },
  { type: 'boss_survive',     target: 2,   reward: 55,  description: 'Survive 2 Boss Events in one game' },
  { type: 'bomb_defuse',      target: 1,   reward: 30,  description: 'Defuse a Bomb 💣' },
  { type: 'bomb_defuse',      target: 3,   reward: 50,  description: 'Defuse 3 Bombs in one game' },
  { type: 'survive_inversion',target: 1,   reward: 45,  description: 'Survive an Inversion event 🔄' },
];

export const DAILY_OBJECTIVE_COUNT = 3;

function dailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface CompletedEntry {
  date: string;
  index: number;
}

function loadCompletedEntries(): CompletedEntry[] {
  try {
    const raw = localStorage.getItem('dtp-daily-completed');
    if (!raw) return [];
    const all: CompletedEntry[] = JSON.parse(raw);
    // Migrate old format (string[]) to new format
    if (all.length > 0 && typeof all[0] === 'string') {
      return [];
    }
    // Keep only the last 7 days to prevent unbounded growth
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return all.filter(e => e.date >= cutoffStr);
  } catch {
    return [];
  }
}

export function getDailyObjective(dateStr?: string): DailyObjective {
  const objectives = getDailyObjectives(dateStr);
  return objectives[0];
}

export function getDailyObjectives(dateStr?: string): DailyObjective[] {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  const seed = dailySeed(today);
  const completedEntries = loadCompletedEntries();

  const results: DailyObjective[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < DAILY_OBJECTIVE_COUNT; i++) {
    // Use different seed offsets to get different objectives
    let poolIndex = (seed + i * 97) % OBJECTIVE_POOL.length;
    // Avoid duplicates
    while (usedIndices.has(poolIndex)) {
      poolIndex = (poolIndex + 1) % OBJECTIVE_POOL.length;
    }
    usedIndices.add(poolIndex);

    const objective = OBJECTIVE_POOL[poolIndex];
    const completed = completedEntries.some(e => e.date === today && e.index === i);
    results.push({
      ...objective,
      completed,
      date: today,
    });
  }

  return results;
}

export interface BossObjectiveCounters {
  bossSurvived: number;
  bombsDefused: number;
  inversionSurvived: number;
}

export function checkObjective(
  objective: DailyObjective,
  tick: number,
  streak: number,
  score: number,
  speedLabel: string,
  counters?: BossObjectiveCounters
): boolean {
  if (objective.completed) return false;
  const speed = parseFloat(speedLabel);
  const c = counters ?? { bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 };
  switch (objective.type) {
    case 'score':             return score >= objective.target;
    case 'tick':              return tick >= objective.target;
    case 'streak':            return streak >= objective.target;
    case 'speed':             return !isNaN(speed) && speed >= objective.target;
    case 'boss_survive':      return c.bossSurvived >= objective.target;
    case 'bomb_defuse':       return c.bombsDefused >= objective.target;
    case 'survive_inversion': return c.inversionSurvived >= objective.target;
    default:                  return false;
  }
}

export function getObjectiveProgress(
  objective: DailyObjective,
  tick: number,
  streak: number,
  score: number,
  speedLabel: string,
  counters?: BossObjectiveCounters
): number {
  if (objective.completed) return 1;
  const speed = parseFloat(speedLabel);
  const c = counters ?? { bossSurvived: 0, bombsDefused: 0, inversionSurvived: 0 };
  let current = 0;
  switch (objective.type) {
    case 'score':             current = score; break;
    case 'tick':              current = tick; break;
    case 'streak':            current = streak; break;
    case 'speed':             current = !isNaN(speed) ? speed : 0; break;
    case 'boss_survive':      current = c.bossSurvived; break;
    case 'bomb_defuse':       current = c.bombsDefused; break;
    case 'survive_inversion': current = c.inversionSurvived; break;
  }
  return Math.min(1, current / (objective.target || 1));
}

export function markObjectiveComplete(index: number = 0): DailyObjective | null {
  const today = new Date().toISOString().slice(0, 10);
  const entries = loadCompletedEntries();
  if (entries.some(e => e.date === today && e.index === index)) return null;

  entries.push({ date: today, index });
  localStorage.setItem('dtp-daily-completed', JSON.stringify(entries));

  incrementObjectiveStreak();

  const objectives = getDailyObjectives(today);
  if (objectives[index]) {
    objectives[index].completed = true;
    return objectives[index];
  }
  return null;
}

export function getObjectiveStreak(): number {
  try {
    const raw = localStorage.getItem('dtp-obj-streak');
    if (!raw) return 0;
    const { count, lastDate } = JSON.parse(raw);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate === today || lastDate === yStr) return count ?? 0;
    return 0;
  } catch { return 0; }
}

export function incrementObjectiveStreak(): void {
  const today = new Date().toISOString().slice(0, 10);
  const current = getObjectiveStreak();
  localStorage.setItem('dtp-obj-streak', JSON.stringify({ count: current + 1, lastDate: today }));
}
