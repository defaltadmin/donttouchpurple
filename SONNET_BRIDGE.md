# Sonnet <=> Gemini Bridge 
 
## 🔄 SONNET - (Apply these changes) 
*Sonnet: Write instructions here for Gemini CLI to execute.* 
 
--- 
 
## 🔄 GEMINI - (Context for planning) 
 
### Latest History 
7c3835a feat: add heatmap, autoplay, and live difficulty tuning (BuildDeploySection)
09c8497 chore: add automated bridge update script
2f88178 docs: add verification and branching rules to GEMINI.md
 
### Latest Git Diff 
```diff 
diff --git a/App.tsx b/App.tsx
index 511999a..bd7ed26 100644
--- a/App.tsx
+++ b/App.tsx
@@ -32,6 +32,7 @@ import { KeyBinder } from "./components/Settings/KeyBinder";
 import { ShopPanel } from "./components/Shop/ShopPanel";
 import { LeaderboardPanel } from "./components/Leaderboard/LeaderboardPanel";
 import { DevOverlay, DevUnlockModal, DevFab } from "./components/Settings/DevOverlay";
+import { BuildDeploySection } from "./components/Settings/BuildDeploySection";
 
 // Services
 import {
@@ -189,6 +190,9 @@ export default function App() {
   const [godMode, setGodMode]       = useState(false);
   const [devFreezeTime, setDevFreezeTime] = useState(false);
   const [devRotationSpeed, setDevRotationSpeed] = useState(1);
+  const [devAutoPlay, setDevAutoPlay] = useState(false);
+  const [devHeatmap, setDevHeatmap]   = useState<Record<number, number>>({});
+  const [showBuildDeploy, setShowBuildDeploy] = useState(false);
 
   const [p1Keys, setP1Keys] = useState(() => loadKeys(LS_KEYS.P1_KEYS, DEFAULT_P1_KEYS));
   const [p2Keys, setP2Keys] = useState(() => loadKeys(LS_KEYS.P2_KEYS, DEFAULT_P2_KEYS));
@@ -271,6 +275,25 @@ export default function App() {
   useEffect(() => { devSetFreezeTime(devFreezeTime); }, [devFreezeTime, devSetFreezeTime]);
   useEffect(() => { devSetRotationSpeed(devRotationSpeed); }, [devRotationSpeed, devSetRotationSpeed]);
 
+  useEffect(() => {
+    if (!devAutoPlay || !snapshot || snapshot.phase !== "playing") return;
+    const id = setInterval(() => {
+      snapshot.p1.active.forEach(cell => {
+        if (cell.type !== "purple") {
+          handleTap(1, cell.idx);
+        }
+      });
+      if (numPlayers === 2 && snapshot.p2) {
+        snapshot.p2.active.forEach(cell => {
+          if (cell.type !== "purple") {
+            handleTap(2, cell.idx);
+          }
+        });
+      }
+    }, 120);
+    return () => clearInterval(id);
+  }, [devAutoPlay, snapshot, handleTap, numPlayers]);
+
   const { pressP1, pressP2 } = useInputHandler({
     mode: gameMode,
     numPlayers,
@@ -421,6 +444,7 @@ export default function App() {
           onClose={() => setShowSettings(false)}
           onNameChange={() => setShowNameEntry(true)}
           playerName={playerName}
+          onOpenBuildDeploy={() => setShowBuildDeploy(true)}
         />
       )}
 
@@ -431,6 +455,10 @@ export default function App() {
         />
       )}
 
+      {showBuildDeploy && (
+        <BuildDeploySection onClose={() => setShowBuildDeploy(false)} />
+      )}
+
       {showNameEntry && appReady && (
         <div className="drawer-overlay" style={{ zIndex: 9999 }} onClick={() => setShowNameEntry(false)}>
           <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320 }}>
@@ -587,6 +615,12 @@ export default function App() {
           }}
           onSpawnPowerup={devSpawnPowerup}
           gameSeed={snapshot?.gameSeed || 0}
+          autoPlay={devAutoPlay}
+          onAutoPlayToggle={() => setDevAutoPlay(v => !v)}
+          heatmap={devHeatmap}
+          onResetHeatmap={() => setDevHeatmap({})}
+          gridCols={snapshot?.grid?.cols ?? 3}
+          gridRows={snapshot?.grid?.rows ?? 3}
         />
       )}
 
@@ -672,7 +706,8 @@ export default function App() {
             </div>
           )}
 
-          <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim} onTap={i => handleTap(1,i)}
+          <PlayerPanel ps={snapshot.p1} anim={snapshot.p1.anim} 
+            onTap={i => { handleTap(1, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
             onHoldStart={i => handleHoldStart(1,i)} onHoldEnd={i => handleHoldEnd(1,i)}
             keyLabels={p1Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP1)}
             label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
@@ -681,7 +716,8 @@ export default function App() {
             onPause={pauseGame} isFS={isFS}
             equippedSkin={shopData.equippedSkin} snapshot={snapshot} />
           {is2P && (
-            <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim} onTap={i => handleTap(2,i)}
+            <PlayerPanel ps={snapshot.p2} anim={snapshot.p2.anim} 
+              onTap={i => { handleTap(2, i); setDevHeatmap(h => ({ ...h, [i]: (h[i] ?? 0) + 1 })); }}
               onHoldStart={i => handleHoldStart(2,i)} onHoldEnd={i => handleHoldEnd(2,i)}
               keyLabels={p2Keys} showKeys={inputMode === "keyboard"} pressing={new Set(pressP2)}
               label="P2" heartAnim={heartAnimP2} mode={gameMode}
diff --git a/SONNET_BRIDGE.md b/SONNET_BRIDGE.md
index bc68a30..10e5169 100644
--- a/SONNET_BRIDGE.md
+++ b/SONNET_BRIDGE.md
@@ -1,26 +1,16 @@
-# Sonnet <=> Gemini Bridge
-
-## 🔄 SONNET -> GEMINI (Apply these changes)
-*Sonnet: Write instructions here for Gemini CLI to execute. Include file paths and specific logic changes.*
-
----
-
-## 🔄 GEMINI -> SONNET (Context for planning)
-*Gemini: I will put the latest git diffs and implementation details here.*
-
-### Latest Git Diff
-```diff
-# I will automatically populate this when asked.
-```
-
-### Current Status
-- **Last Commit:** 
-- **Active Task:** 
-- **Files Modified:** 
-
----
-
-## 📝 SYNC RULES
-1. **Never delete the history:** Keep the last 2-3 exchanges in the sections for context.
-2. **Be specific:** Use exact filenames and line numbers.
-3. **Use the Diff:** Sonnet works best when it sees the `git diff` from this file.
+# Sonnet <=> Gemini Bridge 
+ 
+## 🔄 SONNET - (Apply these changes) 
+*Sonnet: Write instructions here for Gemini CLI to execute.* 
+ 
+--- 
+ 
+## 🔄 GEMINI - (Context for planning) 
+ 
+### Latest History 
+7c3835a feat: add heatmap, autoplay, and live difficulty tuning (BuildDeploySection)
+09c8497 chore: add automated bridge update script
+2f88178 docs: add verification and branching rules to GEMINI.md
+ 
+### Latest Git Diff 
+```diff 
diff --git a/components/Settings/BuildDeploySection.tsx b/components/Settings/BuildDeploySection.tsx
new file mode 100644
index 0000000..c660d20
--- /dev/null
+++ b/components/Settings/BuildDeploySection.tsx
@@ -0,0 +1,159 @@
+import React, { useState, useCallback } from "react";
+import { DIFFICULTY } from "../../config/difficulty";
+
+// In-memory live overrides (module-level so DifficultyScaler reads them)
+export const difficultyOverrides: Partial<typeof DIFFICULTY> = {};
+
+export function applyOverride(key: keyof typeof DIFFICULTY, value: number) {
+  (difficultyOverrides as any)[key] = value;
+}
+
+export function clearOverrides() {
+  Object.keys(difficultyOverrides).forEach(k => delete (difficultyOverrides as any)[k]);
+}
+
+interface SliderDef {
+  key: keyof typeof DIFFICULTY;
+  label: string;
+  min: number;
+  max: number;
+  step: number;
+  format?: (v: number) => string;
+  help: string;
+}
+
+const SLIDERS: SliderDef[] = [
+  { key: "INIT_MS",     label: "Initial Tick (ms)",   min: 500, max: 4000, step: 50,
+    format: v => v + "ms", help: "Starting tick interval. Higher = slower start." },
+  { key: "MIN_MS",      label: "Min Tick (ms)",        min: 200, max: 800,  step: 10,
+    format: v => v + "ms", help: "Fastest possible tick. Higher = easier ceiling." },
+  { key: "DECAY_EXP",   label: "Decay Exponent",       min: 0.90, max: 0.999, step: 0.001,
+    format: v => v.toFixed(3), help: "Per-step speed multiplier. Lower = faster ramp." },
+  { key: "DECAY_EVERY", label: "Decay Every N taps",   min: 1, max: 20, step: 1,
+    help: "How many taps between each decay step." },
+  { key: "SPIN_BASE_DURATION", label: "Spin Base (s)", min: 4, max: 30, step: 0.5,
+    format: v => v + "s", help: "Base rotation period at spin level 0." },
+  { key: "SPIN_SPEED_CAP",     label: "Spin Speed Cap", min: 1, max: 5, step: 0.1,
+    format: v => v.toFixed(1) + "×", help: "Max spin speed multiplier." },
+  { key: "SPIN_GROWTH",  label: "Spin Growth/level",   min: 0.01, max: 0.15, step: 0.005,
+    format: v => "+" + (v * 100).toFixed(1) + "%", help: "Speed increase per spin level." },
+  { key: "SPIN_EPOCH_LEVELS", label: "Direction Flip", min: 1, max: 10, step: 1,
+    help: "Spin direction flips every N levels." },
+];
+
+interface BuildDeploySectionProps {
+  onClose: () => void;
+}
+
+export function BuildDeploySection({ onClose }: BuildDeploySectionProps) {
+  const [vals, setVals] = useState<Record<string, number>>(() =>
+    Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]))
+  );
+  const [livePreview, setLivePreview] = useState(false);
+  const [copied, setCopied] = useState(false);
+
+  const set = useCallback((key: string, v: number) => {
+    setVals(prev => {
+      const next = { ...prev, [key]: v };
+      if (livePreview) {
+        applyOverride(key as keyof typeof DIFFICULTY, v);
+      }
+      return next;
+    });
+  }, [livePreview]);
+
+  const togglePreview = () => {
+    setLivePreview(p => {
+      if (!p) {
+        // Apply all current vals
+        SLIDERS.forEach(s => applyOverride(s.key, vals[s.key]));
+      } else {
+        clearOverrides();
+      }
+      return !p;
+    });
+  };
+
+  const reset = () => {
+    const defaults = Object.fromEntries(SLIDERS.map(s => [s.key, (DIFFICULTY as any)[s.key]]));
+    setVals(defaults);
+    clearOverrides();
+    if (livePreview) {
+      SLIDERS.forEach(s => applyOverride(s.key, (DIFFICULTY as any)[s.key]));
+    }
+  };
+
+  const generateScript = () => {
+    const lines = [
+      "// ─── Difficulty scaling constants ──────────────────────────────────",
+      "export const DIFFICULTY = {",
+      ...SLIDERS.map(s => `  ${s.key}: ${
+        Number.isInteger(vals[s.key]) ? vals[s.key] : vals[s.key].toFixed(
+          s.key === "DECAY_EXP" ? 3 : s.key === "SPIN_GROWTH" ? 3 : 2
+        )
+      },`),
+      "} as const;",
+    ].join("\n");
+    navigator.clipboard?.writeText(lines).then(() => {
+      setCopied(true);
+      setTimeout(() => setCopied(false), 2000);
+    }).catch(() => {});
+  };
+
+  return (
+    <div className="drawer-overlay" onClick={onClose}>
+      <div className="drawer-panel" style={{ maxHeight: "90vh", overflowY: "auto" }}
+        onClick={e => e.stopPropagation()}>
+        <div className="drawer-header">
+          <span className="drawer-title">⚙ Difficulty Tuning</span>
+          <button className="btn-icon" onClick={onClose}>✕</button>
+        </div>
+
+        <div className="opt-section">
+          <div className="opt-label">Live Preview</div>
+          <button
+            className={livePreview ? "btn-primary" : "btn-ghost"}
+            style={{ width: "100%" }}
+            onClick={togglePreview}
+          >
+            {livePreview ? "🟢 Preview ON — changes affect live game" : "⚫ Preview OFF — safe to tune"}
+          </button>
+        </div>
+
+        {SLIDERS.map(s => (
+          <div key={s.key} className="opt-section">
+            <div style={{ display: "flex", justifyContent: "space-between" }}>
+              <div className="opt-label" title={s.help}>{s.label} ⓘ</div>
+              <div className="opt-label" style={{ opacity: 0.7 }}>
+                {s.format ? s.format(vals[s.key]) : vals[s.key]}
+              </div>
+            </div>
+            <input type="range"
+              className="devs-range"
+              min={s.min} max={s.max} step={s.step}
+              value={vals[s.key]}
+              onChange={e => set(s.key, Number(e.target.value))}
+              style={{ width: "100%" }}
+            />
+            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
+              <span>{s.min}</span>
+              <span>default: {(DIFFICULTY as any)[s.key]}</span>
+              <span>{s.max}</span>
+            </div>
+          </div>
+        ))}
+
+        <div className="opt-section" style={{ display: "flex", gap: 8 }}>
+          <button className="btn-ghost" style={{ flex: 1 }} onClick={reset}>↺ Reset Defaults</button>
+          <button className="btn-primary" style={{ flex: 2 }} onClick={generateScript}>
+            {copied ? "✅ Copied!" : "📋 Copy difficulty.ts snippet"}
+          </button>
+        </div>
+
+        <div style={{ fontSize: 10, opacity: 0.3, textAlign: "center", padding: "8px 0 4px" }}>
+          Paste output into src/config/difficulty.ts → rebuild → deploy
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/components/Settings/DevOverlay.tsx b/components/Settings/DevOverlay.tsx
index 13f9159..7c35237 100644
--- a/components/Settings/DevOverlay.tsx
+++ b/components/Settings/DevOverlay.tsx
@@ -25,6 +25,12 @@ interface DevOverlayProps {
   onDustAdd: (amount: number) => void;
   onSpawnPowerup: (type: "shield" | "freeze" | "heart") => void;
   gameSeed: number;
+  autoPlay:          boolean;
+  onAutoPlayToggle:  () => void;
+  heatmap:           Record<number, number>;
+  onResetHeatmap:    () => void;
+  gridCols:          number;
+  gridRows:          number;
 }
 
 const SPARKLINE_CAP = 30;
@@ -44,11 +50,11 @@ function Sparkline({ data }: { data: number[] }) {
   );
 }
 
-function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
+function Section({ title, icon, children, defaultOpen = true, help }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; help?: string }) {
   const [open, setOpen] = useState(defaultOpen);
   return (
     <div className="devs-section">
-      <button className="devs-section-hdr" onClick={() => setOpen(o => !o)}>
+      <button className="devs-section-hdr" onClick={() => setOpen(o => !o)} title={help}>
         <span>{icon} {title}</span>
         <span style={{ opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
       </button>
@@ -102,10 +108,45 @@ function Slider({ label, min, max, step, value, onChange, format, help }: {
   );
 }
 
+function HeatmapGrid({ heatmap, cols, rows }: { heatmap: Record<number, number>; cols: number; rows: number }) {
+  const total = cols * rows;
+  const vals = Object.values(heatmap);
+  const max = vals.length ? Math.max(...vals, 1) : 1;
+  return (
+    <div style={{
+      display: "grid",
+      gridTemplateColumns: `repeat(${cols}, 1fr)`,
+      gap: 3,
+      marginTop: 4,
+    }}>
+      {Array.from({ length: total }, (_, i) => {
+        const count = heatmap[i] ?? 0;
+        const alpha = count === 0 ? 0.08 : 0.15 + (count / max) * 0.85;
+        return (
+          <div key={i} title={`Cell ${i}: ${count} taps`} style={{
+            background: `rgba(192, 38, 211, ${alpha})`,
+            borderRadius: 3,
+            aspectRatio: "1",
+            display: "flex",
+            alignItems: "center",
+            justifyContent: "center",
+            fontSize: 8,
+            fontFamily: "monospace",
+            color: "rgba(255,255,255,0.7)",
+          }}>
+            {count > 0 ? count : ""}
+          </div>
+        );
+      })}
+    </div>
+  );
+}
+
 export function DevOverlay({
   p1, p2, tick, gameMode, numPlayers, rareMode, cellShape, paused, screen, onClose,
   godMode, onGodModeToggle, speedMult, onSpeedMult, rotationSpeed, onRotationSpeed,
   freezeTime, onFreezeTimeToggle, dust, onDustAdd, onSpawnPowerup, gameSeed,
+  autoPlay, onAutoPlayToggle, heatmap, onResetHeatmap, gridCols, gridRows,
 }: DevOverlayProps) {
   const [tickMs, setTickMs] = useState<number[]>([]);
   const lastTickRef = useRef(Date.now());
@@ -208,6 +249,8 @@ export function DevOverlay({
             help="All hits are ignored. Health won't drop." />
           <Toggle label="Freeze Time — no speed scaling" active={freezeTime} onToggle={onFreezeTimeToggle}
             help="Difficulty scaler is paused. Speed stays constant." />
+          <Toggle label="Auto-Play — bot taps safe cells" active={autoPlay} onToggle={onAutoPlayToggle}
+            help="Automatically taps all non-purple active cells every 120ms. God Mode recommended." />
           <div className="devs-divider" />
           <div className="devs-sublabel">DUST INJECTOR</div>
           <div className="devs-btn-row">
@@ -225,6 +268,14 @@ export function DevOverlay({
           </div>
         </Section>
 
+        <Section title="Tap Heatmap" icon="🔥" defaultOpen={false}>
+          <div className="devs-sublabel">Tap count per cell (this session)</div>
+          <HeatmapGrid heatmap={heatmap} cols={gridCols} rows={gridRows} />
+          <div style={{ marginTop: 6 }}>
+            <Btn label="Reset Heatmap" onClick={onResetHeatmap} help="Clear all tap counts" />
+          </div>
+        </Section>
+
         <Section title="Speed & Rotation" icon="🎛">
           <Slider label="Game Speed" min={0.1} max={5} step={0.05} value={speedMult}
             onChange={onSpeedMult} format={v => v.toFixed(2) + "×"}
diff --git a/components/Settings/SettingsDrawer.tsx b/components/Settings/SettingsDrawer.tsx
index 1aff0d7..62dca59 100644
--- a/components/Settings/SettingsDrawer.tsx
+++ b/components/Settings/SettingsDrawer.tsx
@@ -15,6 +15,7 @@ interface SettingsDrawerProps {
   onClose: () => void;
   onNameChange?: () => void;
   playerName?: string;
+  onOpenBuildDeploy?: () => void;
 }
 
 export function SettingsDrawer({
@@ -29,6 +30,7 @@ export function SettingsDrawer({
   onClose,
   onNameChange,
   playerName,
+  onOpenBuildDeploy,
 }: SettingsDrawerProps) {
   return (
     <div className="drawer-overlay" onClick={onClose}>
@@ -92,6 +94,22 @@ export function SettingsDrawer({
             </button>
           </div>
         )}
+
+        {onOpenBuildDeploy && (
+          <div className="opt-section">
+            <div className="opt-label">🔧 Balance & Deploy</div>
+            <button
+              className="btn-ghost"
+              style={{ width: "100%", textAlign: "center" }}
+              onClick={() => {
+                onClose();
+                setTimeout(onOpenBuildDeploy!, 150);
+              }}
+            >
+              ⚙ Tune Difficulty Constants
+            </button>
+          </div>
+        )}
       </div>
     </div>
   );
diff --git a/engine/DifficultyScaler.ts b/engine/DifficultyScaler.ts
index 56e6f1e..85b2047 100644
--- a/engine/DifficultyScaler.ts
+++ b/engine/DifficultyScaler.ts
@@ -1,24 +1,31 @@
 import { DIFFICULTY } from "../config/difficulty";
+import { difficultyOverrides } from "../components/Settings/BuildDeploySection";
 
 // ─── Tick interval (ms) ───────────────────────────────────────────
 export function computeMs(tick: number, mult = 1): number {
+  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
+  const MIN_MS = difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS;
+  const DECAY_EXP = difficultyOverrides.DECAY_EXP ?? DIFFICULTY.DECAY_EXP;
+  const DECAY_EVERY = difficultyOverrides.DECAY_EVERY ?? DIFFICULTY.DECAY_EVERY;
+
   return Math.max(
-    DIFFICULTY.MIN_MS,
-    DIFFICULTY.INIT_MS *
-      Math.pow(DIFFICULTY.DECAY_EXP, Math.floor(tick / DIFFICULTY.DECAY_EVERY)) *
-      mult
+    MIN_MS,
+    INIT_MS * Math.pow(DECAY_EXP, Math.floor(tick / DECAY_EVERY)) * mult
   );
 }
 
 // ─── Speed display helpers ────────────────────────────────────────
 export function speedLabel(tick: number, frozen: boolean): string {
-  return (DIFFICULTY.INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
+  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
+  return (INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
 }
 
 export function speedPct(tick: number): number {
+  const INIT_MS = difficultyOverrides.INIT_MS ?? DIFFICULTY.INIT_MS;
+  const MIN_MS = difficultyOverrides.MIN_MS ?? DIFFICULTY.MIN_MS;
   return Math.max(
     4,
-    ((DIFFICULTY.INIT_MS - computeMs(tick)) / (DIFFICULTY.INIT_MS - DIFFICULTY.MIN_MS)) * 96
+    ((INIT_MS - computeMs(tick)) / (INIT_MS - MIN_MS)) * 96
   );
 }
 
@@ -42,9 +49,14 @@ export function getSpinConfig(
   level: number,
   gameSeed: number
 ): { duration: number; direction: 1 | -1 } {
-  const rawDur = DIFFICULTY.SPIN_BASE_DURATION * Math.pow(1 - DIFFICULTY.SPIN_GROWTH, level);
-  const duration = Math.max(DIFFICULTY.SPIN_SPEED_CAP, rawDur);
-  const epoch = Math.floor(level / DIFFICULTY.SPIN_EPOCH_LEVELS);
+  const SPIN_BASE_DURATION = difficultyOverrides.SPIN_BASE_DURATION ?? DIFFICULTY.SPIN_BASE_DURATION;
+  const SPIN_GROWTH = difficultyOverrides.SPIN_GROWTH ?? DIFFICULTY.SPIN_GROWTH;
+  const SPIN_SPEED_CAP = difficultyOverrides.SPIN_SPEED_CAP ?? DIFFICULTY.SPIN_SPEED_CAP;
+  const SPIN_EPOCH_LEVELS = difficultyOverrides.SPIN_EPOCH_LEVELS ?? DIFFICULTY.SPIN_EPOCH_LEVELS;
+
+  const rawDur = SPIN_BASE_DURATION * Math.pow(1 - SPIN_GROWTH, level);
+  const duration = Math.max(SPIN_SPEED_CAP, rawDur);
+  const epoch = Math.floor(level / SPIN_EPOCH_LEVELS);
   const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
   const rng = mulberry32(epochSeed);
   const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
diff --git a/engine/types.ts b/engine/types.ts
index 7f5b554..89531c9 100644
--- a/engine/types.ts
+++ b/engine/types.ts
@@ -87,6 +87,7 @@ export interface GameSnapshot {
     rows: number;
     mask: number[] | null;
   };
+  devRotationSpeed?: number;
   spinCfg: { duration: number; direction: 1 | -1 } | null;
 }
 
``` 
 
### Current Status 
- **Last Sync:** Sun 04/26/2026  2:07:20.18 
 M SONNET_BRIDGE.md
