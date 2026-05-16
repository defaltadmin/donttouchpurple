# Claude Code — DTP v7.5.1 Follow-up Fixes
# Run from repo root. Three targeted fixes only — do not touch other files.

---

## Context

v7.5.0 (commit bcdf0cd) is clean. Three remaining issues identified in post-commit review:

1. `GameEvent` union in `engine/types.ts` is missing bot event types → forces `as any` cast at `GameEngine.ts:189`
2. `GameEngine` class references `this._currentThemeId` but the field is never declared → `as any` cast at `GameEngine.ts:752`
3. `App.tsx` imports `LoginStreakPopup`, `getStreakReward`, and `DailyChallengesPopup` but they're unused (RewardsHub handles them now) → lint warnings

---

## Fix 1 — engine/types.ts: Add missing bot events to GameEvent union

File: `engine/types.ts`

Find the `GameEvent` type (or union). It currently does NOT include these event types:
- `botTap` — emitted by BotController when it taps a cell
- `dustConsumed` — emitted by BotController when it spends dust
- `qualityDowngrade` — emitted by GameEngine when FPS drops below threshold
- `qualityUpgrade` — emitted by GameEngine when FPS recovers
- `bombDefused` — emitted when a bomb cell is defused

Add them to the union. The shapes to add:

```ts
| { type: "botTap";        player: 1 | 2; idx: number; dustCost: number }
| { type: "dustConsumed";  amount: number }
| { type: "qualityDowngrade"; reason: string; avgFps: number }
| { type: "qualityUpgrade";   avgFps: number }
| { type: "bombDefused";   player: 1 | 2 }
```

After adding these, check `GameEngine.ts:189`:
```ts
emit: (event) => this.emit(event as any),
```
The `as any` should now be removable. Change to:
```ts
emit: (event) => this.emit(event),
```

Run `pnpm typecheck` to confirm the cast is no longer needed. If it still errors, investigate what event type BotController emits that isn't covered and add it.

---

## Fix 2 — engine/GameEngine.ts: Declare missing _currentThemeId field

File: `engine/GameEngine.ts`

Find the private field declarations block near the top of the `GameEngine` class (around where `devGodMode`, `devMode`, `skipParticles` etc. are declared).

Add this field:
```ts
private _currentThemeId = 'default';
```

Then find line ~752 where it's used:
```ts
}, { theme: (this as any)._currentThemeId, difficulty: this.config.mode });
```

Remove the cast:
```ts
}, { theme: this._currentThemeId, difficulty: this.config.mode });
```

Note: The field is referenced in `startSessionPersistence` but never set anywhere in the current code. That's intentional for now — it's a placeholder for theme-aware session tracking. The field defaults to `'default'` which is correct.

---

## Fix 3 — App.tsx: Remove unused imports

File: `App.tsx`

Find and delete these three import lines entirely:

```ts
import LoginStreakPopup, { getStreakReward } from "./components/Screens/LoginStreakPopup";
import DailyChallengesPopup, { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
```

**IMPORTANT**: Before deleting, do a global search for each identifier:
- `LoginStreakPopup` — confirm it is NOT used in JSX anywhere in App.tsx
- `getStreakReward` — confirm not called anywhere in App.tsx
- `DailyChallengesPopup` — confirm not used in JSX
- `DailyChallenge` — this type MAY be used elsewhere in App.tsx (check `useState<DailyChallenge[]>`)

If `DailyChallenge` type IS used in App.tsx state declarations, keep that type import but remove the component:
```ts
// If DailyChallenge type is used in state:
import { type DailyChallenge } from "./components/Screens/DailyChallengesPopup";
// Delete: import DailyChallengesPopup, ...
```

If `DailyChallenge` is not referenced at all, delete the entire line.

---

## Verification

```bash
pnpm typecheck   # must be zero errors
pnpm lint        # warnings allowed, zero new errors
```

Expected reduction:
- `as any` count in GameEngine.ts: 10 → 8 (lines 189 and 752 cleaned)
- Lint warnings in App.tsx: LoginStreakPopup/DailyChallengesPopup warnings removed

---

## Version bump + changelog

```bash
npm version patch   # 7.5.0 → 7.5.1
```

Prepend to `CHANGELOG.md`:

```markdown
## [7.5.1] — 2026-05-16

### Fixed
- **Types:** `engine/types.ts` — Added `botTap`, `dustConsumed`, `qualityDowngrade`,
  `qualityUpgrade`, and `bombDefused` to the `GameEvent` union; eliminates `as any` cast
  in `GameEngine`'s `BotController` callback (`GameEngine.ts:189`).
- **Types:** `engine/GameEngine.ts` — Declared missing `private _currentThemeId = 'default'`
  field; eliminates `as any` cast at session persistence call (`GameEngine.ts:752`).
- **Lint:** `App.tsx` — Removed unused imports: `LoginStreakPopup`, `getStreakReward`, and
  `DailyChallengesPopup` (superseded by `RewardsHub`).
```
