# Don't Touch Purple — Development Guidelines

## Code Quality Standards

### TypeScript
- Strict TypeScript throughout. All types explicitly declared — no implicit `any`.
- Use `type` imports for type-only imports: `import type { GameConfig } from "./types"`.
- Prefer union literal types over enums: `"classic" | "evolve"`, `1 | 2`, `"playing" | "paused" | "gameover"`.
- Use `ReturnType<typeof setTimeout>` instead of `number` for timer IDs.
- Private class fields prefixed with `_` for internal state: `_isDisposed`, `_cachedNow`, `_tickCtx`.
- `readonly` for constants: `private static readonly TAP_BUFFER_MS = GAME.TAP_BUFFER_MS`.
- Optional chaining everywhere for nullable access: `this.bossEvent?.endsAt ?? 0`.
- Nullish coalescing `??` preferred over `||` for default values.

### Naming Conventions
- camelCase for variables, functions, methods, hooks.
- PascalCase for classes, components, types, interfaces.
- SCREAMING_SNAKE_CASE for constants: `GAME`, `LS_KEYS`, `ACHIEVEMENT_DEFS`.
- Prefix private class fields with `_`: `_isDisposed`, `_bossActive`, `_tickCtx`.
- Hook files: `use` prefix, camelCase: `useGameEngine`, `useScreenStateMachine`.
- Event names: `dtp:` namespace for custom DOM events: `dtp:boss:complete`, `dtp:combo`, `dtp:locale-change`.
- localStorage keys: `dtp-` or `dtp:` prefix: `dtp-games-played`, `dtp:wins`.

### File Organization
- One component/class per file.
- Engine files: pure TypeScript, zero React imports.
- Component files: `.tsx` extension.
- Utility files: `.ts` extension.
- Test files: `__tests__/` directory, `*.test.ts` or `*.test.tsx`.

---

## React Patterns

### Hooks
- Extract all complex state into custom hooks. App.tsx delegates to:
  - `useGameEngine` — engine bridge
  - `useScreenStateMachine` — screen transitions
  - `useGameSettings` — audio/haptics/motion settings
  - `useThemeSettings` — theme, colorblind, FPS, fullscreen
  - `useDustEconomy` — dust balance
  - `useUIFlags` — all boolean UI visibility flags
  - `useDevToolsState` — dev mode flags
- Hooks return stable references. Callbacks passed to GameEngine constructor must use `React.useMemo` to prevent engine recreation.

### useCallback / useMemo
- Wrap all callbacks passed as props or to engine with `useCallback`.
- Wrap engine config and dust callbacks with `React.useMemo` — identity stability is critical.
- Comment when deps are intentionally omitted: `// eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotRef is a stable ref`.

### Refs for Synchronous Reads
- Use `useRef` for values needed synchronously in callbacks (avoids stale closures):
  ```ts
  const winsRef = useRef(wins);
  useEffect(() => { winsRef.current = wins; }, [wins]);
  ```
- `snapshotRef` — stable ref to latest snapshot, used in event handlers.
- `dustRef` — stable ref to dust balance, used in engine callbacks.
- `bossCountersRef` — stable ref to boss counters, used in game-over handler.

### Lazy Loading
- All WebGL backgrounds: `const VoidTunnel = lazy(() => import("./components/Backgrounds/VoidTunnel"))`.
- Heavy panels: SettingsDrawer, ShopPanel, LeaderboardPanel, DevOverlay — all `React.lazy()`.
- Firebase: lazy singleton via `getFirebase()` async function.
- GameAnalytics: lazy import via `gaPromise = import("./services/gameanalytics")`.
- Wrap lazy components in `<Suspense fallback={...}>` and `<ChunkErrorBoundary>`.

### State Initialization from localStorage
- Initialize state from localStorage in `useState` initializer (runs once):
  ```ts
  const [best1, setBest1] = useState(() => parseInt(localStorage.getItem(LS_KEYS.BEST_CLASSIC) || "0"));
  ```
- Always guard with try/catch or use `safeGetJSON`/`safeSet` wrappers.
- Validate parsed values: `isNaN(parsed) || !isFinite(parsed) || parsed < 0`.

### Event Listeners
- Always return cleanup from `useEffect`:
  ```ts
  useEffect(() => {
    window.addEventListener('dtp:boss:complete', handler);
    return () => window.removeEventListener('dtp:boss:complete', handler);
  }, []);
  ```
- Use `{ once: true }` for one-time listeners.
- Keyboard handlers: use a stable ref pattern to avoid re-registering:
  ```ts
  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  handlerRef.current = (e) => { /* uses latest closure */ };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => handlerRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  ```

### RAF Throttling
- Throttle expensive DOM updates via RAF:
  ```ts
  let rafId: number | null = null;
  const handleMove = (e: MouseEvent) => {
    lastX = ...; lastY = ...;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mx', `${lastX}%`);
        rafId = null;
      });
    }
  };
  ```

---

## Engine Patterns

### Dispose Guard
- Always check `_isDisposed` at the start of public methods:
  ```ts
  handleTap(player: 1 | 2, idx: number): void {
    if (this._isDisposed) return;
    ...
  }
  ```

### Dirty Flag + RAF Snapshot
- Set `this.dirty = true` whenever game state changes.
- RAF loop only emits snapshot when `dirty === true`, preventing unnecessary React re-renders.
- Pattern: mutate state → set `dirty = true` → call `emitSnapshot()` for immediate updates.

### Event Bus
- Engine uses `Set<listener>` for subscribers. Subscribe returns unsubscribe function:
  ```ts
  const unsub = engine.subscribe(fn);
  // later:
  unsub();
  ```
- Emit events via `this.emit({ type: "...", ...payload })`.
- Event types: `tick`, `phaseChange`, `gameOver`, `damage`, `shake`, `sound`, `toast`, `pwrToast`, `scoreFloat`, `cellAnim`, `rareStart`, `bombDefused`, `botTap`, `qualityDowngrade`, `qualityUpgrade`.

### TickContext Pattern
- TickProcessor receives a `TickContext` proxy object with getters/setters that delegate to GameEngine private fields.
- This avoids passing `this` directly and keeps subsystems decoupled.
- Pattern: `get phase() { return self.phase; }, set phase(v) { self.phase = v; }`.

### Clock Domain Convention (CRITICAL)
```
Date.now()        → real-time state (energy regen, bomb expiry, login streaks, multiplierEnd)
performance.now() → sub-frame timing (FPS, animation deltas, hit pause, _lastTickTs)
Game ticks        → internal engine clock (tickCount)
```
Never mix domains. When crossing domains, convert explicitly with a comment.

### Delta Timers
- Use `addDeltaTimer(id, durationMs, callback)` for game-time timers (affected by slowdown/pause).
- Use `scheduleTimeout(cb, ms)` for wall-clock timeouts that survive pause.
- Always `removeDeltaTimer(id)` before adding a new one with the same id.

### Error Handling in Engine
- Wrap `processTick()` in try/catch → calls `handleError()` → pauses game, captures to Sentry.
- Never let engine errors cause silent lockup.

---

## Storage Patterns

### localStorage Wrappers
- Always use `safeSet(key, value)` and `safeGetJSON(key, default)` from `utils/storage.ts`.
- Direct `localStorage` access is acceptable in engine (no React context), but wrap in try/catch:
  ```ts
  try { localStorage.setItem('key', value); } catch {}
  ```
- Validate all parsed values before use.

### localStorage Key Conventions
- All keys defined in `LS_KEYS` from `config/difficulty.ts`.
- Game keys: `dtp-games-played`, `dtp:wins`, `dtp:deaths`.
- Settings: `dtp_muted`, `dtp_volume`, `dtp_haptics`, `dtp_screen_shake`, `dtp_reduced_motion`.
- Economy: `LS_KEYS.DUST`, `LS_KEYS.SHOP`.
- Scores: `LS_KEYS.BEST_CLASSIC`, `LS_KEYS.BEST_EVOLVE`.

---

## Firebase Patterns

### Lazy Firebase
- Never import Firebase at module top level in App.tsx. Use the singleton:
  ```ts
  let _firebase: typeof import('./services/firebase') | null = null;
  async function getFirebase() {
    if (!_firebase) _firebase = await import('./services/firebase');
    return _firebase;
  }
  ```
- Always `.catch(e => logger.warn('Firebase operation failed', e))` on Firebase calls.

### Sentry Wrapper
- Use `safeSentry` wrapper (not raw `Sentry`) to handle ad-blocker failures silently:
  ```ts
  safeSentry.addBreadcrumb({ category: "game", message: "game_start", level: "info", data: {...} });
  safeSentry.captureException(error, { tags: {...}, extra: {...} });
  ```

---

## CSS / Theming Patterns

### CSS Custom Properties
- All theming via CSS vars on `:root` / `document.documentElement`:
  - `--theme-purple`, `--theme-accent`, `--theme-bg`, `--theme-text`
  - `--cell-1p` — cell size (responsive, set inline on root div)
  - `--motion-scale` — 0 (reduced) or 1 (full)
  - `--particles-enabled` — 0 or 1
  - `--mx`, `--my` — mouse position (spotlight effect)
- Apply theme vars inline on root div: `style={{ "--cell-1p": cellSizeVar, ...themeVars } as React.CSSProperties}`.

### Root Class Modifiers
- Root div uses BEM-style modifiers: `root--${screen}`, `root--2p`, `root--classic`, `light-theme`, `root--reduced-motion`, `fx-freeze-active`, `fx-mult-active`, `fx-shield-active`.

### Responsive Cell Sizing
```ts
const cellSizeVar = is2P
  ? "clamp(58px, 14vw, 78px)"
  : "clamp(52px, min(16vw,16vh), 80px)";
```

### Accessibility
- All interactive elements: `aria-label`, `aria-pressed`, `role="dialog"`, `aria-modal="true"`.
- Live region for screen readers: `<div className="sr-only" aria-live="assertive" aria-atomic="true">`.
- Focus trap for modals via `useFocusTrap` hook.
- Reduced motion: check `window.matchMedia('(prefers-reduced-motion: reduce)')` and set CSS vars.
- Colorblind filters: SVG `<filter>` elements with `feColorMatrix` for deuteranopia, protanopia, tritanopia, monochrome.

---

## Performance Patterns

### Auto Quality Downgrade
- GameEngine monitors FPS via rolling 60-frame average.
- Below 40 FPS: sets `--particles-enabled: 0`, `--motion-scale: 0.5`, emits `qualityDowngrade`.
- Above 50 FPS: restores full quality, emits `qualityUpgrade`.

### Snapshot Memoization
- Mask array: cached by reference equality (`pat.mask !== this._cachedMaskSrc`).
- SpinCfg: cached by `spinLevel + gameSeed + devRotationSpeed`.
- Active cells: shallow-cloned per snapshot (`active.map(c => ({ ...c }))`).

### Bundle Splitting
- Manual chunks in `vite.config.ts` — keep game-core, firebase, framer-motion, lottie, sentry, analytics in separate chunks.
- Backgrounds in `bg-effects` chunk — all lazy-loaded.
- Heavy panels (Shop, Leaderboard) in `heavy-panels` chunk.

---

## Testing Patterns

### Vitest Unit Tests
- Test files in `__tests__/`, named `*.test.ts` or `*.test.tsx`.
- Setup in `test/setup.ts` (jsdom environment).
- Test pure engine logic directly — no React rendering needed for engine tests.
- Use `@testing-library/react` for component tests.

### Test Coverage Areas
- `GameEngine.test.ts` — core engine lifecycle, tap handling, game over.
- `CellLifecycle.test.ts` — cell spawning, state transitions.
- `ScoreTracker.test.ts` — scoring, streak bonuses.
- `achievements.test.ts` — achievement unlock conditions.
- `dda.test.ts` — dynamic difficulty adaptation.
- `config.test.ts`, `configIntegrity.test.ts` — config validation.

---

## Security Patterns

### Score Validation
- Scores validated in Cloudflare Worker (`workers/score-validator.ts`).
- Client-side sanity check: `score / tick > MAX_SCORE_PER_TICK` → reject + Sentry capture.
- Practice mode and god mode scores never submitted to leaderboard.

### Input Sanitization
- Player names: `n.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8)`.
- All numeric inputs: validate `isNaN`, `isFinite`, range checks before use.

### Privacy
- `privacyManager.setConsent(false)` by default until user accepts.
- `privacyManager.deleteAll()` clears all local data.
- Telemetry consent stored in `dtp:telemetry-consent`.

---

## Common Idioms

### Safe Number Parsing
```ts
const val = parseInt(localStorage.getItem('key') || '0', 10);
// or with validation:
const parsed = parseInt(raw ?? "0", 10);
if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
```

### Dust Economy Guard
```ts
if (isNaN(amount) || !isFinite(amount) || amount <= 0) return dustRef.current;
```

### Achievement Check Pattern
```ts
achievementSystem.check('achievement_id', () => condition);
achievementSystem.unlock('achievement_id'); // unconditional unlock
```

### Toast Pattern
```ts
const toast$ = useCallback((msg: string) => {
  if (toastRef.current) clearTimeout(toastRef.current);
  setToast(msg);
  toastRef.current = setTimeout(() => setToast(null), GAME.TOAST_DURATION_MS);
}, []);
```

### Visibility Auto-Pause
```ts
const handleVisibility = () => {
  if (document.visibilityState === 'hidden' && snapshotRef.current?.phase === "playing") {
    visibilityPausedRef.current = true;
    pauseEngine();
  } else if (document.visibilityState === 'visible' && visibilityPausedRef.current) {
    visibilityPausedRef.current = false;
    resumeEngine();
  }
};
```

### Subscription Cleanup Pattern
```ts
const unsub = someManager.subscribe(handler);
return () => unsub();
```
