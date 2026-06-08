# Amazon Q Audit — v7.6.1
**Date:** 2026-06-03
**Reviewer:** Amazon Q Developer
**Scope:** Full audit of both projects — Don't Touch Purple (game) + MSC Arabia (corp site)
**Files reviewed:** services/gameanalytics.ts, services/firebase.ts, index.html, firebase.json, functions/src/index.ts, vite.config.ts, engine/GameEngine.ts (partial), engine/subsystems/TickProcessor.ts, MSCArabia.com/index.html, MSCArabia.com/_headers, MSCArabia.com/sitemap.xml

---

## Project 1: Don't Touch Purple (game.mscarabia.com)

### 🔴 Critical

**[CRIT-001] CSP missing Cloudflare Worker + GameAnalytics connect origins**
- File: `firebase.json` — `Content-Security-Policy` header, `connect-src` directive
- The Cloudflare Worker URL (score validator) and GameAnalytics SDK outbound endpoints are not in `connect-src`. Score submissions and analytics events will be blocked by the browser in production with no visible error to the user.
- Fix: Add the Worker URL (e.g. `https://score-validator.<subdomain>.workers.dev` or its custom domain) and `https://api.gameanalytics.com` to `connect-src`.

**[CRIT-002] `ensureAuth()` race condition on retry**
- File: `services/firebase.ts` — `ensureAuth()` function
- On auth failure, `authReady = null` is set to allow retry. If two concurrent callers hit `ensureAuth()` simultaneously during this window, both receive `null` and both start competing `signInAnonymously()` calls, potentially creating two anonymous sessions.
- Fix: Replace the null-reset pattern with a dedicated `isRetrying` boolean flag so only one retry is in flight at a time, or use a proper mutex.

**[CRIT-003] Score cap of 9999 silently truncates high Evolve scores**
- File: `services/firebase.ts` — `normalizeGlobalScoreEntry()`, line with `Math.min(9999, ...)`
- Evolve mode with survival bonuses and streak multipliers can legitimately exceed 9999. This cap silently corrupts leaderboard entries before they reach Firestore.
- Fix: Raise the cap to a realistic maximum (e.g. `99999`) aligned with the actual game's theoretical score ceiling, or remove it and rely on the Worker's server-side validation instead.

---

### 🟡 Warning

**[WARN-001] Engine directly mutates DOM CSS vars — violates architecture rule**
- File: `engine/GameEngine.ts` — `updatePerformanceMetrics()` method
- Calls `document.documentElement.style.setProperty('--particles-enabled', ...)` directly from inside the engine. The engine is meant to be pure (zero DOM/React access) per AGENTS.md rule #1. This breaks testability and will fail in SSR/test environments.
- Fix: Replace the direct DOM mutations with `this.emit({ type: "qualityDowngrade", ... })` / `this.emit({ type: "qualityUpgrade", ... })` events. The existing event types already exist — just move the CSS var writes into the React hook that handles these events (e.g. in `useGameEngine`).

**[WARN-002] `base: './'` in vite.config.ts is wrong for Firebase Hosting**
- File: `vite.config.ts` — `base` option
- Firebase Hosting serves from root. `'./'` produces relative asset URLs (`./assets/js/...`) which break if a page is loaded from a non-root path, or when the service worker intercepts navigation to sub-paths.
- Fix: Change `base: './'` to `base: '/'`.

**[WARN-003] CSP missing `recaptchaenterprise.googleapis.com` for App Check**
- File: `firebase.json` — `Content-Security-Policy`, `connect-src`
- App Check uses reCAPTCHA v3 which calls `https://recaptchaenterprise.googleapis.com` for token generation and refresh. This origin is absent from `connect-src`. App Check token refresh will silently fail, causing Firestore writes to be rejected once enforcement is active.
- Fix: Add `https://recaptchaenterprise.googleapis.com` to `connect-src`.

**[WARN-004] `updateStreak` Cloud Function uses client-generated device ID as Firestore doc key**
- File: `functions/src/index.ts` — `updateStreak` callable
- `deviceId` is supplied by the client and used as the Firestore document key in `streaks/{deviceId}`. An attacker with many synthetic device IDs can create unbounded Firestore documents at no cost. The function already requires `context.auth`, so `context.auth.uid` should be the canonical key instead.
- Fix: Replace `const streakRef = admin.firestore().collection("streaks").doc(deviceId)` with `admin.firestore().collection("streaks").doc(context.auth.uid)`. Remove the `deviceId` input requirement.

**[WARN-005] Dynamic `import()` inside `scheduleTimeout` for achievement unlock**
- File: `engine/subsystems/TickProcessor.ts` — `_triggerBossEvent()`, inside the `scheduleTimeout` callback
- `import('../../utils/achievements').then(m => m.achievementSystem.unlock('boss_inversion')).catch(() => {})` fires on every inversion boss completion. If the module fails to load the unlock is silently lost with no retry. The module is almost certainly already loaded at this point — the dynamic import is unnecessary overhead.
- Fix: Pass `achievementSystem` through `TickContext` or import it statically at the top of `TickProcessor.ts`. Remove the dynamic import.

**[WARN-006] Sentry sourcemap upload pattern uploads all `dist/**` assets**
- File: `vite.config.ts` — `sentryVitePlugin` config, `sourcemaps: { assets: './dist/**' }`
- This uploads CSS, images, and other non-JS files to Sentry, wasting upload quota and slowing CI sourcemap upload.
- Fix: Change to `sourcemaps: { assets: './dist/**/*.js' }`.

**[WARN-007] `VITE_GA_SECRET_KEY` exposed in client bundle**
- File: `services/gameanalytics.ts` — `GA_SECRET_KEY` constant
- `VITE_GA_SECRET_KEY` is baked into the Vite bundle at build time and is visible in `dist/`. The GameAnalytics v4 web SDK only requires the game key for client-side use. The secret key is for server-side REST API calls only.
- Fix: Remove `GA_SECRET_KEY` / `VITE_GA_SECRET_KEY` from the client entirely. If server-side GA events are needed, call the REST API from a Cloudflare Worker.

---

### 🔵 Info / Suggestion

**[INFO-001] Redundant `<link rel="preload">` alongside `media="print"` font pattern**
- File: `index.html` — font loading section
- `<link rel="preload" as="style">` + `<link media="print" onload>` for the same URL causes a double fetch in some browsers. The `preload` tag is redundant — remove it and keep only the `media="print"` trick with the `<noscript>` fallback.

**[INFO-002] No custom 404 configuration in `firebase.json`**
- File: `firebase.json` — `hosting` section
- The `**` SPA rewrite serves `index.html` for all paths, which is correct, but there's no dedicated 404 page entry. For unknown asset paths (e.g. a broken image URL) Firebase serves its own generic HTML 404 that bypasses the SPA. Consider adding `"404": "/index.html"` or a custom `404.html`.

**[INFO-003] `clientDate` parameter accepted but explicitly ignored in `updateStreak`**
- File: `functions/src/index.ts`
- `data?.clientDate` is accepted by the callable but the comment says "Always use server date" and the value is unused. This is dead parameter surface that could confuse callers.
- Fix: Remove `clientDate` from the function's accepted input. Update `fbGetStreak()` in `services/firebase.ts` to stop passing it.

**[INFO-004] `_slotsCache` WeakMap fragility — undocumented reference identity assumption**
- File: `engine/subsystems/TickProcessor.ts` — `_slotsCache` WeakMap
- The cache only hits if the exact same object reference is passed (i.e. `EVOLVE_PATTERNS[idx]`). If any caller spreads a pattern (`{ ...pat }`), the cache misses silently and a new Set is allocated every tick. This is currently safe but fragile.
- Fix: Add a comment: `// WeakMap key MUST be the exact EVOLVE_PATTERNS[idx] reference — do not spread.`

**[INFO-005] Production sourcemaps served publicly via Firebase Hosting**
- File: `vite.config.ts` — `sourcemap: true`
- `.js.map` files are emitted into `dist/` and served publicly, exposing original TypeScript source. Sentry only needs the maps uploaded to its servers, not hosted publicly.
- Fix: Change `sourcemap: true` to `sourcemap: 'hidden'`. This generates maps for Sentry upload without embedding the `//# sourceMappingURL` comment that causes browsers to fetch them. Add a `firebase.json` headers rule for `**/*.map` returning 404 as an extra layer.

---

### ✅ Good

- Lazy Firebase init via `getFirebase()` singleton — no top-level Firebase imports in App.tsx.
- `normalizeGlobalScoreEntry` sanitizes initials, date format, mode, and badge before Firestore writes — defense in depth on top of Firestore rules.
- `ensureAuth()` called before every Firestore operation — correct anonymous auth flow.
- `getDeviceId()` gates localStorage persistence behind `dtp:telemetry-consent` check.
- `IS_PROD` guard on all analytics/GA/Firebase calls — dev environment stays clean.
- `TickProcessor.processTick()` wrapped in try/catch with `triggerGameOver(null)` fallback — engine errors cannot silently lock up the game.
- `firebase.json` security headers are comprehensive: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Referrer-Policy` all present and correctly configured.
- Font loading in `index.html` uses `media="print"` async pattern with `<noscript>` fallback — no render-blocking fonts.
- App Check initialization is guarded by `IS_PROD` and fails gracefully if `VITE_FIREBASE_RECAPTCHA_SITE_KEY` is not set.
- `fbGetStreak` validates the returned streak value with `isFinite` + range clamp + `getLocalStreakFallback()` — robust against Cloud Function failures.

---

## Project 2: MSC Arabia (mscarabia.com)

### 🔴 Critical

**[CRIT-004] `script-src 'unsafe-inline'` in `_headers` CSP negates XSS protection**
- File: `MSCArabia.com/_headers` — `Content-Security-Policy`, `script-src` directive
- `'unsafe-inline'` allows any inline `<script>` to execute, rendering the CSP ineffective against XSS. The inline scripts in `index.html` (GA loader, cookie consent handler, Turnstile lazy-loader) are the reason for this.
- Fix: Move all inline scripts into `main.min.js`. If inline scripts are unavoidable, generate a per-request nonce via a Cloudflare Worker and replace `'unsafe-inline'` with `'nonce-{value}'`. At minimum, replace each inline block with a SHA-256 hash (`'sha256-...'`).

**[CRIT-005] PII in publicly crawled JSON-LD structured data**
- File: `MSCArabia.com/index.html` — `<script type="application/ld+json">`
- `+966551675320` (phone number), full street address, and company registration/VAT numbers are embedded in JSON-LD that search engines index and cache. Verify this is a dedicated business line (not personal). If the number is personal or temporary, remove it from structured data immediately. The VAT number `312 900 114 900 003` and Unified No. `704-925-4704` in the footer are standard for Saudi B2B trust signals — acceptable if intentional.

---

### 🟡 Warning

**[WARN-008] `X-Frame-Options: SAMEORIGIN` should be `DENY` for standalone site**
- File: `MSCArabia.com/_headers`
- The corp site has no legitimate same-origin iframing use case. `SAMEORIGIN` is weaker than `DENY` and provides less clickjacking protection.
- Fix: Change `X-Frame-Options: SAMEORIGIN` to `X-Frame-Options: DENY`.

**[WARN-009] Contact and manpower forms have no `action` fallback**
- File: `MSCArabia.com/index.html` — both `<form>` elements
- Both forms use `onsubmit="handleContactSubmit(event)"` / `onsubmit="handleManpowerSubmit(event)"` with no `action` attribute. If `main.min.js` fails to load or throws before the handler is registered, form submission silently does nothing — no data is sent, no error is shown.
- Fix: Add `action` pointing to a Cloudflare Worker endpoint as a native fallback (e.g. `action="/api/contact"`). The Worker can handle the POST if JS is unavailable.

**[WARN-010] Cloudflare Turnstile token not visibly validated server-side**
- File: `MSCArabia.com/index.html` — both forms with `data-sitekey="0x4AAAAAADXw8vszetp5UKcP"`
- The Turnstile widget renders and generates a token, but there's no visible server-side validation of `cf-turnstile-response` in the reviewed files (`main.min.js` is minified). Confirm that the Cloudflare Worker or form endpoint validates the token against `https://challenges.cloudflare.com/turnstile/v0/siteverify` before processing any form data.

**[WARN-011] `hero-scroll` element still present despite HANDOFF noting it was removed**
- File: `MSCArabia.com/index.html` — `<div class="hero-scroll">` inside `#home`
- HANDOFF.md records "Scroll cue removed" as a completed change. The element and its CSS (`.hero-scroll`, `.hero-scroll-chevron`, `@keyframes scroll-bounce`) are still in the HTML and stylesheet. Either the removal wasn't deployed or was reverted.
- Fix: Remove the `<div class="hero-scroll">...</div>` block from the hero section, and remove the associated CSS rules from the `<style>` block.

**[WARN-012] Missing HSTS header in Cloudflare `_headers`**
- File: `MSCArabia.com/_headers`
- `Strict-Transport-Security` is absent. Cloudflare enforces HTTPS at the edge, but explicit HSTS signals to browsers to preload the domain and protects against SSL stripping on non-Cloudflare paths.
- Fix: Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to the `_headers` file.

**[WARN-013] Privacy/Cookie modal content depends on JS to render**
- File: `MSCArabia.com/index.html` — `#privacy-modal`, `#cookie-modal`
- Modal body content is injected via `data-i18n-html` attributes populated by `main.min.js`. If the script is blocked or slow, the modal opens empty. Under Saudi PDPL, a privacy policy must be legibly accessible.
- Fix: Either inline the policy content directly in the modal HTML (hidden by CSS, shown by JS), or link to the standalone `privacy-policy.html` page as a fallback `<a>` inside the modal.

**[WARN-014] `sitemap.xml` does not reference `robots.txt`; `robots.txt` likely missing `Sitemap:` directive**
- File: `MSCArabia.com/sitemap.xml`, `MSCArabia.com/robots.txt`
- Googlebot won't auto-discover the sitemap without a `Sitemap: https://mscarabia.com/sitemap.xml` directive in `robots.txt` or manual submission via Search Console.
- Fix: Add `Sitemap: https://mscarabia.com/sitemap.xml` to `robots.txt`.

---

### 🔵 Info / Suggestion

**[INFO-006] Three JS files loaded without `defer` at bottom of `<body>`**
- File: `MSCArabia.com/index.html` — `main.min.js`, `hero-canvas.min.js`, `parallax.min.js` script tags
- Scripts at the bottom of `<body>` are non-blocking in practice, but `defer` is still best practice — it signals intent, ensures execution after DOMContentLoaded parsing, and is required for correct execution order if scripts are ever moved to `<head>`.
- Fix: Add `defer` to all three script tags.

**[INFO-007] `canonical` URL missing trailing slash; inconsistent with OG/Twitter URLs**
- File: `MSCArabia.com/index.html`
- `<link rel="canonical" href="https://mscarabia.com">` (no trailing slash) while OG uses `https://mscarabia.com/` (with slash). Google treats these as different URLs.
- Fix: Standardize to `https://mscarabia.com/` (with trailing slash) across canonical, OG, Twitter, and JSON-LD.

**[INFO-008] `SearchAction` in JSON-LD is a false claim**
- File: `MSCArabia.com/index.html` — JSON-LD `WebSite` entity
- `"potentialAction": { "@type": "SearchAction", "target": "https://mscarabia.com/?q={search_term_string}" }` claims the site has a search box. It doesn't. Google may show a broken sitelinks searchbox in SERPs.
- Fix: Remove the `potentialAction` block from the `WebSite` JSON-LD entity entirely.

**[INFO-009] OG image missing width/height meta tags**
- File: `MSCArabia.com/index.html` — Twitter card meta tags
- `twitter:image:width` and `twitter:image:height` are absent (the game's `index.html` includes them). Without dimensions, some platforms render degraded previews.
- Fix: Add `<meta name="twitter:image:width" content="1200">` and `<meta name="twitter:image:height" content="630">` (adjust to actual `og-image.jpg` dimensions).

**[INFO-010] Duplicate content between modal and standalone policy pages**
- File: `MSCArabia.com/sitemap.xml` lists `privacy-policy.html` and `cookie-policy.html`; `index.html` has modal versions of the same content
- Two content surfaces for the same policies (modal + standalone HTML files). Search engines will index both.
- Fix: Add `<link rel="canonical" href="https://mscarabia.com/">` to `privacy-policy.html` and `cookie-policy.html` so they don't compete with the homepage in search results.

---

### ✅ Good

- Comprehensive JSON-LD structured data (`ProfessionalService`, `WebSite`, `SiteNavigationElement`, `BreadcrumbList`) — strong local SEO signals for Saudi Arabia.
- `hreflang` tags for `en`, `ar`, and `x-default` are correctly implemented.
- Cloudflare Turnstile lazy-loaded on `pointerdown` only when a form is targeted — correctly avoids penalizing Lighthouse.
- Cookie consent properly gates GA loading — compliant pattern.
- `prefers-reduced-motion` media query disables all animations and hides the hero canvas — strong accessibility compliance.
- High-contrast mode (`.contrast`) is thorough — covers all interactive and decorative elements with WCAG AA color values.
- Skip-to-main-content link is present and functional (`href="#main-content"`).
- Mobile nav has `role="dialog"` and all touch targets meet 44px minimum.
- Self-hosted fonts (`/assets/fonts/fonts.css`) with async `media="print"` loading eliminates Google Fonts render-blocking and removes external DNS dependency.
- `geo.*` meta tags and `ICBM` coordinates present — valuable for local/map search in Saudi Arabia.
- Honeypot field in contact form (`name="website"`, `position:absolute;left:-9999px`) — good bot trap.
- `aria-label` on all icon buttons, language toggle, and mobile menu.
- `autocomplete` attributes on all form inputs — improves mobile UX.

---

## Cross-Project Summary

| ID | Project | Severity | Category | Status |
|----|---------|----------|----------|--------|
| CRIT-001 | Game | Critical | Security/CSP | Open |
| CRIT-002 | Game | Critical | Stability | Open |
| CRIT-003 | Game | Critical | Data Integrity | Open |
| CRIT-004 | Corp | Critical | Security/CSP | Open |
| CRIT-005 | Corp | Critical | Privacy/PII | Verify intent |
| WARN-001 | Game | Warning | Architecture | Open |
| WARN-002 | Game | Warning | Build/Deploy | Open |
| WARN-003 | Game | Warning | Security | Open |
| WARN-004 | Game | Warning | Security | Open |
| WARN-005 | Game | Warning | Architecture | Open |
| WARN-006 | Game | Warning | Build | Open |
| WARN-007 | Game | Warning | Security | Open |
| WARN-008 | Corp | Warning | Security | Open |
| WARN-009 | Corp | Warning | Stability | Open |
| WARN-010 | Corp | Warning | Security | Verify |
| WARN-011 | Corp | Warning | Dead code | Open |
| WARN-012 | Corp | Warning | Security | Open |
| WARN-013 | Corp | Warning | Legal/A11y | Open |
| WARN-014 | Corp | Warning | SEO | Open |
| INFO-001 | Game | Info | Performance | Open |
| INFO-002 | Game | Info | Deploy | Open |
| INFO-003 | Game | Info | Code Quality | Open |
| INFO-004 | Game | Info | Code Quality | Open |
| INFO-005 | Game | Info | Security | Open |
| INFO-006 | Corp | Info | Performance | Open |
| INFO-007 | Corp | Info | SEO | Open |
| INFO-008 | Corp | Info | SEO | Open |
| INFO-009 | Corp | Info | SEO | Open |
| INFO-010 | Corp | Info | SEO | Open |

**Total: 3 Critical · 12 Warning · 10 Info**
