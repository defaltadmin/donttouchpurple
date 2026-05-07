M1, M2, M3 — useGameEngine.ts
The sound event handler at line 224 calls playSound(event.name) but playSound only accepts the 5 existing types. Need to expand the type and add 3 new sounds.
ts// FIND:
function playSound(type: "ok" | "bad" | "tick" | "powerup" | "levelup"): void {

// REPLACE WITH:
function playSound(type: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim"): void {
ts// FIND (after the levelup block, before the closing `else {`):
    } else {
      o.type = "square"; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(); o.stop(t + 0.04);
    }

// REPLACE WITH:
    } else if (type === "shuffle") {
      // M1: short descending swoosh — two oscillators, noise-like
      o.type = "sine"; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.14);
      g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.start(); o.stop(t + 0.14);
    } else if (type === "rareStart") {
      // M2: rising stinger — triangle wave arp
      o.type = "triangle"; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.06); o.frequency.setValueAtTime(990, t + 0.12);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
    } else if (type === "claim") {
      // M3: satisfying chime — two-note chord
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(_masterGain!);
      o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
      g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(); o.stop(t + 0.22);
      o2.type = "sine"; o2.frequency.setValueAtTime(1320, t); o2.frequency.exponentialRampToValueAtTime(1760, t + 0.18);
      g2.gain.setValueAtTime(0.1, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o2.start(); o2.stop(t + 0.22);
    } else {
      o.type = "square"; o.frequency.setValueAtTime(330, t);
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(); o.stop(t + 0.04);
    }
Also need to expand the GameEvent sound type in types.ts and the emit call:
types.ts — sound event name union:
ts// FIND:
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" }

// REPLACE WITH:
  | { type: "sound";       name: "ok" | "bad" | "tick" | "powerup" | "levelup" | "shuffle" | "rareStart" | "claim" }
GameEngine.ts — replace placeholder "ok" with real "shuffle" in tryShuffleCells:
ts// FIND (in tryShuffleCells, after the cellShuffle emit):
      this.emit({ type: "sound", name: "ok" }); // M1: shuffle sound

// REPLACE WITH:
      this.emit({ type: "sound", name: "shuffle" }); // M1
GameEngine.ts — M2 rareStart sound (already emits rareStart event, but no sound emit alongside it):
ts// FIND (in processTick):
          this.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          this.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });

// REPLACE WITH:
          this.emit({ type: "rareStart", color: pick.color, cssColor: pick.cssColor });
          this.emit({ type: "sound", name: "rareStart" }); // M2
          this.emit({ type: "toast", message: `⚠️ Don't Touch ${pick.color.toUpperCase()}!` });

M3 — claim sound wiring
Need to find where RewardsHub dust claim fires and add a sound emit. Since RewardsHub is a React component (not inside GameEngine), the claim sound needs to call playVolumeChime or a new exported function. Export playSound or add a playSoundDirect export from useGameEngine.ts:
useGameEngine.ts — add export after playVolumeChime:
ts// ADD after playVolumeChime function:
export function playSoundEffect(name: "shuffle" | "rareStart" | "claim"): void {
  playSound(name);
}
Then in RewardsHub.tsx (not uploaded — pass this to opencode):
tsimport { playSoundEffect } from "../../hooks/useGameEngine";
// inside claim handler:
playSoundEffect("claim");

N2 — index.html already has apple-mobile-web-app-capable and apple-mobile-web-app-status-bar-style: black-translucent ✅ Done.
N3/N4 — The rare ring is handled via the grid's outline style (not a separate fixed element — confirmed from PlayerPanel.tsx line rareMode.active ? { outline: \2px solid...` }`). No separate fixed rare ring div. The fixed HUD elements at lines 463, 469 (toast, dust widget) need safe-area padding:
game.css — N3/N4 safe-area patches:
css/* FIND: */
.toast {

/* ADD inside .toast rule: */
  top: max(10px, calc(10px + env(safe-area-inset-top)));

/* FIND: */
position: fixed; top: 10px; right: 10px; z-index: 600;
/* (dust widget, ~line 463) — REPLACE top: 10px with: */
  top: max(10px, calc(10px + env(safe-area-inset-top)));

/* FIND .pause-overlay and .privacy-banner bottom padding — ADD: */
  padding-bottom: max(16px, calc(16px + env(safe-area-inset-bottom)));
Since game.css is large and these are surgical inset changes, here are the exact grep targets for opencode:
# N3: toast safe-area
sed -i 's/\.toast {/\.toast {\n  top: max(10px, calc(10px + env(safe-area-inset-top)));/' game.css
# Won't work cleanly — better as str_replace per rule
Pass these to opencode as str_replace patches on specific lines. The key ones:

.toast block — add top: max(10px, calc(10px + env(safe-area-inset-top)));
Line 463 dust widget fixed — change top: 10px → top: max(10px, calc(10px + env(safe-area-inset-top)))
.pause-overlay — add padding-top: env(safe-area-inset-top);
.privacy-banner — add padding-bottom: max(10px, calc(10px + env(safe-area-inset-bottom)));


P1 — LeaderboardPanel already has onScoresFetched prop wired (confirmed in the uploaded file, lines 20 and 46). App.tsx just needs:
tsx// FIND in App.tsx:
          fetchGlobalScores={fbFetchTop20Global}

// REPLACE WITH:
          fetchGlobalScores={fbFetchTop20Global}
          onScoresFetched={checkTop10Achievement}

Summary for opencode:
FileChangetypes.tsExpand sound name union + "shuffle" | "rareStart" | "claim"GameEngine.ts"shuffle" sound in tryShuffleCells; "rareStart" sound alongside rareStart emituseGameEngine.tsExpand playSound type; add 3 sound branches; export playSoundEffectApp.tsxAdd onScoresFetched={checkTop10Achievement} to <LeaderboardPanel>game.cssSafe-area insets on toast, dust widget, pause-overlay, privacy-bannerRewardsHub.tsxImport + call playSoundEffect("claim") in dust claim handler