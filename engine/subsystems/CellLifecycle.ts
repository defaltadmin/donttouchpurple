import { GAME } from "../../config/difficulty";
import { STAGES, EVOLVE_PATTERNS } from "../../config/gridPatterns";
import { POWERUP_TABLE } from "../../config/powerupWeights";
import type { ActiveCell, CellType, CellShape } from "../types";

const SAFE: CellType[] = [
  "white","blue","red","orange","yellow",
  "green","cyan","lime","teal","pink","rose","magenta",
];

const TEMP_CELLS: CellType[] = new Array(25).fill("inactive");

export function randCell(rng: () => number, tick = 0, isClassic = false): CellType {
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (rng() < purpleChance) return "purple";
  return SAFE[Math.floor(rng() * SAFE.length)];
}

export function pickCellShape(tick: number): CellShape {
  const cycle = Math.floor(tick / 6) % 8;
  if (cycle === 0) return "square";
  if (cycle === 1) return "triangle";
  if (cycle === 2) return "circle";
  if (cycle === 3) return "roundedTriangle";
  if (cycle === 4) return "mixed";
  if (cycle === 5) return "triangle";
  if (cycle === 6) return "square";
  return "mixed";
}

export function activeToCellsP(
  active: ActiveCell[],
  pattern: { cols: number; rows: number; mask: number[] | null }
): CellType[] {
  for (let i = 0; i < 25; i++) TEMP_CELLS[i] = "inactive";
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) TEMP_CELLS[i] = "void" as CellType;
    }
  }
  active.forEach(c => { if (!c.clicked) TEMP_CELLS[c.idx] = c.type; });
  return TEMP_CELLS.slice();
}

export function spawnActive(
  rng: () => number,
  stage: number,
  health: number,
  patternOverride?: { cols: number; rows: number; mask: number[] | null },
  isEvolve?: boolean,
  rareColor?: string,
  rareShape?: CellShape,
  tick = 0,
  godMode = false
): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length - 1)];
  const { mask } = pat;
  const total = pat.cols * pat.rows;
  const validSlots = mask ? [...mask] : Array.from({ length: total }, (_, i) => i);
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5));
  const count = Math.max(1, minCount + Math.floor(rng() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  let powerup: CellType | null = null;
  const powerupEligible = isEvolve ? stage >= 2 : true;
  let table = POWERUP_TABLE.map(p =>
    p.type === "medpack" && health < GAME.MAX_HEARTS ? { ...p, weight: p.weight + 10 } : p
  );
  if (godMode) table = table.filter(p => p.type !== "medpack");
  const totalWeight = table.reduce((s, p) => s + p.weight, 0);
  const effectiveTotal = powerupEligible ? totalWeight : totalWeight * 0.4;
  if (powerupEligible && totalWeight > 0) {
    const roll = rng() * 100;
    if (roll < effectiveTotal) {
      let cursor = 0;
      for (const p of table) {
        cursor += p.weight;
        if (roll < cursor) { powerup = p.type as CellType; break; }
      }
    }
  }

  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 3) {
    const r = rng();
    if (r < 0.10) evolveSpecial = "ice";
    else if (r < 0.17) evolveSpecial = "hold";
  }

  return idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup } as ActiveCell;
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice", iceCount: 2 + Math.floor(rng() * 3) };
    }
    if (i === 0 && evolveSpecial === "hold") {
      return { idx, clicked: false, type: "hold", holdRequired: 700 + rng() * 500, spawnedAt: Date.now() };
    }
    const baseType = randCell(rng, tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor, shape: rareShape } as ActiveCell;
    return { idx, clicked: false, type: baseType } as ActiveCell;
  });
}

export function pickPattern(rng: () => number, stage: number, lastIdx: number, score: number): number {
  const valid = EVOLVE_PATTERNS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.minStage <= stage)
    .filter(({ p }) => {
      if (score < 20)  return p.cols <= 2 && p.rows <= 2;
      if (score < 50)  return p.cols <= 3 && p.rows <= 3;
      if (score < 120) return p.cols <= 3 && p.rows <= 4;
      if (score < 250) return p.cols <= 4 && p.rows <= 4;
      return true;
    });
  if (valid.length <= 1) return valid[0]?.i ?? 0;
  const filtered = valid.filter(({ i }) => i !== lastIdx);
  const pick = filtered[Math.floor(rng() * filtered.length)];
  return pick?.i ?? valid[0].i;
}
