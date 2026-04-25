# Sonnet <=> Gemini Bridge

## 🔄 SONNET -> GEMINI (Apply these changes)

### Audit Results (Sonnet's findings before issuing tasks)

1. **Session-2 props (`devAutoPlay`, `heatmap`, `gridCols`, `gridRows`) — MISSING.**
   App.tsx has no trace of these. They need to be added fresh.

2. **`devRotationSpeed` pipeline — CONFIRMED CORRECT. No action needed.**
   - `GameEngine.ts` line 660: `spinCfg.duration` is multiplied by `this.devRotationSpeed` inside `getSnapshot()`.
   - `PlayerPanel.tsx` reads `spinCfg.duration` directly from snapshot.
   - No double-application possible. ✅

3. **SettingsDrawer dev section — DOES NOT EXIST YET.**
   Current `SettingsDrawer.tsx` has 4 sections (Appearance, Sound, Display, Colorblind, optional Name).
   The `BuildDeploySection` and DIFFICULTY live-preview feature are net-new.

4. **Config live-preview — NET NEW FEATURE.**
   Needs: a `BuildDeploySection` component + an in-memory DIFFICULTY override mechanism.

---

### Task 1 — App.tsx: Add session-2 dev props

**File:** `src/App.tsx`

After line 191 (`const [devRotationSpeed, setDevRotationSpeed] = useState(1);`), add:

```ts
const [devAutoPlay, setDevAutoPlay] = useState(false);
const [devHeatmap, setDevHeatmap]   = useState<Record<number, number>>({});
```

After the existing `useEffect(() => { devSetRotationSpeed(...) }, ...)` block (line 272), add:

```ts
useEffect(() => {
  if (!devAutoPlay || !snapshot || snapshot.phase !== "playing") return;
  const id = setInterval(() => {
    snapshot.p1.active.forEach(cell => handleTap(1, cell.idx));
  }, 120);
  return () => clearInterval(id);
}, [devAutoPlay, snapshot, handleTap]);
```

In the DevOverlay JSX block (around line 563), add these 4 props after `gameSeed={...}`:

```tsx
autoPlay={devAutoPlay}
onAutoPlayToggle={() => setDevAutoPlay(v => !v)}
heatmap={devHeatmap}
onResetHeatmap={() => setDevHeatmap({})}
gridCols={snapshot?.grid?.cols ?? 3}
gridRows={snapshot?.grid?.rows ?? 3}
```

Also pipe heatmap recording: inside the `handleTap` wrapper in App (wherever tap events fire — search for `handleTap(1, i)` call sites in the PlayerPanel onTap prop), wrap with:

```ts
onTap={i => { handleTap(1, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
```

Do the same for P2 with player index 2.

---

### Task 2 — DevOverlay.tsx: Add new props + UI sections

**File:** `src/components/Settings/DevOverlay.tsx`

**2a. Extend `DevOverlayProps` interface** — add after `gameSeed: number;`:

```ts
autoPlay:          boolean;
onAutoPlayToggle:  () => void;
heatmap:           Record<number, number>;
onResetHeatmap:    () => void;
gridCols:          number;
gridRows:          number;
```

**2b. Destructure new props** in the `DevOverlay` function signature.

**2c. Add AutoPlay toggle** inside the `<Section title="Cheats" ...>` block, after the Freeze Time toggle:

```tsx
<Toggle label="Auto-Play — bot taps safe cells" active={autoPlay} onToggle={onAutoPlayToggle}
  help="Automatically taps all non-purple active cells every 120ms. God Mode recommended." />
```

**2d. Add Heatmap section** — new `<Section>` after the Cheats section:

```tsx
<Section title="Tap Heatmap" icon="🔥" defaultOpen={false}>
  <div className="devs-sublabel">Tap count per cell (this session)</div>
  <HeatmapGrid heatmap={heatmap} cols={gridCols} rows={gridRows} />
  <div style={{ marginTop: 6 }}>
    <Btn label="Reset Heatmap" onClick={onResetHeatmap} help="Clear all tap counts" />
  </div>
</Section>
```

**2e. Add `HeatmapGrid` component** above the `DevOverlay` export:

```tsx
function HeatmapGrid({ heatmap, cols, rows }: { heatmap: Record<number, number>; cols: number; rows: number }) {
  const total = cols * rows;
  const max = Math.max(...Object.values(heatmap), 1);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 3,
      marginTop: 4,
    }}>
      {Array.from({ length: total }, (_, i) => {
        const count = heatmap[i] ?? 0;
        const alpha = count === 0 ? 0.08 : 0.15 + (count / max) * 0.85;
        return (
          <div key={i} title={`Cell ${i}: ${count} taps`} style={{
            background: `rgba(192, 38, 211, ${alpha})`,
            borderRadius: 3,
            aspectRatio: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.7)",
          }}>
            {count > 0 ? count : ""}
          </div>
        );
      })}
    </div>
  );
}
```

---

### Task 3 — SettingsDrawer.tsx: Add BuildDeploySection with live-preview

**File:** `src/components/Settings/SettingsDrawer.tsx`

**3a. Extend `SettingsDrawerProps`** — add at end of interface:

```ts
onOpenBuildDeploy?: () => void;
```

**3b. Add button** at bottom of drawer (after the Name section, before closing `</div>`):

```tsx
{onOpenBuildDeploy && (
  <div className="opt-section">
    <div className="opt-label">🔧 Balance & Deploy</div>
    <button className="btn-ghost" style={{ width: "100%", textAlign: "center" }}
      onClick={() => { onClose(); setTimeout(onOpenBuildDeploy!, 150); }}>
      ⚙ Tune Difficulty Constants
    </button>
  </div>
)}
```

---

### Task 4 — NEW FILE: BuildDeploySection.tsx

**File:** `src/components/Settings/BuildDeploySection.tsx`

This component renders a modal/drawer with sliders for live DIFFICULTY tuning + script export.

```tsx
import React, { useState, useCallback } from "react";
import { DIFFICULTY } from "../../config/difficulty";

// In-memory live overrides (module-level so DifficultyScaler reads them)
export const difficultyOverrides: Partial<typeof DIFFICULTY> = {};

export function applyOverride(key: keyof typeof DIFFICULTY, value: number) {
  (difficultyOverrides as any)[key] = value;
}

export function clearOverrides() {
  Object.keys(difficultyOverrides).forEach(k => delete (difficultyOverrides as any)[k]);
}

interface SliderDef {
  key: keyof typeof DIFFICULTY;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  help: string;
}

const SLIDERS: SliderDef[] = [
  { key: "INIT_MS",     label: "Initial Tick (ms)",   min: 500, max: 4000, step: 50,
    format: v => v + "ms", help: "Starting tick interval. Higher = slower start." },
  { key: "MIN_MS",      label: "Min Tick (ms)",        min: 200, max: 800,  step: 10,
    format: v => v + "ms", help: "Fastest possible tick. Higher = easier ceiling." },
  { key: "DECAY_EXP",   label: "Decay Exponent",       min: 0.90, max: 0.999, step: 0.001,
    format: v => v.toFixed(3), help: "Per-step speed multiplier. Lower = faster ramp." },
  { key: "DECAY_EVERY", label: "Decay Every N taps",   min: 1, max: 20, step: 1,
    help: "How many taps between each decay step." },
  { key: "SPIN_BASE_DURATION", label: "Spin Base (s)", min: 4, max: 30, step: 0.5,
    format: v => v + "s", help: "Base rotation period at spin level 0." },
  { key: "SPIN_SPEED_CAP",     label: "Spin Speed Cap", min: 1, max: 5, step: 0.1,
    format: v => v.toFixed(1) + "×", help: "Max spin speed multiplier." },
  { key: "SPIN_GROWTH",  label: "Spin Growth/level",   min: 0.01, max: 0.15, step: 0.005,
    format: v => "+" + (v * 100).toFixed(1) + "%", help: "Speed increase per spin level." },
  { key: "SPIN_EPOCH_LEVELS", label: "Direction Flip", min: 1, max: 10, step: 1,
    help: "Spin direction flips every N levels." },
];

interface BuildDeploySectionProps {
  onClose: () => void;
}

export function BuildDeploySection({ onClose }: BuildDeploySectionProps) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]))
  );
  const [livePreview, setLivePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = useCallback((key: string, v: number) => {
    setVals(prev => {
      const next = { ...prev, [key]: v };
      if (livePreview) {
        applyOverride(key as keyof typeof DIFFICULTY, v);
      }
      return next;
    });
  }, [livePreview]);

  const togglePreview = () => {
    setLivePreview(p => {
      if (!p) {
        // Apply all current vals
        SLIDERS.forEach(s => applyOverride(s.key, vals[s.key]));
      } else {
        clearOverrides();
      }
      return !p;
    });
  };

  const reset = () => {
    const defaults = Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]));
    setVals(defaults);
    clearOverrides();
    if (livePreview) {
      SLIDERS.forEach(s => applyOverride(s.key, (DIFFICULTY as any)[s.key]));
    }
  };

  const generateScript = () => {
    const lines = [
      "// ─── Difficulty scaling constants ──────────────────────────────────",
      "export const DIFFICULTY = {",
      ...SLIDERS.map(s => `  ${s.key}: ${
        Number.isInteger(vals[s.key]) ? vals[s.key] : vals[s.key].toFixed(
          s.key === "DECAY_EXP" ? 3 : s.key === "SPIN_GROWTH" ? 3 : 2
        )
      },`),
      "} as const;",
    ].join("\n");
    navigator.clipboard?.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">⚙ Difficulty Tuning</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="opt-section">
          <div className="opt-label">Live Preview</div>
          <button
            className={livePreview ? "btn-primary" : "btn-ghost"}
            style={{ width: "100%" }}
            onClick={togglePreview}
          >
            {livePreview ? "🟢 Preview ON — changes affect live game" : "⚫ Preview OFF — safe to tune"}
          </button>
        </div>

        {SLIDERS.map(s => (
          <div key={s.key} className="opt-section">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="opt-label" title={s.help}>{s.label} ⓘ</div>
              <div className="opt-label" style={{ opacity: 0.7 }}>
                {s.format ? s.format(vals[s.key]) : vals[s.key]}
              </div>
            </div>
            <input type="range"
              className="devs-range"
              min={s.min} max={s.max} step={s.step}
              value={vals[s.key]}
              onChange={e => set(s.key, Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
              <span>{s.min}</span>
              <span>default: {(DIFFICULTY as any)[s.key]}</span>
              <span>{s.max}</span>
            </div>
          </div>
        ))}

        <div className="opt-section" style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={reset}>↺ Reset Defaults</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={generateScript}>
            {copied ? "✅ Copied!" : "📋 Copy difficulty.ts snippet"}
          </button>
        </div>

        <div style={{ fontSize: 10, opacity: 0.3, textAlign: "center", padding: "8px 0 4px" }}>
          Paste output into src/config/difficulty.ts → rebuild → deploy
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5 — DifficultyScaler.ts: Read live overrides

**File:** `src/engine/DifficultyScaler.ts`

At the top of the file, add import:

```ts
import { difficultyOverrides } from "../components/Settings/BuildDeploySection";
```

Then wherever `DIFFICULTY.INIT_MS`, `DIFFICULTY.MIN_MS`, `DIFFICULTY.DECAY_EXP`, `DIFFICULTY.DECAY_EVERY` are read inside `computeMs()`, wrap each with:

```ts
const INIT_MS     = (difficultyOverrides.INIT_MS     ?? DIFFICULTY.INIT_MS);
const MIN_MS      = (difficultyOverrides.MIN_MS      ?? DIFFICULTY.MIN_MS);
const DECAY_EXP   = (difficultyOverrides.DECAY_EXP   ?? DIFFICULTY.DECAY_EXP);
const DECAY_EVERY = (difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY);
```

Similarly in spin config calculation (wherever `SPIN_BASE_DURATION`, `SPIN_SPEED_CAP`, `SPIN_GROWTH`, `SPIN_EPOCH_LEVELS` are used), shadow with:

```ts
const SPIN_BASE_DURATION = (difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION);
// etc.
```

---

### Task 6 — App.tsx: Wire BuildDeploySection

**File:** `src/App.tsx`

Add import:

```ts
import { BuildDeploySection } from "./components/Settings/BuildDeploySection";
```

Add state:

```ts
const [showBuildDeploy, setShowBuildDeploy] = useState(false);
```

Pass prop to SettingsDrawer:

```tsx
onOpenBuildDeploy={() => setShowBuildDeploy(true)}
```

Render modal (alongside other overlays):

```tsx
{showBuildDeploy && (
  <BuildDeploySection onClose={() => setShowBuildDeploy(false)} />
)}
```

---

### Task 7 — Visual QA checklist (Gemini: verify these after applying)

- [ ] `SettingsDrawer` renders the "Balance & Deploy" row only when `onOpenBuildDeploy` prop is provided
- [ ] `PillRow` options in SettingsDrawer don't overflow on 375px viewport (check `flex-wrap` on `.pill-row`)
- [ ] `BuildDeploySection` sliders use the `.devs-range` CSS class (same as DevOverlay sliders — already styled)
- [ ] DevOverlay `HeatmapGrid` renders correctly at 3×3, 4×4, and 2×2 grid sizes
- [ ] DevOverlay AutoPlay toggle visible in Cheats section between Freeze Time and DUST INJECTOR

---

## 🔄 GEMINI -> SONNET (Context for planning)

### Latest Git Diff
```diff
# Gemini: populate after applying above tasks
```

### Current Status
- **Last Commit:** (pending)
- **Active Task:** Session-2 missing props + BuildDeploySection live-preview
- **Files Modified:** App.tsx, DevOverlay.tsx, SettingsDrawer.tsx, BuildDeploySection.tsx (new), DifficultyScaler.ts

---

## 📝 SYNC RULES
1. Never delete the history: Keep the last 2-3 exchanges in the sections for context.
2. Be specific: Use exact filenames and line numbers.
3. Use the Diff: Sonnet works best when it sees the `git diff` from this file.
