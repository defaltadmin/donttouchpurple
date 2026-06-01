# MSCArabia.com Code Review — v1.0
**Date**: 2026-06-01 | **Reviewer**: Claude Sonnet 4.6 | **Stack**: Next.js 16.2.6, React 19.2.4, TS 5, Tailwind 4, OGL, GSAP

---

## Findings

### 🟠 HIGH

---

**[HIGH-001] Render-blocking Google Fonts — LCP penalty**
- **File**: `website/src/app/layout.tsx`
- **Location**: `<head>` link tags
- **Description**: Two `<link rel="stylesheet">` tags for Google Fonts are render-blocking. The browser must download both before painting text, directly harming LCP and FID. `next/font` handles this automatically with font subsetting, preloading, and `font-display: swap`.
- **Fix**:
  ```typescript
  // layout.tsx
  import { Fredoka_One, Nunito } from 'next/font/google';
  const fredoka = Fredoka_One({ weight: '400', subsets: ['latin'], variable: '--font-display' });
  const nunito = Nunito({ weight: ['400','600','700','800','900'], subsets: ['latin'], variable: '--font-body' });
  // In RootLayout:
  <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
  ```
  Remove the `<link>` tags from `<head>`.

---

**[HIGH-002] Bot loop has no `visibilitychange` guard — burns CPU in background tab**
- **File**: `website/src/app/page.tsx`
- **Location**: `setInterval` in final `useEffect`
- **Description**: The 600ms bot interval fires continuously even when the tab is hidden. With 3–6 GSAP animations per tick, this is ~300 GSAP tweens/minute running in a background tab.
- **Fix**: Add visibility guard:
  ```typescript
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const start = () => { intervalId = setInterval(botTick, 600); };
    const stop = () => { if (intervalId) { clearInterval(intervalId); intervalId = null; } };
    const onVisibility = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  ```

---

**[HIGH-003] `document.querySelectorAll('.glass-card')` — imperative DOM query in React**
- **File**: `website/src/app/page.tsx`
- **Location**: `useEffect` cursor glow handler
- **Description**: Querying DOM by class name bypasses React's rendering model. If cards re-render or are conditionally shown, the event listeners won't update. Also queries the entire document rather than a scoped container.
- **Fix**: Use a `useRef` array or `useCallback` ref pattern:
  ```typescript
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // On each card: ref={el => { cardRefs.current[i] = el; }}
  // In useEffect: cardRefs.current.forEach(card => { if (card) card.addEventListener(...) })
  ```

---

**[HIGH-004] `HeroStage.tsx` is dead code — not used anywhere**
- **File**: `website/src/components/HeroStage.tsx`
- **Location**: Entire file (70 lines)
- **Description**: `page.tsx` implements its own hero inline without importing `HeroStage`. The component duplicates `GlassOrb`, `CrescentRing`, badge, title, and GSAP entrance logic. This creates two parallel maintenance paths.
- **Fix**: Either use `HeroStage` in `page.tsx` (replacing the inline hero), or delete the file. Don't maintain both.

---

### 🟡 MEDIUM

---

**[MED-001] No security headers — needs `_headers` file for Cloudflare Pages**
- **File**: Missing `website/public/_headers`
- **Description**: `output: 'export'` means Next.js `headers()` config is ignored. Without a `_headers` file, the site has no CSP, no `X-Frame-Options`, no `X-Content-Type-Options`, no HSTS, and no `Referrer-Policy`.
- **Fix**: Create `website/public/_headers`:
  ```
  /*
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=()
    Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
  ```
  Adjust CSP directives for your OGL/GSAP inline script needs.

---

**[MED-002] GSAP entrance timeline not killed on unmount**
- **File**: `website/src/app/page.tsx`
- **Location**: First `useEffect` (entrance animations)
- **Description**: The `gsap.timeline()` is created but not assigned to a variable for cleanup. If Next.js ever hot-reloads or the component re-mounts, tweens stack up.
- **Fix**:
  ```typescript
  useEffect(() => {
    const tl = gsap.timeline();
    // ... tweens
    return () => { tl.kill(); };
  }, []);
  ```

---

**[MED-003] `CrescentRing` `width`/`height` props vs CSS breakpoints fight**
- **File**: `website/src/components/CrescentRing.tsx` + `globals.css`
- **Description**: The component accepts `width`/`height` props and applies them as inline styles, but `globals.css` has breakpoint rules that override `.crescent-ring { width: ... }` at `640px` and `1023px`. CSS specificity means the CSS breakpoints win, making the props non-functional on mobile and tablet.
- **Fix**: Either remove the props (document CSS controls sizing), or make the CSS use `var(--crescent-w, 850px)` and set the CSS variable from props.

---

**[MED-004] `NebulaCanvas`: no ResizeObserver — misses mobile viewport shifts**
- **File**: `website/src/components/NebulaCanvas.tsx`
- **Location**: `window.addEventListener('resize', resize)`
- **Description**: Mobile browsers don't fire `window.resize` when the URL bar hides/shows (viewport height changes). The canvas stays at the old size, creating a gap at the bottom of the hero.
- **Fix**: Add a `ResizeObserver` on the canvas element:
  ```typescript
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  // cleanup: ro.disconnect()
  ```

---

**[MED-005] OG/Twitter metadata `siteName` and `url` are DTP-game-specific, not corporate**
- **File**: `website/src/app/layout.tsx`
- **Location**: `metadata` export
- **Description**: `siteName: "Don't Touch Purple"` and `url: 'https://game.mscarabia.com'` are the game's identity. If this site is the marketing landing page for the game, this is fine. But if MSC Arabia is intended as a company page, the OG metadata should reflect MSC Arabia.
- **Clarify**: If this landing page is exclusively about DTP, current metadata is correct. If it's the MSC Arabia company site, update accordingly.

---

### 🔵 SEO / Accessibility

---

**[A11Y-001] Boss card and feature emoji icons lack `aria-hidden="true"`**
- **File**: `website/src/app/page.tsx`
- **Location**: `{boss.icon}` and `{f.icon}` render in JSX
- **Description**: Screen readers will read raw emoji descriptions ("⚡ Lightning storm", etc.) in the middle of the card content, making the cards verbose and confusing.
- **Fix**: Wrap emoji in a span:
  ```tsx
  <div className="boss-card-icon" aria-hidden="true">{boss.icon}</div>
  ```

---

**[A11Y-002] Interactive-looking game cells have no ARIA role**
- **File**: `website/src/app/page.tsx`
- **Location**: `.game-cell` divs in the grid
- **Description**: Cells have `cursor: pointer` in CSS, making them appear interactive to sighted users and screen readers. Since they're purely decorative (bot plays), they should be hidden from accessibility tree.
- **Fix**: Add `aria-hidden="true"` to the grid container:
  ```tsx
  <div ref={gridElRef} className="game-grid" aria-hidden="true" ...>
  ```

---

**[SEO-001] No `robots.txt`, `sitemap.xml`, or canonical tag**
- **Description**: Static export with no `robots.txt` means crawlers use default behavior (index everything). No sitemap makes discovery slower. No canonical `<link>` means if both `www` and non-`www` resolve, duplicate content is possible.
- **Fix**: Add `website/public/robots.txt` and `website/public/sitemap.xml`. Add canonical in layout:
  ```typescript
  metadata: { alternates: { canonical: 'https://game.mscarabia.com' } }
  ```

---

**[SEO-002] `<html lang="en">` only — no Arabic locale support**
- **File**: `website/src/app/layout.tsx`
- **Location**: `<html lang="en">`
- **Description**: MSC Arabia is a Saudi company. The site is English-only with no `lang="ar"` alt or `dir="rtl"` support. This reduces organic reach for Arabic search queries and may hurt local SEO.
- **Note**: Not a blocker, but worth tracking for a future i18n pass.

---

**[SEO-003] Tech stats (`232 Tests`, `5 Languages`) hardcoded in JSX**
- **File**: `website/src/app/page.tsx`
- **Location**: `.tech-stat` elements
- **Description**: These will go stale immediately after the next dev sprint. The tests stat is already wrong (DTP has 205 tests, not 232).
- **Fix**: Correct `232` → `205` now. For future-proofing, consider fetching from GitHub API or just accepting manual updates.

---

### 🔵 LOW

---

**[LOW-001] `import(\"../styles/light-theme.css\")` — dynamic CSS import not awaited**
- **File**: `website/src/app/page.tsx` (via `useThemeSettings` if used) / `globals.css`
- **Note**: Actually this is in `useThemeSettings.ts` in the DTP app, not the corp site. No action needed here.

---

**[LOW-002] `new Date().getFullYear()` in footer — bakes at build time for static export**
- **File**: `website/src/app/page.tsx`
- **Location**: Footer `©` span
- **Description**: With `output: 'export'`, Next.js pre-renders this at build time. The copyright year will be wrong after Jan 1 without a rebuild.
- **Fix**: Since this is `'use client'`, `new Date()` actually runs in the browser, so this is fine — it evaluates client-side at render time. No action needed, just documenting the SSR vs client distinction.

---

**[LOW-003] `PLAY_URL = '/play'` assumes game is at `/play` — no fallback if route missing**
- **File**: `website/src/app/page.tsx`
- **Description**: The build script copies DTP's `dist/` into `out/`. If the build fails or the path changes, `/play` 404s silently. No user-facing error.
- **Fix**: Acceptable for current build pipeline. Document the dependency in README.

---

## Summary

| ID | Severity | Area | One-liner |
|----|----------|------|-----------|
| HIGH-001 | 🟠 High | Performance | Render-blocking Google Fonts — use `next/font` |
| HIGH-002 | 🟠 High | Performance | Bot loop ignores tab visibility |
| HIGH-003 | 🟠 High | Quality | Class-based DOM query bypasses React |
| HIGH-004 | 🟠 High | Quality | `HeroStage.tsx` is dead code |
| MED-001 | 🟡 Medium | Security | No security headers — needs `_headers` file |
| MED-002 | 🟡 Medium | Stability | GSAP timeline not killed on unmount |
| MED-003 | 🟡 Medium | Quality | Props vs CSS specificity fight in CrescentRing |
| MED-004 | 🟡 Medium | Visual | NebulaCanvas misses mobile viewport shifts |
| MED-005 | 🟡 Medium | SEO | OG metadata is DTP-specific — verify intent |
| A11Y-001 | 🔵 A11y | Accessibility | Emoji icons not aria-hidden |
| A11Y-002 | 🔵 A11y | Accessibility | Decorative game cells need aria-hidden |
| SEO-001 | 🔵 SEO | Discoverability | No robots.txt, sitemap, canonical |
| SEO-002 | 🔵 SEO | Reach | English-only lang tag for Arabic company |
| SEO-003 | 🔵 SEO | Accuracy | Test count (232) is stale — should be 205 |
| LOW-003 | 🔵 Low | Reliability | /play route silently 404s if build fails |

**No critical blockers.** HIGH-001 (fonts) will have the most measurable impact on Core Web Vitals. MED-001 (headers) is the most important security item.
