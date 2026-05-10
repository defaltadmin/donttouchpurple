# DTP v5.7.0 — CLI Handoff Prompt for Gemini / opencode
# Run this from your project root: the folder containing App.tsx, package.json, vite.config.ts

---

## Context

You are working on "Don't Touch the Purple" (game.mscarabia.com) — a React/TypeScript/Vite browser reflex game. This handoff covers everything needed to apply a patch, clean up the repo, build, verify, and prepare the final upload to InfinityFree hosting.

The attached zip `dtp-v5.7.0-patch.zip` contains 8 patched source files from a Claude session. All changes were verified (15/15 logic checks, balanced braces). Your job is to apply them, clean up, build, test, and hand back a confirmed changelog.

---

## Step 1 — Apply the Patch Files

Extract `dtp-v5.7.0-patch.zip` and copy each file to its correct project location, overwriting existing files:

```
dtp-v5.7.0-patch.zip contents → project destination
─────────────────────────────────────────────────────
App.tsx                           → App.tsx                           (project root or src/)
engine/GameEngine.ts              → engine/GameEngine.ts
engine/types.ts                   → engine/types.ts
hooks/useGameEngine.ts            → hooks/useGameEngine.ts
config/dailyObjective.ts          → config/dailyObjective.ts
components/Screens/GameOver.tsx   → components/Screens/GameOver.tsx
components/Cell/index.tsx         → components/Cell/index.tsx
styles/enhancements.css           → styles/enhancements.css
```

Do this now. Confirm each file was replaced.

---

## Step 2 — Housekeeping: Clean Up Project Junk

The repo has accumulated stale files. Identify and remove any of the following if found:

```bash
# Stale build artifacts
rm -rf dist/

# Old session handoff files in root (keep only the latest)
# Remove any: dtp-context-handoff*.zip, *.zip in root, *.tar.gz in root
find . -maxdepth 1 -name "*.zip" -delete
find . -maxdepth 1 -name "*.tar.gz" -delete

# Orphaned .md files in root that are not README.md or CHANGELOG.md
# (session notes, old prompts, scratch files) — list them first, then delete
find . -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "CHANGELOG.md" -ls

# Dead/duplicate components (check before deleting):
# - Any component file that is imported nowhere
# - Any .bak, .orig, .old files anywhere in src/
find . -name "*.bak" -o -name "*.orig" -o -name "*.old" | grep -v node_modules

# Large or unnecessary files in public/ (anything > 500KB that isn't an icon/font)
find public/ -size +500k -ls

# Check for duplicate CSS files or empty style files
find styles/ -name "*.css" -empty

# .DS_Store and system files
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete
```

List everything you're about to delete, wait — then delete. Do not remove: `node_modules/`, `public/manifest.json`, `public/icons/`, `public/sw.js`, `.env`, `.env.local`, `vite.config.ts`, `tsconfig*.json`.

---

## Step 3 — TypeScript + Lint Check

```bash
# Check for TypeScript errors
npx tsc --noEmit

# If tsc reports errors, fix them before proceeding.
# Expected: zero errors. The patch files are verified clean.
```

---

## Step 4 — Build

```bash
npm run build
# or if using vite directly:
.\node_modules\.bin\vite.cmd build
```

Expected output: `dist/` folder created, no errors. Note the bundle sizes. If build fails, report the exact error — do NOT attempt to auto-fix without reporting first.

---

## Step 5 — Local Preview

```bash
npx vite preview
# or
.\node_modules\.bin\vite.cmd preview
```

Open the local URL (usually http://localhost:4173) and do a quick smoke test:

**Manual test checklist:**
- [ ] Game loads, menu appears
- [ ] Start Classic mode — play to 10+ score, confirm no console errors
- [ ] Start Evolve mode — play to score 100+ — confirm a Boss Event fires (banner appears at top)
- [ ] During boss event: Storm (cells shuffle faster), Inversion (banner says INVERSION), Blackout (screen dims)
- [ ] A Bomb cell (💣) appears with live countdown timer (e.g. `1.8s`)
- [ ] Tapping bomb shows toast "💣✓ Defused!"
- [ ] Game Over screen → click Share → canvas score card image renders
- [ ] "Save Card" button downloads a PNG
- [ ] "Copied!" text appears (not "Coped!")
- [ ] Daily Objective in Game Over shows progress bar

If all pass: proceed to Step 6.
If any fail: report exact failure with console output.

---

## Step 6 — Apply index.html Soft Launch Patch

Open `index.html` (project root). Find the `<head>` section. Add the following block immediately after `<meta charset="UTF-8" />`:

```html
<!-- ── Primary Meta ───────────────────────────────────── -->
<meta name="description" content="Don't Touch the Purple — a fast-paced browser reflex game. Tap safe colors, dodge purple, unlock upgrades. Free to play." />
<meta name="keywords" content="reflex game, browser game, reaction game, arcade, free game, don't touch purple" />
<meta name="author" content="MSC Arabia" />
<meta name="robots" content="index, follow" />

<!-- ── Open Graph (Facebook, WhatsApp, LinkedIn) ─────── -->
<meta property="og:type"         content="website" />
<meta property="og:url"          content="https://game.mscarabia.com/" />
<meta property="og:title"        content="Don't Touch the Purple" />
<meta property="og:description"  content="Fast-paced reflex game. Tap safe colors. Don't touch purple. Free to play." />
<meta property="og:image"        content="https://game.mscarabia.com/og-image.png" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name"    content="Don't Touch the Purple" />
<meta property="og:locale"       content="en_US" />

<!-- ── Twitter / X Card ──────────────────────────────── -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:url"         content="https://game.mscarabia.com/" />
<meta name="twitter:title"       content="Don't Touch the Purple" />
<meta name="twitter:description" content="Fast-paced reflex game. Tap safe colors. Don't touch purple. Free to play." />
<meta name="twitter:image"       content="https://game.mscarabia.com/og-image.png" />

<!-- ── Canonical ─────────────────────────────────────── -->
<link rel="canonical" href="https://game.mscarabia.com/" />

<!-- ── Microsoft Clarity ─────────────────────────────── -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","YOUR_CLARITY_PROJECT_ID");
</script>
```

⚠️ Replace `YOUR_CLARITY_PROJECT_ID` with the actual ID from https://clarity.microsoft.com

Then generate `public/og-image.png` using this Node script (run once, then discard):

```bash
# Install canvas temporarily (dev only)
npm install --save-dev canvas

# Create gen script
cat > scripts/gen-og-image.mjs << 'EOF'
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('public', { recursive: true });
const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#0d0820'); bg.addColorStop(1, '#1e0a46');
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 420);
glow.addColorStop(0, 'rgba(192,38,211,0.22)'); glow.addColorStop(1, 'transparent');
ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = 'rgba(192,38,211,0.5)'; ctx.lineWidth = 3;
ctx.strokeRect(2, 2, W-4, H-4);
ctx.textAlign = 'center';
ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px sans-serif';
ctx.fillText("DON'T TOUCH THE", W/2, 210);
ctx.fillStyle = '#c026d3'; ctx.font = 'bold 100px sans-serif';
ctx.fillText('PURPLE', W/2, 320);
ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '28px sans-serif';
ctx.fillText('Fast-paced browser reflex game · Free to play', W/2, 390);
ctx.fillStyle = 'rgba(192,38,211,0.8)'; ctx.font = 'bold 22px sans-serif';
ctx.fillText('game.mscarabia.com', W/2, 560);
writeFileSync('public/og-image.png', canvas.toBuffer('image/png'));
console.log('✅ public/og-image.png generated (1200×630)');
EOF

node scripts/gen-og-image.mjs
```

After generating, run `npm run build` again so the image is included in `dist/`.

---

## Step 7 — Update CHANGELOG.md

Open `CHANGELOG.md` and prepend the contents of `CHANGELOG_v5.7.0.md` (included in the zip) at the top, directly after the `# Don't Touch the Purple — Changelog` heading.

The new entry covers v5.7.0 — Boss Update session.

---

## Step 8 — Final Build for Deployment

```bash
npm run build
```

Confirm `dist/` contains:
- `index.html`
- `assets/` folder with JS/CSS bundles
- `og-image.png` in root of dist
- `manifest.json`
- `sw.js` (service worker)

---

## Step 9 — Upload to InfinityFree (htdocs)

Upload the **entire contents of `dist/`** (not the dist folder itself — its contents) to your InfinityFree `htdocs/` folder.

```
dist/index.html      → htdocs/index.html
dist/assets/         → htdocs/assets/
dist/og-image.png    → htdocs/og-image.png
dist/manifest.json   → htdocs/manifest.json
dist/sw.js           → htdocs/sw.js
(etc. — all files)
```

Use FileZilla, InfinityFree File Manager, or rsync. Overwrite all existing files.

---

## Step 10 — Confirm & Handoff Back to Claude

Once complete, report back to Claude with:

**1. Build output** — paste the vite build summary (bundle sizes, any warnings)

**2. Smoke test results** — confirm each item on the Step 5 checklist passed or note what failed

**3. Updated CHANGELOG.md** — paste the first 60 lines of your updated CHANGELOG.md so Claude can cross-check that v5.7.0 is correctly prepended

**4. Live URL check** — after upload, open https://game.mscarabia.com and confirm:
  - Game loads
  - No console errors
  - WhatsApp share preview (send link to yourself via WhatsApp) shows og-image

**5. Any issues encountered** — list anything unexpected: TypeScript errors, missing files, build warnings, deploy failures

Claude will crosscheck your CHANGELOG against the session record and confirm everything is accounted for.

---

## Summary of What Changed (for your reference)

| File | What changed |
|------|-------------|
| `engine/types.ts` | BombCell, BossEvent, snapshot fields, new events |
| `engine/GameEngine.ts` | Bomb spawn/explode, 3 boss events, inversion logic |
| `hooks/useGameEngine.ts` | Bomb/boss sounds, 2 new callbacks |
| `components/Cell/index.tsx` | Live countdown timer on bomb cells |
| `components/Screens/GameOver.tsx` | Canvas score card image, Save Card button, typo fix |
| `config/dailyObjective.ts` | 3 new objective types + counter interface |
| `styles/enhancements.css` | Bomb CSS, boss banners, blackout, full share card CSS |
| `App.tsx` | Boss banner, blackout overlay, counter state, callbacks |
| `index.html` | OG/Twitter meta, Clarity script (Step 6, manual) |
| `public/og-image.png` | Generate via script in Step 6 |
