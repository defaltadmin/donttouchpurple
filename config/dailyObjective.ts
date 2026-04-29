export interface DailyObjective {
  type: 'score' | 'tick' | 'streak' | 'speed';
  target: number;
  reward: number;
  description: string;
  completed: boolean;
  date: string;
}

const OBJECTIVE_POOL: Array<Omit<DailyObjective, 'completed' | 'date'>> = [
  { type: 'score',   target: 80,  reward: 25,  description: 'Score 80+ in one game' },
  { type: 'score',   target: 120, reward: 35,  description: 'Score 120+' },
  { type: 'score',   target: 200, reward: 50,  description: 'Score 200+' },
  { type: 'tick',    target: 60,  reward: 20,  description: 'Survive to tick 60' },
  { type: 'tick',    target: 100, reward: 30,  description: 'Survive to tick 100' },
  { type: 'streak',  target: 10,  reward: 25,  description: 'Reach 10 streak' },
  { type: 'streak',  target: 20,  reward: 35,  description: 'Reach 20 streak' },
  { type: 'speed',   target: 2.0, reward: 30,  description: "Reach 2.0× speed" },
  { type: 'speed',   target: 3.0, reward: 40,  description: "Reach 3.0× speed" },
];

function dailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function loadCompletedDates(): string[] {
  try {
    const raw = localStorage.getItem('dtp-daily-completed');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDailyObjective(dateStr?: string): DailyObjective {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  const seed = dailySeed(today);
  const poolIndex = seed % OBJECTIVE_POOL.length;
  const objective = OBJECTIVE_POOL[poolIndex];
  
  const completedDates = loadCompletedDates();
  return {
    ...objective,
    completed: completedDates.includes(today),
    date: today,
  };
}

export function checkObjective(
  objective: DailyObjective,
  tick: number,
  streak: number,
  score: number,
  speedLabel: string
): boolean {
  if (objective.completed) return false;
  
  const speed = parseFloat(speedLabel);
  switch (objective.type) {
    case 'score':   return score >= objective.target;
    case 'tick':    return tick >= objective.target;
    case 'streak':  return streak >= objective.target;
    case 'speed':   return !isNaN(speed) && speed >= objective.target;
    default:        return false;
  }
}

export function markObjectiveComplete(): DailyObjective | null {
  const today = new Date().toISOString().slice(0, 10);
  const completedDates = loadCompletedDates();
  if (completedDates.includes(today)) return null;

  completedDates.push(today);
  localStorage.setItem('dtp-daily-completed', JSON.stringify(completedDates));

  const objective = getDailyObjective(today);
  objective.completed = true;
  return objective;
}
