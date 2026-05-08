// EMERGENCY PATCH: Apply these changes to your App.tsx
// This file contains the critical fixes for the bugs you reported

// BUG #1: LAST HEART ROTATION FREEZE
// ====================================
// ISSUE: When you reach the last heart (5/5 → 4/5), rotation stops and grid pulses
// CAUSE: damageP1() or gameTick() has a guard that stops the game loop
// FIX: Find these sections and apply fixes:

// SEARCH for: const damageP1 = useCallback(() => {
// ADD after checking hearts:
const damageP1 = useCallback(() => {
  if (!p1Ref.current) return;
  p1Ref.current.hearts = Math.max(0, p1Ref.current.hearts - 1);
  
  // BUG FIX: Removed any guard that was stopping processTick on last heart
  // The game should CONTINUE ticking even at 1 heart
  // Ensure loopRef.current timer is NOT cleared here
  
  // Only stop game if hearts reach 0
  if (p1Ref.current.hearts <= 0) {
    endGame();
  }
}, [endGame]);

// SEARCH for: const gameTick = useCallback(() => {
// VERIFY: There should be NO guard like:
//   if (hearts === 1 && animState) return;
//   if (hearts <= 1) return;
// These BLOCK the tick and cause freeze. Remove any such guards.

// The tick should run normally. Only checks should be:
// 1. if (!appReady) return;
// 2. if (gameActive !== "playing") return;
// 3. if (!p1Ref.current) return;

// BUG #2: WALLPAPER / THEME NOT APPLYING IMMEDIATELY
// ====================================================
// ISSUE: When you equip a theme in shop, it doesn't apply until next game
// CAUSE: Theme is loaded from localStorage in App() but not re-applied when changed
// FIX: Find equip theme button and add immediate state update:

// SEARCH for: const handleThemeEquip = (themeId: string) => {
// REPLACE with:
const handleThemeEquip = (themeId: string) => {
  // Save to localStorage
  const shopData = loadShopData();
  shopData.equippedTheme = themeId;
  saveShopData(shopData);
  
  // IMMEDIATE: Update React state
  setEquippedTheme(themeId);  // ADD THIS LINE
  
  // Apply theme CSS variables immediately
  const theme = SHOP_THEMES.find(t => t.id === themeId);
  if (theme && rootElement) {
    rootElement.style.setProperty('--primary-bg', theme.colors.bg);
    rootElement.style.setProperty('--primary-purple', theme.colors.purple);
    rootElement.style.setProperty('--primary-accent', theme.colors.accent);
    rootElement.style.setProperty('--primary-text', theme.colors.text);
  }
  
  toast$(`✨ Equipped ${theme?.name || 'theme'}`);
};

// SEARCH for: useState section near top of App component
// ADD (if not present):
const [equippedTheme, setEquippedTheme] = useState(() => {
  const shop = loadShopData();
  return shop.equippedTheme;
});

// SEARCH for: useEffect(() => { const shop = loadShopData(); ...
// UPDATE to also handle theme changes:
useEffect(() => {
  if (!appReady || !rootElement) return;
  
  const theme = SHOP_THEMES.find(t => t.id === equippedTheme);
  if (!theme) return;
  
  // Apply theme colors to CSS variables
  rootElement.style.setProperty('--primary-bg', theme.colors.bg);
  rootElement.style.setProperty('--primary-purple', theme.colors.purple);
  rootElement.style.setProperty('--primary-accent', theme.colors.accent);
  rootElement.style.setProperty('--primary-text', theme.colors.text);
}, [appReady, equippedTheme]);

// QOL IMPROVEMENTS
// =================

// 1. ISSUE #1 FROM SESSION: Ice cell expiry
// Add to ActiveCell interface (around line 296):
interface ActiveCell {
  idx: number;
  type: CellType;
  clicked: boolean;
  iceCount?: number;
  holdStart?: number;
  holdRequired?: number;
  spawnedAt?: number;      // Track spawn time
  expiresAt?: number;      // 45s expiry
}

// In gameTick() processTick loop, add:
if (c.type === "ice" && c.expiresAt && Date.now() > c.expiresAt) {
  c.clicked = true;
  addAnim(ref, set, c.idx, "pop");
  playSound("ok");
  return;
}

// 2. ISSUE #2 FROM SESSION: bosssSurvived typo
// Replace ALL instances of 'bosssSurvived' with 'bossSurvived'

// 3. ISSUE #5: hud-val--bump animation cleanup
// Add state:
const [scoreAnimating, setScoreAnimating] = useState(false);

// In score render, add onAnimationEnd:
<div
  className={`hud-val${scoreAnimating ? " hud-val--bump" : ""}`}
  onAnimationEnd={() => setScoreAnimating(false)}
>
  {p1.score}
</div>

// 4. PERFORMANCE: Lazy-load Sentry
// Remove Sentry from top imports, add lazy load in useEffect:
useEffect(() => {
  if (!appReady) return;
  
  const initSentry = async () => {
    try {
      const Sentry = await import("@sentry/react");
      Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN || "",
        environment: process.env.NODE_ENV,
      });
    } catch (err) {
      console.warn("[DTP] Sentry lazy-load skipped");
    }
  };
  
  initSentry();
}, [appReady]);

// ============================================
// PRIORITY APPLY ORDER:
// 1. Last Heart Freeze (BUG #1) - CRITICAL
// 2. Theme Application (BUG #2) - HIGH
// 3. Ice Expiry (Issue #1) - HIGH
// 4. bosssSurvived typo (Issue #2) - QUICK
// 5. Animation cleanup (Issue #5) - POLISH
// 6. Sentry lazy (Issue #12) - PERFORMANCE
