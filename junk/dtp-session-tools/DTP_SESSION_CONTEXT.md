# DTP SESSION CONTEXT — v5.6.x
# "Don't Touch the Purple" — Master Handoff Document
# Last updated: May 7, 2026
# Prepared by: Claude Sonnet 4.6

---

## 🎮 Game Identity

- **Name**: Don't Touch the Purple
- **URL**: https://game.mscarabia.com
- **Stack**: React 18 + TypeScript + Vite + Firebase Firestore
- **Hosting**: InfinityFree (free) + Cloudflare CDN (free)
- **Repo**: https://github.com/defaltadmin/donttouchpurple.git
- **Owner**: Mohammed (MSC Arabia / Promise Technology, Riyadh KSA)
- **Stage**: Pre-public. Zero players. Building quality before itch.io listing.
- **Goal**: AAA-feel mobile-first browser reflex game. Free-to-play, $0 infra cost.

---

## 🧠 Architecture Overview

```
App.tsx                          ← root orchestrator (~1700 lines)
├── engine/
│   ├── GameEngine.ts            ← deterministic RAF loop
│   └── DifficultyScaler.ts      ← tick rate / speed curve
├── hooks/
│   ├── useGameEngine.ts         ← React bridge to engine
│   ├── useInputHandler.ts       ← touch + keyboard events
│   └── useBackground.ts         ← background controller
├── components/
│   ├── Backgrounds/             ← 12 canvas backgrounds
│   ├── Cell/index.tsx           ← tap target rendering
│   ├── HUD/                     ← Hearts, Score, Energy, Dust, PwrBar
│   ├── Screens/                 ← Start, GameOver, RewardsHub, etc.
│   ├── Shop/ShopPanel.tsx       ← cosmetics + powerups
│   └── Leaderboard/             ← Firebase top-10
├── services/
│   └── firebase.ts              ← lazy-loaded Firebase (Firestore + Functions)
├── styles/
│   ├── game.css                 ← base styles
│   └── enhancements.css         ← NEW: AAA animation layer (v5.6.0)
├── config/
│   ├── game.ts                  ← GAME constants
│   ├── dailyObjective.ts        ← challenge generation
│   └── powerupWeights.ts        ← shop items + backgrounds
└── utils/
    └── dustAnimation.ts         ← dust fly-to-wallet animation
```

---

## ✅ Confirmed Implemented Features (as of zip upload)

### Core Gameplay
- Classic Mode: infinite reflex grid, 3 lives, speed scales with score
- Evolve Mode: grid stages 1→9, pattern variety, rare color events, hold/multi-tap blocks
- 2-player local mode (split input)
- Bot Assist (Evolve only): auto-taps non-danger cells, 10 dust/sec, improves with dust spent
- Grid Slide mechanic (Evolve ≥ stage 3): 1–2 cells shuffle every 40–60 ticks
- Seed-based replay system: game seed saved, copy/queue replay

### Economy
- Dust currency: earned per game, stored in localStorage
- Shop: themes (8), badges, skins, backgrounds (12), powerups (shield/freeze/multiplier/medpack)
- Energy system: 3 charges, regenerates over time, refillable with dust
- Rewards Hub: 3-tab modal (Daily Check-in, Daily Tasks, Weekly Tasks)
- Login streak with milestone rewards
- Daily/weekly challenges with progress tracking

### Tech
- Firebase Firestore leaderboard (top 10 global)
- Firebase Cloud Functions: `updateStreak`
- Sentry error tracking (integrated)
- GameAnalytics: **CLAIMED in v5.6.1 but `services/gameanalytics.ts` does NOT exist** — NOT IMPLEMENTED
- PWA: manifest.json, service worker, safe-area insets
- Cloudflare CDN serving from InfinityFree

### Backgrounds (12 total, 11 purchasable)
PurpleRain (default), VoidTunnel, StarWarp, GridPulse, Plasma, ParticleWeb,
PurpleCascade, BlockOrbit, DataStream, CellBreath, WarpGate,
PulseField, GlitchGrid, AmbientFlow

### UI
- RewardsHub 3-tab modal
- Energy popup (tap icon → modal with refill options)
- Leaderboard capped at 10, personal best pinned row
- Settings drawer with keybind + seed replay
- Privacy banner (PDPL compliant)
- What's New modal

---

## 🔴 Known Confirmed Bugs (as of this session)

All 13 fixes from this session were applied to the uploaded zip but may or may not have been implemented in the live directory by opencode/Gemini. Run the audit first.

| # | Bug | File | Status |
|---|-----|------|--------|
| 1 | PulseField canvas missing top/left anchor | Backgrounds/PulseField.tsx | Fixed in zip |
| 2 | ParticleWeb/Plasma canvas missing width/height | Backgrounds/*.tsx | Fixed in zip |
| 3 | `refillEnergy` uses stale `dust` state | App.tsx | Fixed in zip |
| 4 | `handleEngineGameOver` has `dust` in deps | App.tsx | Fixed in zip |
| 5 | `scoreSubmittedRef` never reset (all scores after game 1 silently dropped) | App.tsx | Fixed in zip |
| 6 | `gamesPlayed` only incremented for Evolve-tutorial (Classic players never unlock RewardsHub) | App.tsx | Fixed in zip |
| 7 | `onRefillFull` inline callback uses stale `dust` | App.tsx | Fixed in zip |
| 8 | Energy popup "Refill to Full" uses stale `dust` | App.tsx | Fixed in zip |
| 9 | `finalStreak` = 0 always (used dead post-death streak, not peak) | App.tsx | Fixed in zip |
| 10 | `peakStreakRef` never updated in App.tsx (streak5 challenge uncompletable) | App.tsx | Fixed in zip |
| 11 | `handleTutorialClose` increments gamesPlayed before energy guard | App.tsx | Fixed in zip |
| 12 | Duplicate `interface ShopData` in ShopPanel | ShopPanel.tsx | Fixed in zip |
| 13 | `getFirebase` in useEffect dep array (causes extra re-renders) | App.tsx | Debated — see note |

**Note on #13**: `getFirebase` is a module-level function (stable reference), so `[getFirebase]` in deps doesn't cause re-renders in practice. However it's still semantically wrong. Fix by removing it.

---

## ⚠️ v5.6.1 Claims That Were NOT Implemented

These were written in CHANGELOG_v5.6.1.md but the code doesn't show them:

1. **GameAnalytics SDK** — `services/gameanalytics.ts` does not exist. No imports in App.tsx.
2. **Classic mode tutorial for first-timers** — unclear if implemented, needs audit.
3. **Daily objective progress bar in GameOver** — was removed in Phase F2, unclear if restored.

---

## 🚀 Roadmap — Priority Order for Next Sessions

### TIER 1 — Fix Before Going Public (stability/correctness)

1. **Apply all 13 bug fixes** from `dtp-v5.6-patch.zip` if not already done
2. **Verify GameAnalytics** — implement or remove the claim from changelog
3. **Classic mode onboarding** — first-time Classic players should see a 3-second instruction overlay (not the full Evolve tutorial)
4. **Firestore security hardening** — add per-deviceId rate limiting in Cloud Function (current rules are loose)

### TIER 2 — Gameplay Depth (Boss Update)

5. **Bomb Cell (💣)** — high-priority threat, 2s fuse, costs 1 heart if missed
6. **Boss Events** (every 500 score): Inversion, Blackout, Storm
7. **Apex Grid Scaling** — 5×5 patterns more frequent after score 300

### TIER 3 — Icon & Visual Identity

8. **Custom SVG icons** to replace emoji — see Icon Plan below
9. **App icon set** for PWA (192px, 512px, maskable) using generated/designed assets
10. **Splash screen** on PWA launch — full-screen branded, 1.5s

### TIER 4 — Retention & Analytics

11. **GameAnalytics implementation** (free, 100k events/month on free tier)
12. **Firebase Analytics** (already in Firebase project, free) — add basic events
13. **Daily objective variety** — expand beyond 3 types, add weekly variety

### TIER 5 — Pre-Launch Polish

14. **itch.io page prep** — screenshots, GIF capture, description
15. **PWA install prompt** — custom UI for "Add to Home Screen" after 3 games played
16. **Haptic feedback** — `navigator.vibrate()` on cell tap/death (mobile)

---

## 🎨 Icon & Asset Plan (Free Tools)

### Current State
All icons are emoji: 💜🏆⚡🤖💣 etc. These look generic and break on some platforms.

### Recommended Approach (all free)

**Option A — SVG hand-coded** (recommended for game icons, no AI needed)
- Simple geometric shapes matching the game's purple/dark aesthetic
- Grid cell icon, dust particle icon, energy bolt, shield, freeze crystal
- Use Figma free tier or Inkscape

**Option B — AI Image Generation (free)**
- **Google Imagen 3** via Gemini (free with Google account) — best for game assets
- **Stability AI free tier** — https://platform.stability.ai (limited free credits)
- **Adobe Firefly free tier** — 25 generative credits/month
- **DALL-E via Bing Image Creator** — free, unlimited
- Prompt style: "pixel art game icon, [item], purple neon glow, dark background, 512x512, flat design, no text"

**Specific icons needed:**
```
dust.svg          — purple glowing particle/crystal
energy.svg        — lightning bolt, purple
shield.svg        — hexagonal shield, cyan glow
freeze.svg        — snowflake/crystal, blue
multiplier.svg    — 2x badge, orange
medpack.svg       — heart with + symbol, gold
bomb.svg          — round bomb with fuse, red glow
streak.svg        — fire/flame, orange
bot.svg           — robot head, purple
app-icon-192.png  — DTP logo: grid of cells with one purple
app-icon-512.png  — same at 512
```

**Workflow**: Generate with AI → clean up in Figma/Inkscape → export as SVG/PNG → import as React components (SVGR in Vite) or static assets

---

## 🆓 Free Services Already Integrated / Available

| Service | Plan | Usage | Status |
|---------|------|-------|--------|
| Firebase Firestore | Spark (free) | Leaderboard, streak Cloud Function | ✅ Live |
| Sentry | Free (5k errors/mo) | Error tracking | ✅ Live |
| GameAnalytics | Free (unlimited events) | Progression/economy analytics | ❌ Claimed, not implemented |
| Cloudflare CDN | Free | CDN + DNS | ✅ Live |
| InfinityFree | Free | Static hosting | ✅ Live |
| GitHub | Free | Source control | ✅ Live |

### Additional Free Services Worth Adding

| Service | Free Tier | What It Adds |
|---------|-----------|-------------|
| **Firebase Analytics** | Unlimited | Already in your Firebase project! Just add `analytics` init. Gives you DAU, retention, funnels in Firebase console. |
| **Firebase Remote Config** | Free | Toggle features, tune difficulty constants (GAME.*) without redeploying. Critical for tuning when you have real players. |
| **Firebase A/B Testing** | Free | Runs A/B experiments on Remote Config values. Test different dust reward amounts. |
| **Hotjar** | Free (35 sessions/day) | Session recordings + heatmaps. See exactly where users tap. |
| **Microsoft Clarity** | Free (unlimited) | Same as Hotjar but fully free. Session recordings, click maps, rage-click detection. |
| **LogRocket** | Free (1k sessions/mo) | Session replay + console logs. Better than Clarity for debugging. |
| **Plausible** | Self-hosted free | Privacy-friendly analytics. Or use... |
| **Umami** | Free on Vercel | Self-hosted analytics, GDPR compliant, prettier than GA |
| **Web Push (FCM)** | Free via Firebase | Re-engagement notifications: "Your daily reward is ready!" — massive retention boost. |

### Top 3 to implement next:
1. **Firebase Analytics** — 1 line of code, already in your Firebase project
2. **Microsoft Clarity** — paste 2-line script, get session recordings immediately
3. **Web Push / FCM** — requires a service worker update, big retention impact

---

## 🔧 Pre-Session Setup Instructions for Claude

Before starting a new session, have opencode/Gemini prepare this zip:

### What to include in the zip for next Claude session:

```bash
# Run from project root
zip -r dtp-context-$(date +%Y%m%d).zip \
  App.tsx \
  engine/GameEngine.ts \
  engine/DifficultyScaler.ts \
  hooks/useGameEngine.ts \
  hooks/useInputHandler.ts \
  services/firebase.ts \
  services/gameanalytics.ts \
  config/game.ts \
  config/dailyObjective.ts \
  config/powerupWeights.ts \
  components/Screens/GameOver.tsx \
  components/Screens/RewardsHub.tsx \
  components/Screens/StartScreen.tsx \
  components/HUD/EnergyBar.tsx \
  components/HUD/PlayerPanel.tsx \
  components/Shop/ShopPanel.tsx \
  components/Leaderboard/LeaderboardPanel.tsx \
  styles/game.css \
  styles/enhancements.css \
  engine/types.ts \
  CHANGELOG.md \
  package.json \
  vite.config.ts \
  DTP_SESSION_CONTEXT.md
```

### First message to Claude in next session:
```
Here is the full source zip for "Don't Touch the Purple" (React/TypeScript/Vite).
Read every file before doing anything. Current version is v5.6.x.
The DTP_SESSION_CONTEXT.md file has the full game state, known bugs, and roadmap.
Start by confirming what you see in the code, then we'll proceed with [TASK].
```

---

## 🎯 Session Workflow That Works Best

1. **Claude** = architect, reviewer, patch writer (this interface)
2. **opencode CLI** = implementer (applies patches to actual files, runs builds)
3. **Gemini CLI** = file ops, audit, bash tasks (`gemini -p @prompt.md`)
4. **Always build-check**: `.\node_modules\.bin\vite.cmd build` after every change
5. **Always update CHANGELOG.md** at end of session with what was actually done

---

## 📊 Current Analytics Gap

We have Sentry (errors) but NO behavioral analytics. We don't know:
- Where players drop off (score distribution)
- Which game mode is more popular
- Whether the dust economy is balanced
- What backgrounds players buy
- Whether the RewardsHub is being used

This is the single biggest gap to fix before going public.

---

## 💡 QOL Ideas Backlog (not yet planned)

- **Haptic feedback** on tap (`navigator.vibrate([10])`) — 2 lines of code
- **Sound toggle** persisted to localStorage (currently resets each session?)
- **Portrait lock** on mobile (game is portrait-optimized, landscape breaks layout)
- **Pull-to-refresh prevention** on iOS (overscroll bouncing breaks game feel)
- **Prevent text selection** during gameplay (already done? verify)
- **Prevent double-tap zoom** on iOS (`touch-action: manipulation` on cells)
- **Offline fallback page** in service worker (currently shows browser error)
- **Score animation** on leaderboard fetch (numbers count up, not just appear)
- **Confetti burst** on new personal best (lightweight canvas-confetti lib, ~3KB)
- **Keyboard shortcut** `R` for restart on game over (desktop)
- **PWA install badge** in menu after 3 plays if not installed

---

## 🔒 Security Checklist (current state)

| Item | Status |
|------|--------|
| Firebase API key restricted to game.mscarabia.com | ✅ |
| Firestore rules: score cap 9999 | ✅ |
| Firestore rules: timestamp spoofing guard | ✅ |
| DeviceId generated client-side (UUID v4 in localStorage) | ✅ |
| No auth tokens or PII stored | ✅ |
| CSP meta tag in index.html | ✅ |
| PDPL privacy banner | ✅ |
| Rate limiting in Cloud Function | ⚠️ Basic only — needs improvement |
| No server-side score validation (can be spoofed) | ❌ Known limitation of Spark plan |

---

## 📁 File Status

Files confirmed modified in this session (apply from `dtp-v5.6-patch.zip`):

| File | Change |
|------|--------|
| `styles/enhancements.css` | NEW — 700-line animation enhancement layer |
| `App.tsx` | 13 bug fixes (see CHANGELOG_v5.6.md) |
| `components/Screens/GameOver.tsx` | Rewritten — PB detection, NewBestBanner, cleaned |
| `components/Backgrounds/PulseField.tsx` | className fix |
| `components/Backgrounds/ParticleWeb.tsx` | className fix |
| `components/Backgrounds/Plasma.tsx` | className fix |
| `components/Shop/ShopPanel.tsx` | Duplicate interface removed |
