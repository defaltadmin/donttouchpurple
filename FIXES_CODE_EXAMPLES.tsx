// FIXES_SESSION_2.md — Code examples for App.tsx

// ============================================================================
// ISSUE #1: Ice Cell Expiry — Add spawnedAt + expiresAt fields
// ============================================================================

// A. Update ActiveCell interface (line ~296):
interface ActiveCell {
  idx: number;
  type: CellType;
  clicked: boolean;
  iceCount?: number;
  holdStart?: number;
  holdRequired?: number;
  spawnedAt?: number;      // ADD: Track when ice cell spawned
  expiresAt?: number;      // ADD: 45s expiry timestamp
}

// B. In spawnActive() — update ice cell creation (line ~636):
if (i === 0 && evolveSpecial === "ice") {
  const now = Date.now();
  return {
    idx,
    clicked: false,
    type: "ice" as CellType,
    iceCount: 2 + Math.floor(Math.random() * 3),
    spawnedAt: now,          // ADD
    expiresAt: now + 45000,  // ADD: 45 second timeout
  };
}

// C. In gameTick() — add expiry check (line ~2306):
ref.current.active.forEach(c => {
  // ADD: Force-mark stuck ice cells as clicked to prevent hang
  if (c.type === "ice" && c.expiresAt && Date.now() > c.expiresAt) {
    c.clicked = true;
    addAnim(ref, set, c.idx, "pop");
    playSound("ok");
    return;  // Skip further processing for this cell
  }
  
  if (!validSlots.has(c.idx) || c.clicked) return;
  // ... rest of existing processing
});

// ============================================================================
// ISSUE #2: bosssSurvived Typo
// ============================================================================

// Simple find & replace in entire App.tsx:
// Find:    bosssSurvived
// Replace: bossSurvived
// (3 s's → 2 s's)

// ============================================================================
// ISSUE #3: inversionSurvived Increments at END, Not START
// ============================================================================

// In gameTick() — rare mode handling (line ~2275):
if (mode === "evolve") {
  if (rareModeRef.current.active) {
    rareModeRef.current.turnsLeft -= 1;
    if (rareModeRef.current.turnsLeft <= 0) {
      // ADD: Increment counter when rare mode ENDS, not starts
      const player = p1Ref.current;  // Adjust for 2P if needed
      player.inversionsSurvived = (player.inversionsSurvived ?? 0) + 1;
      
      rareModeRef.current = { active: false, color: "", cssColor: "", turnsLeft: 0 };
      setRareMode({ active: false, color: "", cssColor: "", turnsLeft: 0 });
      toast$("🟣 Back to Purple!");
    } else {
      setRareMode({...rareModeRef.current});
    }
  } else {
    // ... existing rare color spawn logic (unchanged)
  }
}

// Add to PlayerState interface (line ~305):
interface PlayerState {
  // ... existing fields
  inversionsSurvived?: number;  // ADD
}

// Initialize in makePS() (line ~694):
return {
  cells: Array(25).fill("inactive"),
  active: [],
  // ... existing fields
  inversionsSurvived: 0,  // ADD
};

// ============================================================================
// ISSUE #4: Bot Assist Guard
// ============================================================================

// Add ref at top level (line ~2050):
const botIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

// In startGame() (line ~2372):
const startGame = useCallback(() => {
  const ed = computeEnergy();
  if (ed.count <= 0) {
    toast$("⚡ No energy! Wait or spend 💜 dust to refill.");
    return;
  }
  if (!consumeEnergy()) {
    toast$("⚡ No energy!");
    return;
  }
  setEnergyData(computeEnergy());

  if (loopRef.current) clearTimeout(loopRef.current);
  if (botIntervalRef.current) clearInterval(botIntervalRef.current);  // ADD
  
  p1Ref.current = makePS();
  p2Ref.current = makePS();
  // ... rest of startGame logic
}, [gameTick, sync, toast$, playerName]);

// ============================================================================
// ISSUE #5: hud-val--bump Animation Class Cleanup
// ============================================================================

// Add state to App component (line ~2015):
const [scoreAnimating, setScoreAnimating] = useState(false);

// In handleTap() when score updates (line ~2215):
} else {
  playSound("ok");
  addAnim(ref, set, idx, "pop");
  const mult = Date.now() < ref.current.multiplierEnd ? 2 : 1;
  ref.current.score += mult;
  ref.current.streak += 1;
  ref.current.stageProgress += 1;
  
  // ADD: Trigger animation when score changes
  if (p1 === 1) setScoreAnimating(true);
  
  // ... rest of logic
}

// In PlayerPanel rendering (line ~2783):
<div className={`hud-card hud-card--score`}>
  <div className="hud-lbl">Score</div>
  <div className="hud-score-row">
    <div 
      className={`hud-val${scoreAnimating ? " hud-val--bump" : ""}`}
      onAnimationEnd={() => setScoreAnimating(false)}
    >
      {p1.score}
    </div>
    {p1.streak >= 3 && <div className="combo-wrap">×{p1.streak}</div>}
  </div>
</div>

// Add CSS (if not present in CSS const):
.hud-val--bump {
  animation: hudValBump 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes hudValBump {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

// ============================================================================
// ISSUE #6: bomb--urgent Class — Live Urgency State
// ============================================================================

// In Cell component (line ~749) — update props interface:
function Cell({
  type, animState, keyLabel, showKey, pressing, onTap,
  onHoldStart, onHoldEnd, colorblind, cellShape, counterSpinDur,
  iceCount, holdRequired, holdStart, cellIdx, spawnTime  // ADD spawnTime
}: {
  // ... existing props
  spawnTime?: number;  // ADD
}) {
  const [urgency, setUrgency] = useState(false);

  // ADD: Monitor bomb urgency live
  useEffect(() => {
    if (type !== "bomb" || !spawnTime) return;
    const checkUrgency = () => {
      const elapsed = Date.now() - spawnTime;
      setUrgency(elapsed > 3000);  // Urgent after 3s
    };
    checkUrgency();  // Check immediately
    const id = setInterval(checkUrgency, 100);
    return () => clearInterval(id);
  }, [type, spawnTime]);

  const cls = [
    "cell",
    type,
    animState,
    pressing && type !== "inactive" ? "cell--press" : null,
    urgency && type === "bomb" ? "bomb--urgent" : null,  // UPDATED
  ].filter(Boolean).join(" ");

  // ... rest of component
}

// In PlayerPanel where Cell is rendered (line ~1077):
<Cell
  key={i}
  type={type}
  animState={anim[i] || null}
  keyLabel={keyLabels[keyIdx] || ""}
  showKey={showKeys}
  pressing={pressing.has(i)}
  onTap={() => onTap(i)}
  onHoldStart={() => onHoldStart(i)}
  onHoldEnd={() => onHoldEnd(i)}
  colorblind={colorblind}
  cellShape={mode === "evolve" ? shape : "square"}
  counterSpinDur={counterSpinDur}
  iceCount={activeCell?.iceCount}
  holdRequired={activeCell?.holdRequired}
  holdStart={activeCell?.holdStart}
  cellIdx={i}
  spawnTime={activeCell?.spawnedAt}  // ADD: Pass spawn time
/>

// ============================================================================
// ISSUE #7: Streak Classes — Apply to hud-card--score
// ============================================================================

// In PlayerPanel rendering (line ~2780):
// BEFORE:
// <div className="hud-card hud-card--score">

// AFTER:
<div className={`hud-card hud-card--score${
  p1.streak >= 3 ? (p1.streak >= 5 ? " streak--high" : " streak--mid") : ""
}`}>
  <div className="hud-lbl">Score</div>
  <div className="hud-score-row">
    <div className="hud-val">{p1.score}</div>
    {p1.streak >= 3 && <div className="combo-wrap">×{p1.streak}</div>}
  </div>
</div>

// CSS already exists, no changes needed:
// .hud-card--score.streak--mid .hud-val { ... }
// .hud-card--score.streak--high .hud-val { ... }

// ============================================================================
// ISSUE #8: meta viewport
// ============================================================================
// ✅ FIXED in index.html

// ============================================================================
// ISSUE #9: Add <main> element for accessibility
// ============================================================================

// In App render (line ~2557):
// BEFORE:
// <div className={`root${...}`} style={{...}}>

// AFTER:
<main className={`root${is2P ? " root--2p" : ""}${theme === "light" ? " light-theme" : ""}`}
  style={{ "--cell-1p": cellSizeVar, ...themeVars } as any}>

  {/* All existing content unchanged */}

</main>

// ============================================================================
// ISSUE #10: robots.txt
// ============================================================================
// ✅ FIXED — deployed robots.txt

// ============================================================================
// ISSUE #11: Loading skeleton for FCP/LCP
// ============================================================================
// ✅ FIXED in index.html

// ============================================================================
// ISSUE #12: Lazy-load Sentry
// ============================================================================

// Check imports at top of App.tsx — if Sentry is imported eagerly:
// BEFORE:
// import * as Sentry from "@sentry/react";

// AFTER: Remove from top-level imports, lazy-load instead

// Add in useEffect after appReady (line ~2000+):
useEffect(() => {
  if (!appReady) return;
  
  // Lazy-load Sentry AFTER React hydration completes
  const initSentry = async () => {
    try {
      const SentryModule = await import("@sentry/react");
      SentryModule.init({
        dsn: process.env.REACT_APP_SENTRY_DSN || "",
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
      });
      console.log("[DTP] Sentry initialized (lazy-loaded)");
    } catch (err) {
      console.warn("[DTP-012] Sentry lazy-load failed:", err);
    }
  };
  
  initSentry();
}, [appReady]);

// ============================================================================
// END OF FIXES
// ============================================================================
