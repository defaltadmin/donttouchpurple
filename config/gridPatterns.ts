// ─── Grid stage definitions ───────────────────────────────────────
export interface GridStage {
  cols:  number;
  rows:  number;
  total: number;
  name:  string;
  mask:  number[] | null;
}

export const STAGES: GridStage[] = [
  // Stage 0 — 2×2 square (4 cells)
  { cols: 2, rows: 2, total: 4,  name: "Spark",   mask: null },
  // Stage 1 — Plus / cross in 3×3 (5 active)
  { cols: 3, rows: 3, total: 9,  name: "Cross",   mask: [1,3,4,5,7] },
  // Stage 2 — 3×3 full square (9 cells)
  { cols: 3, rows: 3, total: 9,  name: "Grid",    mask: null },
  // Stage 3 — Diamond in 4×4 (8 active)
  { cols: 4, rows: 4, total: 16, name: "Diamond", mask: [1,2,4,7,8,11,13,14] },
  // Stage 4 — 4×3 full (12 cells)
  { cols: 4, rows: 3, total: 12, name: "Block",   mask: null },
  // Stage 5 — Ring / hollow 4×4 (12 border cells)
  { cols: 4, rows: 4, total: 16, name: "Ring",    mask: [0,1,2,3,4,7,8,11,12,13,14,15] },
  // Stage 6 — L-shape in 3×4 (9 active)
  { cols: 3, rows: 4, total: 12, name: "Spiral",  mask: [0,1,2,5,8,9,10,11,7] },
  // Stage 7 — 4×4 full (16 cells)
  { cols: 4, rows: 4, total: 16, name: "Chaos",   mask: null },
  // Stage 8 — X shape in 5×5 (9 active)
  { cols: 5, rows: 5, total: 25, name: "X-Ray",   mask: [0,4,6,8,12,16,18,20,24] },
  // Stage 9 — 5×5 full (25 cells)
  { cols: 5, rows: 5, total: 25, name: "APEX",    mask: null },
];

// ─── Evolve pattern library (25 patterns) ────────────────────────
export interface EvolvePattern {
  cols:     number;
  rows:     number;
  mask:     number[] | null;
  minStage: number;
}

export const EVOLVE_PATTERNS: EvolvePattern[] = [
  // 2×2
  { cols:2, rows:2, mask: null, minStage: 0 },
  // 3×3 shapes
  { cols:3, rows:3, mask:[1,3,4,5,7], minStage:1 },
  { cols:3, rows:3, mask:null, minStage:1 },
  { cols:3, rows:3, mask:[0,2,4,6,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,3,5,6,7,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,5,7,8], minStage:1 },
  { cols:3, rows:3, mask:[1,3,5,7], minStage:1 },
  { cols:3, rows:3, mask:[0,2,3,5,6,8], minStage:1 },
  { cols:3, rows:3, mask:[0,1,2,4,6,7,8], minStage:1 },
  // 4×4 shapes
  { cols:4, rows:4, mask:[1,2,4,7,8,11,13,14], minStage:3 },
  { cols:4, rows:4, mask:null, minStage:3 },
  { cols:4, rows:4, mask:[0,1,2,3,4,7,8,11,12,13,14,15], minStage:3 },
  { cols:4, rows:4, mask:[0,3,5,6,9,10,12,15], minStage:3 },
  { cols:4, rows:4, mask:[0,1,2,4,5,8,9,12,13,14], minStage:3 },
  { cols:4, rows:4, mask:[0,1,4,5,10,11,14,15], minStage:3 },
  { cols:4, rows:4, mask:[1,2,4,6,7,9,11,13,14], minStage:3 },
  { cols:4, rows:3, mask:null, minStage:3 },
  // 5×5 shapes
  { cols:5, rows:5, mask:[0,4,6,8,12,16,18,20,24], minStage:7 },
  { cols:5, rows:5, mask:null, minStage:7 },
  { cols:5, rows:5, mask:[2,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,22], minStage:7 },
  { cols:5, rows:5, mask:[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24], minStage:7 },
  { cols:5, rows:5, mask:[0,2,4,6,8,10,12,14,16,18,20,22,24], minStage:7 },
  { cols:5, rows:5, mask:[0,1,4,5,6,7,8,9,10,12,14,15,16,17,18,19,20,23,24], minStage:7 },
  // Mixed
  { cols:3, rows:4, mask:[0,1,2,5,8,9,10,11,7], minStage:2 },
  { cols:3, rows:4, mask:[0,2,3,5,6,8,9,11], minStage:2 },
];

// ─── Rare color mode table ────────────────────────────────────────
export interface RareColorDef {
  color:    string;
  cssColor: string;
  bg:       string;
}

export const RARE_COLORS: RareColorDef[] = [
  { color: "red",    cssColor: "#ef4444", bg: "radial-gradient(circle at 20% 20%, #4a1010 0%, #1a0404 55%)" },
  { color: "blue",   cssColor: "#3b82f6", bg: "radial-gradient(circle at 20% 20%, #0f1a4a 0%, #04071a 55%)" },
  { color: "green",  cssColor: "#22c55e", bg: "radial-gradient(circle at 20% 20%, #0a3018 0%, #041a0a 55%)" },
  { color: "orange", cssColor: "#f97316", bg: "radial-gradient(circle at 20% 20%, #4a2010 0%, #1a0a04 55%)" },
  { color: "cyan",   cssColor: "#06b6d4", bg: "radial-gradient(circle at 20% 20%, #083040 0%, #020e14 55%)" },
  { color: "pink",   cssColor: "#ec4899", bg: "radial-gradient(circle at 20% 20%, #4a1030 0%, #1a0410 55%)" },
  { color: "yellow", cssColor: "#eab308", bg: "radial-gradient(circle at 20% 20%, #3a3010 0%, #141004 55%)" },
];
