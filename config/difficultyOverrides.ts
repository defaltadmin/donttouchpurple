import { DIFFICULTY } from "./difficulty";

// In-memory live overrides (plain object, no React)
export const difficultyOverrides: Partial<typeof DIFFICULTY> = {};

export function applyOverride(key: keyof typeof DIFFICULTY, value: number) {
  (difficultyOverrides as any)[key] = value;
}

export function clearOverrides() {
  Object.keys(difficultyOverrides).forEach(k => delete (difficultyOverrides as any)[k]);
}
