# Taste-Skill Anti-Slop Audit: Don't Touch Purple

**Date:** 2026-06-01
**Scope:** StartScreen, GameOver, HowToPlay, SettingsDrawer, App.tsx (HUD/gameplay), HUD components, BossOverlay, DESIGN.md, index.html
**Skill:** taste-skill (section 9 anti-slop checks)

---

## Design Read

A hyper-juice arcade game for casual/mobile gamers. Dark-cyberpunk synthwave aesthetic, fully custom design system in DESIGN.md (MD3 tokens mapped to CSS vars). Bespoke CSS + GSAP + Framer Motion + OGL/WebGL backgrounds. Not a marketing site -- the taste-skill's landing-page rules (hero discipline, bento grids, eyebrow counts, "Trusted by" strips) are structurally irrelevant. This audit covers the applicable subset: em-dash ban, AI-copy tells, color purity, neon glow defaults, filler verbs, middle-dot overuse, fake UI, and motion discipline.

---

## Three Dials

| Dial | Score | Notes |
|------|-------|-------|
| **DESIGN_VARIANCE** | 6/10 | Appropriate for a game. Menu is centered glassmorphism card; gameplay is grid-based with floating HUD. Not asymmetric marketing layout, and that's correct. |
| **MOTION_INTENSITY** | 8/10 | Heavy: GSAP score count-up + staggered cell/button entrances, Framer Motion overlay transitions, CSS pulse/shimmer/glow keyframes, 20 OGL WebGL backgrounds, magnetic button, mouse follower + trail, dotlottie boss intros. Slightly overshooting -- some ambient loops lack motivation. Respectable for an arcade game. |
| **VISUAL_DENSITY** | 7/10 | HUD during gameplay is cockpit-level (score, best, speed, hearts, power bar, bot toggle, dust widget, pause). Menu screen is cleaner (5/10). Density suits the genre but the HUD stack borders on clutter during high-streak moments. |

---

## Findings

### F1. Em-Dashes in GameOver Snark Messages [HIGH]

**File:** `components/Screens/GameOver.tsx:12-18`
**What:** Five em-dashes (U+2014) in the MESSAGES array, visible to every player on every game over:
- `"10+ — technically not a complete disaster."` (line 12)
- `"20+ — you have actual reflexes. Interesting."` (line 13)
- `"75+ — researchers want to study your hands."` (line 16)
- `"100+ — this score belongs in a museum."` (line 17)
- `"150+ — we need to talk about your reflexes."` (line 18)

**Fix:** Replace ` — ` with ` - ` (hyphen) in all five strings.
**Severity:** High -- em-dashes are the #1 LLM visual tell. These are the most-seen strings in the entire game.

---

### F2. Em-Dashes in HowToPlay Descriptions [HIGH]

**File:** `components/Screens/HowToPlay.tsx:58-59, 81, 92`
**What:** Four em-dashes in user-facing instructional content:
- Line 58: `<b>Classic</b> — {desc}`
- Line 59: `<b>Evolve</b> — {desc}`
- Line 81: `<b>Storm</b> — {desc}` (boss events)
- Line 92: `<b>Two Game Modes</b> — {desc}` (features)

**Fix:** Replace ` — ` with ` - ` in all four template literals.
**Severity:** High -- HowToPlay is the info hub; visible to every new player.

---

### F3. Em-Dashes in EnergyPopup Buttons [MEDIUM]

**File:** `components/Screens/EnergyPopup.tsx:41, 46`
**What:** Em-dashes in button labels:
- Line 41: `Refill 1 — 50 dust`
- Line 46: `Refill Full — X dust`

**Fix:** Use hyphen: `Refill 1 - 50` or restructure to `Refill 1 (50 dust)`.
**Severity:** Medium -- button text, less prominent than messages but still user-facing.

---

### F4. Em-Dashes in DevOverlay and PauseOverlay [LOW]

**File:** `components/Settings/DevOverlay.tsx:226-228`, `components/Screens/PauseOverlay.tsx:54`, `components/Settings/BuildDeploySection.tsx:109`
**What:** Em-dashes used as placeholder/separator:
- DevOverlay: `"—"` as empty tick timing placeholder (dev-only)
- PauseOverlay: `"—"` as empty streak display
- BuildDeploySection: `Preview ON — changes affect live game` (dev-only)

**Fix:** Low priority -- dev-only UI and non-gameplay display. Replace with hyphens for consistency.
**Severity:** Low -- dev-only or rarely seen.

---

### F5. Middle-Dot (·) Overuse [MEDIUM]

**File:** `components/Screens/GameOver.tsx:211`, `components/Settings/SettingsDrawer.tsx:185`, `App.tsx:1732`
**What:** Middle-dot used as a universal separator in three distinct contexts:
- GameOver share card canvas: `Classic Mode · Seed 12345`
- SettingsDrawer: `Player Name · {playerName}`
- App footer: `By Mohammed Ahmed Siddiqui · mscarabia.com`

**Fix:** Reduce to max 1 instance. Footer credit is fine. Settings label should drop the middle-dot (show name in the button, not the label). Share card can use `-` or just line break.
**Severity:** Medium -- three different contexts using the same decorative separator pattern.

---

### F6. Hardcoded Hex Colors Bypassing Design Tokens [MEDIUM]

**File:** `components/Screens/GameOver.tsx:44,133,135,195-213`, `components/HUD/ScoreFloat.tsx:47`, `components/Screens/HowToPlay.tsx:48-54`
**What:** Hardcoded hex values instead of CSS custom properties:
- GameOver NewBestBanner: `#f9bd22`, `#f59e0b` (lines 44)
- GameOver 2P labels: `#60a5fa` (P1), `#f472b6` (P2) (lines 133, 135)
- GameOver share card canvas: 15+ hardcoded hex values (lines 195-213)
- ScoreFloat: `#ff6b6b`, `#ffd93d`, `#ffffff` (line 47)
- HowToPlay: `#dde4ee`, `#a855f7`, `#fcd34d`, `#67e8f9`, `#bfdbfe`, `#fb923c`, `#ff4400` (lines 48-54)

**Fix:** Migrate to CSS vars where possible. Canvas share card is an exception (canvas doesn't read CSS vars without helper).
**Severity:** Medium -- theme switching is incomplete when colors bypass tokens.

---

### F7. Emoji as Functional UI Icons [MEDIUM]

**File:** `components/Screens/StartScreen.tsx:297-299,362`, `components/Screens/GameOver.tsx:163,167,224,232`, `components/Screens/PauseOverlay.tsx`, `components/HUD/GameHeader.tsx:41-42`, `App.tsx:1698`
**What:** Emojis used as interactive UI elements alongside the project's own SVG Icon system:
- StartScreen: `🔧`, `👤`, `✎`, `⌨` for player pill and keybind
- GameOver: `▶`, `🔗`, `☰`, `🖼️`, `📋`, `🐛` for buttons
- GameHeader: `⏸`, `⚙` for pause/settings
- App: `🎮` for gamepad badge

**Fix:** Extend the existing Icon component (`components/UI/Icon.tsx`) with missing glyphs and replace emojis. The project already has SVG icons for star, trophy, fire, bolt, info, share -- extend for pause, settings, gamepad, keyboard, edit, copy, image, bug.
**Severity:** Medium -- mixing emoji and SVG icons is inconsistent and emojis render differently across platforms.

---

### F8. GameOver Snark Voice Uniformity [MEDIUM]

**File:** `components/Screens/GameOver.tsx:9-19`
**What:** All 9 score buckets use the same sarcastic register with forced metaphors:
- "The purple filed a formal complaint" (75-99)
- "Researchers want to study your hands" (75-99)
- "Scientists want to study your nervous system" (150+)
- Every bucket follows: [hyperbolic claim] + [mock-scientific observation]

**Fix:** Vary the voice across score ranges. Low scores could be deadpan/dry, mid-range competitive, high-range genuinely impressed. Mix registers instead of uniform snark.
**Severity:** Medium -- the uniform sarcastic tone across all ranges reads as AI-generated copy. Some messages are genuinely funny (the 0-4 range is strong), but the template is visible.

---

### F9. "Everything You Get" Filler Section Title [LOW]

**File:** `components/Screens/HowToPlay.tsx:88`
**What:** `<motion.h3 className="how-section-title">Everything You Get</motion.h3>` -- this is a generic marketing section header that doesn't match the game's voice.

**Fix:** Rename to something direct: "Features" or "What's Inside" or just list the items without a section header.
**Severity:** Low -- one instance, not in the hero, in a secondary info screen.

---

### F10. MagneticButton Uses React State for Pointer Tracking [LOW]

**File:** `components/Screens/StartScreen.tsx:70-71, 100`
**What:** `useState` for `position` and `isActive` triggers re-renders on every mousemove. Also uses `window.addEventListener("mousemove")` instead of element-scoped `pointermove`.

**Fix:** Use `useMotionValue` + `useTransform` for position. Scope listener to the element wrapper via `pointermove`/`pointerleave`.
**Severity:** Low -- menu screen only, single button, no visible perf issue. Pattern violation only.

---

### F11. Onboarding Text Uses Generic Step Labels [LOW]

**File:** `App.tsx:1330-1331`
**What:** `"Tap green"` and `"Avoid purple"` as hint steps. These are functional tutorial text, not generic "Stage 1" labels. Actually fine.

**Fix:** N/A -- this is game-mechanic instruction, not slop.
**Severity:** None -- false positive on review. Keeping for completeness.

---

## What the Game Gets Right

1. **No pure black (#000000).** Background is `#151028` (deep cosmic indigo), text is `#e7deff` (warm lilac). Only SVG gradient stop uses #000000 (Icon.tsx filter). Passes.
2. **No version labels (BETA, EARLY ACCESS) in hero.** Clean.
3. **No "Elevate", "Seamless", "Unleash", "Next-Gen" filler verbs.** Zero instances found.
4. **No scroll cues ("Scroll to explore").** None.
5. **No fake product UI built from divs.** The share card canvas is functional (generates downloadable PNG).
6. **No section-number eyebrows (01 / INDEX).** The `go-eyebrow` class shows "Game Over" / "Round Over" -- a screen title, not a numbered section.
7. **No decorative status dots on every item.** Pips in EnergyBar/PwrBar are functional indicators.
8. **No 3-column equal feature cards.** HowToPlay uses a vertical list layout with icon+text rows, not equal-weight card grids.
9. **Custom typography.** Fredoka One (display) + Nunito (body) -- personality-driven, not Inter/Geist.
10. **Glassmorphism with intent.** `backdrop-filter: blur(20px)` + 1px hairline borders are the brand, not generic frosted glass.
11. **Neon glows are by design.** The game's core mechanic is "Don't Touch Purple" -- the purple glow IS the product. DESIGN.md explicitly lists "Atmospheric Glows" as a brand pillar.
12. **WebGL backgrounds are lazy-loaded** with `React.lazy` + `Suspense`.
13. **Reduced motion respected** at the engine level via CSS vars `--motion-scale` and `--particles-enabled`.
14. **No neon outer-glow on default.** The grid-skin--neon is a purchasable shop skin, not the default state.
15. **Strong mechanical identity.** 3D bevel buttons, tactile Z-axis movement, spring transitions are distinctive.

---

## Summary

| Category | Count | Severity Breakdown |
|----------|-------|-------------------|
| Em-dash violations | 4 findings (13 instances) | 2 High, 1 Medium, 1 Low |
| Middle-dot overuse | 1 finding (3 instances) | 1 Medium |
| Hardcoded hex colors | 1 finding (25+ instances) | 1 Medium |
| Emoji as UI icons | 1 finding (15+ instances) | 1 Medium |
| AI-copy voice uniformity | 1 finding | 1 Medium |
| Filler section title | 1 finding | 1 Low |
| Performance pattern | 1 finding | 1 Low |

**Top 3 quick wins:**
1. Find-replace ` — ` with ` - ` in GameOver.tsx, HowToPlay.tsx, EnergyPopup.tsx (5 min, eliminates the #1 tell)
2. Extend Icon.tsx with missing glyphs (pause, settings, gamepad, keyboard, edit, copy, image, bug) and replace emoji usage (30 min)
3. Replace "Everything You Get" with "Features" in HowToPlay.tsx (1 min)

**Overall taste-skill score: 7.5/10** for a game UI. The design system is strong, the visual identity is distinctive (not generic AI aesthetics), and the slop surface is small. The em-dash issue is the most actionable -- it's a mechanical find-replace that eliminates the biggest visual tell. The emoji/icon inconsistency and hardcoded hex values are migration work but not urgent.
