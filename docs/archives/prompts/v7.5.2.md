# Claude Code — DTP v7.5.2 Bug Fix Batch
# Run from repo root. Five confirmed bugs, ordered by impact.
# Verify with: pnpm typecheck && pnpm lint && pnpm build

---

## Pre-flight

```bash
git pull origin main   # ensure you're on latest (post-bcdf0cd)
```

---

## Fix 1 — TickProcessor.ts: Remove duplicate bot block (CRITICAL — dust double-spend)

**File:** `engine/subsystems/TickProcessor.ts`

Two independent bot execution paths run simultaneously:
- `BotController` (setInterval) → delay → `handleTap` → `_processTap` — **authoritative**
- `TickProcessor` bot block — fires on every tick, spends dust a second time on the same cells

Both use the same `dustCallbacks.spendDust` function. Result: every bot tap costs 2× dust.

Find and **delete the entire "// Bot Assist" block** inside `processTick()`. It starts with:
```ts
    // Bot Assist
    const botCfg = ctx.config.botAssist;
    if (botCfg) {
```
and ends with the closing `}` of that `if (botCfg)` block (approximately 45 lines).

Do NOT delete anything else. The cell lifecycle loop above it and the cell shuffle/boss/bomb block below it must remain intact.

After deletion: `BotController` is the sole bot execution path. It already handles dust checks, accuracy, delays, `handleTap`, score updates, and stage progress.

---

## Fix 2 — GameEngine.ts: Fix emitSnapshot dirty-flag race (HIGH — lost UI frames)

**File:** `engine/GameEngine.ts`

Find:
```ts
  private emitSnapshot(): void {
    this.dirty = false;
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
  }
```

Replace with:
```ts
  private emitSnapshot(): void {
    this.emit({ type: "tick", snapshot: this.getSnapshot() });
    this.dirty = false;
  }
```

**Why:** If any event listener sets `dirty = true` during `emit()` (e.g. a tap event fires mid-emit), the RAF loop reads `dirty = false` and skips the next frame. Setting it after the emit guarantees late writes are preserved.

---

## Fix 3 — GameEngine.ts: Clone cells array in getSnapshot (MEDIUM-HIGH — React.memo miss)

**File:** `engine/GameEngine.ts`

Find the return statement in `getSnapshot()` — the lines that build p1 and p2:
```ts
      p1:         { ...this.p1, active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
```

Replace with:
```ts
      p1:         { ...this.p1, cells: [...this.p1.cells], active: cloneActive(this.p1.active), anim: { ...this.p1.anim } },
      p2:         { ...this.p2, cells: [...this.p2.cells], active: cloneActive(this.p2.active), anim: { ...this.p2.anim } },
```

**Why:** `...this.p1` spreads the `cells: CellType[]` array by reference. Consecutive snapshots share the same array object. `React.memo` sees `snap.p1.cells === prev.p1.cells` and skips re-renders even when cell contents changed. The explicit `[...this.p1.cells]` spread creates a new reference each snapshot.

---

## Fix 4 — GameEngine.ts: Fix safeReset powerup/state bleed (HIGH — carryover between games)

**File:** `engine/GameEngine.ts`

Find the `safeReset` method body. It currently manually resets only `health`, `score`, `streak`, `active`. The following are NOT reset and bleed into the next game: `anim`, `shield`, `shieldCount`, `freezeEnd`, `multiplierEnd`, `gridStage`, `stageProgress`, `patternIdx`, `cells`, `storedFreezeCharges`, `storedShieldCharges`, `alive`.

Replace the manual p1/p2 reset lines:
```ts
    this.p1.health = GAME.MAX_HEARTS;
    this.p1.score = 0;
    this.p1.streak = 0;
    this.p1.active = [];
    this.p2.health = GAME.MAX_HEARTS;
    this.p2.score = 0;
    this.p2.streak = 0;
    this.p2.active = [];
```

With a full reset via `makePS()`:
```ts
    const storedForReset = {
      freeze: this.p1.storedFreezeCharges ?? 0,
      shield: this.p1.storedShieldCharges ?? 0,
      mult: 0,
      heart: 0,
    };
    this.p1 = makePS(0, false, storedForReset);
    this.p2 = makePS(0, false, storedForReset);
```

`makePS` is already defined at the top of `GameEngine.ts` and sets all fields correctly.

**Note:** `safeReset` is only called internally (not from React). The stored charges are preserved from the current state before the reset, which is the correct behavior — stored powerups should survive a restart.

---

## Fix 5 — GameEngine.ts: Add _isDisposed guard to public entry points (MEDIUM — post-unmount writes)

**File:** `engine/GameEngine.ts`

Add `if (this._isDisposed) return;` as the first line of these public methods:

```ts
handleTap(player: 1 | 2, idx: number): void {
  if (this._isDisposed) return;
  // ... existing code
}

handleHoldStart(player: 1 | 2, idx: number): void {
  if (this._isDisposed) return;
  // ... existing code
}

handleHoldEnd(player: 1 | 2, idx: number): void {
  if (this._isDisposed) return;
  // ... existing code
}

activateStoredFreeze(player: 1 | 2): void {
  if (this._isDisposed) return;
  // ... existing code
}

activateStoredShield(player: 1 | 2): void {
  if (this._isDisposed) return;
  // ... existing code
}

submitScoreToLeaderboard(score: number): void {
  if (this._isDisposed) return;
  // ... existing code
}

async generateScoreCard(score: number): Promise<string> {
  if (this._isDisposed) return '';
  // ... existing code
}
```

`start()` already has this guard. Add it consistently to all public methods that write state.

---

## Verification

```bash
pnpm typecheck   # zero errors required
pnpm lint        # zero new errors
pnpm build       # confirm bundle builds
```

Bot assist: manually test in-game — enable bot in Evolve mode, watch dust counter.
With the fix: each cell tap costs **3 dust once**.
Before the fix: each cell tap cost **3 dust twice** (6 dust per tap).

---

## Version + Changelog

```bash
npm version patch   # 7.5.1 → 7.5.2
```

Prepend to `CHANGELOG.md`:

```markdown
## [7.5.2] — 2026-05-16

### Fixed
- **CRITICAL — `engine/subsystems/TickProcessor.ts`:** Removed duplicate bot execution
  block. Two independent bot paths (`BotController` setInterval + `TickProcessor` tick
  loop) were both spending dust via the same `dustCallbacks.spendDust` callback on every
  bot tap, resulting in 2× dust drain. `BotController` is now the sole authoritative path.
- **HIGH — `engine/GameEngine.ts` `emitSnapshot()`:** `dirty = false` was set *before*
  `emit()`, creating a race where listener-triggered state changes during emit were silently
  dropped by the RAF loop. Flag now set after emit.
- **HIGH — `engine/GameEngine.ts` `getSnapshot()`:** `...this.p1` spread leaked the
  `cells: CellType[]` array by reference into snapshots. Consecutive snapshots shared the
  same array object, causing `React.memo` to skip re-renders when cell contents changed.
  Added explicit `cells: [...this.p1.cells]` clone.
- **HIGH — `engine/GameEngine.ts` `safeReset()`:** Only 4 of 14 `PlayerState` fields were
  reset. `shield`, `shieldCount`, `freezeEnd`, `multiplierEnd`, `gridStage`, `stageProgress`,
  `patternIdx`, `cells`, `anim`, `storedFreezeCharges`, `storedShieldCharges`, and `alive`
  were carried over into the next game. Replaced manual resets with `makePS()` factory.
- **MEDIUM — `engine/GameEngine.ts`:** Added `_isDisposed` guard to all public entry-point
  methods (`handleTap`, `handleHoldStart/End`, `activateStoredFreeze/Shield`,
  `submitScoreToLeaderboard`, `generateScoreCard`) to prevent post-unmount state writes.
```

---

## Error Log Status Update

Issues resolved as of v7.5.2:

| Issue | Description | Status |
|-------|-------------|--------|
| #1 | CI YAML template literal | ✅ Was already fixed in v7.5.0 |
| #2 | (fixed earlier) | ✅ |
| #3 | snapshotRef null guards | ✅ False positive — already guarded |
| #4 | scoreSubmittedRef never reset | ✅ False positive — reset in startGame/tutorial |
| #7,8,10,11,12 | (fixed in v7.5.0) | ✅ |
| #13 | Dual bot path / dust double-spend | ✅ Fixed in v7.5.2 |
| #14 | safeReset state bleed | ✅ Fixed in v7.5.2 |
| #16 | RNG desync after session restore | 🔴 Deferred — needs rngCallCount in snapshot |
| #33 | dirty-flag race in emitSnapshot | ✅ Fixed in v7.5.2 |
| #34 | _isDisposed missing on public methods | ✅ Fixed in v7.5.2 |
| #40 | App.tsx monolith | 🟡 Tech debt — deferred |
| #59 | cells array reference leak | ✅ Fixed in v7.5.2 |
| #61 | Incomplete dep array | 🟡 Mostly false positive — 2 deps minor |
```
