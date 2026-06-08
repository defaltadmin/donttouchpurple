# Amazon Q Review — Full Audit Prompt

Review both projects in this repo (`/MSCArabia.com` and the root game app). For each, read the key source files, then produce a structured report covering all sections below.

---

## Project 1: Game — "Don't Touch Purple" (repo root)

| Key | Value |
|-----|-------|
| Stack | React 18, TypeScript 5, Vite 7, Firebase |
| Entry | `main.tsx` → `App.tsx` |
| Game engine | `engine/GameEngine.ts` + `engine/subsystems/` |
| Deploy | Firebase Hosting → `game.mscarabia.com` |
| Git | `defaltadmin/donttouchpurple` |

Focus files:
- `services/gameanalytics.ts` — GameAnalytics init (recently fixed method names)
- `services/firebase.ts` — Firebase init, App Check
- `index.html` — CSP, preloads, analytics tags
- `firebase.json` — Hosting config, redirects, headers
- `functions/src/index.ts` — updateStreak callable function
- `vite.config.ts` — Build config, sourcemaps
- `engine/GameEngine.ts` — Core game loop
- `engine/subsystems/TickProcessor.ts` — Per-tick processing

Also read: `HANDOFF.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`

---

## Project 2: Corporate Site — "MSC Arabia" (`/MSCArabia.com/`)

| Key | Value |
|-----|-------|
| Stack | Single-file HTML (inline CSS/JS → now external minified JS) |
| Entry | `index.html` (single page, ~105KB) |
| Deploy | Cloudflare Pages → `mscarabia.com` |
| Git | `defaltadmin/mscarabia` |

Focus files:
- `index.html` — Full site (head, inline styles, JS references)
- `assets/js/main.min.js` — All site JS (i18n, forms, a11y, animations)
- `assets/js/hero-canvas.min.js` — Hero background canvas animation
- `assets/js/parallax.min.js` — Hero content parallax
- `assets/fonts/fonts.css` — Self-hosted font declarations
- `assets/fonts/*.woff2` — Font files
- `_headers` — Cloudflare headers config
- `sitemap.xml` — SEO sitemap

---

## Review Checklist

For each project, cover:

### 1. CRITICAL ERRORS
- Console errors or TypeErrors at runtime
- API call failures (404, 500, CORS)
- Missing dependencies or broken imports
- Security vulnerabilities (XSS, CSP holes, exposed secrets/API keys)
- Broken functionality (forms not submitting, analytics not firing, login/auth broken)

### 2. CODE QUALITY & MAINTAINABILITY
- Dead code, unused imports/variables
- Anti-patterns or duplicated logic
- TypeScript strictness issues (`any` usage, missing types)
- Error handling gaps (uncaught promises, missing try/catch)
- Magic numbers / hardcoded values

### 3. PERFORMANCE
- Bundle size concerns (which chunks are bloated)
- Render-blocking resources
- Unoptimized images or assets
- Layout shifts (CLS)
- Memory leaks (event listeners, RAF not cancelled, intervals not cleared)

### 4. ACCESSIBILITY (corporate site)
- Semantic HTML structure
- Keyboard navigation traps
- Screen reader support (ARIA labels, roles)
- Color contrast
- Focus management in modals/menus

### 5. LIGHTHOUSE / WEB VITALS
- What's likely to pass/fail
- Specific LCP, INP, CLS risks

### 6. SEO (corporate site)
- Meta tags, OG tags
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Hreflang / i18n SEO

### 7. BUILD & DEPLOY
- Build warnings or errors
- Firebase / Cloudflare config issues
- Missing redirects or custom 404 pages
- Environment variable handling

---

## Output Format

Return a single markdown report. Group findings by project, then by severity:

```
## Project: [name]

### 🔴 Critical
- ...

### 🟡 Warning
- ...

### 🔵 Info / Suggestion
- ...

### ✅ Good
- ...
```
