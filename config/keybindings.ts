// ─── Default key layouts ──────────────────────────────────────────
// P1: Row1: 1 2 3 4 | Row2: q w e r | Row3: a s d f | Row4: z x c v
export const DEFAULT_P1_KEYS: string[] = [
  "1","2","3","4",
  "q","w","e","r",
  "a","s","d","f",
  "z","x","c","v",
];

// P2: Row1: 7 8 9 0 | Row2: u i o p | Row3: j k l ; | Row4: m , . /
export const DEFAULT_P2_KEYS: string[] = [
  "7","8","9","0",
  "u","i","o","p",
  "j","k","l",";",
  "m",",",".","/",
];

// ─── Key → grid cell mapping ──────────────────────────────────────
// Maps physical 4×4 key layout to grid cell index for any grid size.
// Keys are stored as a flat 16-element array (row-major, 4 cols wide).
export function getKeyForCell(
  _player: 1 | 2,
  cellIdx: number,
  cols: number,
  keys: string[]
): string {
  const row = Math.floor(cellIdx / cols);
  const col = cellIdx % cols;
  const keyIdx = row * 4 + col;
  return keys[keyIdx] || "";
}

// Returns the grid cell index for a given key press, or -1 if not found.
export function gridIndexFromKey(
  key: string,
  cols: number,
  rows: number,
  mask: number[] | null,
  keys: string[]
): number {
  const k = key.toLowerCase();
  const validSlots = mask ?? Array.from({ length: cols * rows }, (_, i) => i);
  for (const i of validSlots) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (keys[row * 4 + col] === k) return i;
  }
  return -1;
}

// ─── Key label formatting ─────────────────────────────────────────
export function toLabel(k: string): string {
  if (!k) return "?";
  if (/^[a-z]$/.test(k)) return k.toUpperCase();
  const m: Record<string, string> = {
    " ": "SPC", escape: "ESC", backspace: "⌫",
    enter: "↵", tab: "↹", ",": ",",
  };
  return m[k] ?? (k.length === 1 ? k : k.slice(0, 3).toUpperCase());
}

// ─── localStorage helpers for key persistence ─────────────────────
export function loadKeys(lsKey: string, def: string[]): string[] {
  try {
    const r = localStorage.getItem(lsKey);
    if (r) {
      const p = JSON.parse(r);
      if (Array.isArray(p) && p.length === 16) return p;
    }
  } catch (_) {}
  return [...def];
}

export function saveKeys(lsKey: string, val: string[]): void {
  try { localStorage.setItem(lsKey, JSON.stringify(val)); } catch (_) {}
}
