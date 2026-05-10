# Soft Launch Patch — index.html

Apply this to your project root `index.html`.

## 1. Replace `<head>` open tag block

**Find** (your current `<head>` content up to the first `<meta charset>`):
```html
  <head>
    <meta charset="UTF-8" />
```

**Replace with:**
```html
  <head>
    <meta charset="UTF-8" />

    <!-- ── Primary Meta ───────────────────────────────────── -->
    <meta name="description" content="Don't Touch the Purple — a fast-paced browser reflex game. Tap safe colors, dodge purple, unlock upgrades. Free to play." />
    <meta name="keywords" content="reflex game, browser game, reaction game, arcade, free game, don't touch purple" />
    <meta name="author" content="MSC Arabia" />
    <meta name="robots" content="index, follow" />

    <!-- ── Open Graph (Facebook, WhatsApp, LinkedIn) ─────── -->
    <meta property="og:type"        content="website" />
    <meta property="og:url"         content="https://game.mscarabia.com/" />
    <meta property="og:title"       content="Don't Touch the Purple" />
    <meta property="og:description" content="Fast-paced reflex game. Tap safe colors. Don't touch purple. Free to play." />
    <meta property="og:image"       content="https://game.mscarabia.com/og-image.png" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name"   content="Don't Touch the Purple" />
    <meta property="og:locale"      content="en_US" />

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

> Replace `YOUR_CLARITY_PROJECT_ID` with your project ID from https://clarity.microsoft.com

---

## 2. Add og-image.png to `public/`

Generate a 1200×630 PNG at `public/og-image.png`.

Quick option — run this Node script once from your project root:

```js
// scripts/gen-og-image.mjs
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#0d0820'); bg.addColorStop(1, '#1e0a46');
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Glow
const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 420);
glow.addColorStop(0, 'rgba(192,38,211,0.22)'); glow.addColorStop(1, 'transparent');
ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

// Border
ctx.strokeStyle = 'rgba(192,38,211,0.5)'; ctx.lineWidth = 3;
ctx.strokeRect(2, 2, W-4, H-4);

// Title
ctx.textAlign = 'center';
ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px sans-serif';
ctx.fillText("DON'T TOUCH THE", W/2, 210);
ctx.fillStyle = '#c026d3'; ctx.font = 'bold 100px sans-serif';
ctx.fillText('PURPLE', W/2, 320);

// Tagline
ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '28px sans-serif';
ctx.fillText('Fast-paced browser reflex game · Free to play', W/2, 390);

// URL
ctx.fillStyle = 'rgba(192,38,211,0.8)'; ctx.font = 'bold 22px sans-serif';
ctx.fillText('game.mscarabia.com', W/2, 560);

writeFileSync('public/og-image.png', canvas.toBuffer('image/png'));
console.log('og-image.png written to public/');
```

Run with: `node --input-type=module < scripts/gen-og-image.mjs`
(requires `npm install canvas` — dev dependency only, not bundled)

---

## 3. Verify with tools

- **OG preview**: https://opengraph.xyz or https://socialsharepreview.com — paste `https://game.mscarabia.com`
- **Twitter card validator**: https://cards-dev.twitter.com/validator
- **Lighthouse**: DevTools → Lighthouse → run on live URL → check PWA + SEO scores

---

## 4. Soft launch checklist

- [ ] `index.html` OG/Twitter meta tags applied
- [ ] `public/og-image.png` generated and deployed
- [ ] Microsoft Clarity project ID filled in
- [ ] Firebase `VITE_FIREBASE_MEASUREMENT_ID` set in InfinityFree env vars
- [ ] Test share card on mobile (WhatsApp preview should show og-image)
- [ ] Lighthouse PWA score ≥ 90
- [ ] First real-player session recorded in Clarity
