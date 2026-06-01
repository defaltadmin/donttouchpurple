# MSCArabia.com (Corp Site) — Code Review for Amazon Q

**Project**: MSCArabia.com — corporate landing page for MSC Arabia (game studio behind Don't Touch Purple)
**URL**: https://mscarabia.com (separate from game at https://game.mscarabia.com)
**Stack**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, OGL/WebGL, GSAP
**Build**: Static export (`output: "export"`)
**Date**: 2026-06-01
**Previous Reviews**: Sonnet Corp v1.0, DeepSeek Corp v1.0 (findings already applied)

## Review Instructions

Review this Next.js corporate website for:
1. **Performance** — Core Web Vitals, bundle size, hydration, SSR, font loading
2. **Accessibility** — WCAG 2.2 AA compliance, screen reader, keyboard nav, ARIA
3. **SEO** — Meta tags, structured data, semantic HTML, sitemap, robots.txt
4. **Security** — CSP, XSS, dependency vulnerabilities, headers
5. **Code Quality** — TypeScript strictness, dead code, patterns, maintainability
6. **Design** — Visual quality, responsive layout, dark/light mode

For each finding:
- **Severity**: Critical / High / Medium / Low / Info
- **Category**: Performance / A11y / SEO / Security / Quality / Design
- **File + Line**: exact location
- **Description**: what's wrong
- **Fix**: specific code change

IMPORTANT:
- This is a static export — no server components, no SSR at request time
- All components are `'use client'`
- OGL WebGL is used for the nebula background (not three.js)
- GSAP handles all animations
- `new Date().getFullYear()` in a `'use client'` footer is NOT a hydration issue (evaluates client-side)
- `createRadialGradient` bakes center coordinates — cannot cache for moving particles
- OGL Renderer does NOT have `.destroy()` — use `gl.getExtension('WEBGL_lose_context')?.loseContext()`

## Known False Positives (do NOT flag these)

1. **Footer copyright year** — `'use client'` component, evaluates client-side, no hydration mismatch
2. **Bot loop setInterval** — Has visibility guard (pauses when tab hidden), cleaned up on unmount
3. **GSAP timeline** — Properly killed on unmount (`return () => { tl.kill(); }`)
4. **CrescentRing** — No width/height props, CSS handles all sizing via media queries
5. **HeroStage.tsx** — DELETED (was dead code, never imported). Do not flag.

## Key Files to Review

### App
- `website/src/app/layout.tsx` — Root layout, metadata, font loading, canonical
- `website/src/app/page.tsx` — Landing page with bot gameplay demo, sections
- `website/src/app/globals.css` — All styles (glassmorphic, responsive, animations)

### Components
- `website/src/components/GlassOrb.tsx` — Backdrop-blur orb with GSAP float
- `website/src/components/CrescentRing.tsx` — Crescent ring decorative element
- `website/src/components/NebulaCanvas.tsx` — OGL WebGL nebula background

### Config
- `website/next.config.ts` — Static export config
- `website/tsconfig.json` — TypeScript config
- `website/package.json` — Dependencies (no unused `@cloudflare/next-on-pages`)

### Public
- `website/public/_headers` — Security headers (X-Frame-Options, nosniff, referrer, permissions)
- `website/public/robots.txt` — Crawler directives
- `website/public/sitemap.xml` — Sitemap

## Build Status

| Check | Status |
|-------|--------|
| TypeScript | Clean |
| Build | `next build` succeeds (static export) |
| Deploy | Cloudflare Pages |

## Commands

```bash
cd website
npx next build    # Production build (static export)
npx next lint     # ESLint
```

## Architecture

```
website/
  src/
    app/
      layout.tsx     — Root layout (metadata, fonts, canonical)
      page.tsx       — Landing page (hero, bot demo, features, CTA)
      globals.css    — All styles
    components/
      GlassOrb.tsx   — Backdrop-blur glass orb with GSAP
      CrescentRing.tsx — Decorative crescent
      NebulaCanvas.tsx — OGL WebGL nebula
  public/
    _headers         — Security headers
    robots.txt       — Crawler directives
    sitemap.xml      — Sitemap
```

## Site Sections

1. **Hero**: WebGL nebula background, game title, 4x4 grid with bot auto-tapping, Play button, crescent ring + glass orb
2. **Boss Events**: 3 glassmorphic cards (Storm, Inversion, Blackout)
3. **Features**: 6 feature cards (modes, achievements, backgrounds, bot, daily, PWA)
4. **Open Source**: Tech badges, stats (230 tests, MIT, 5 languages), GitHub link
5. **CTA**: "Ready? No signup. No ads. Just tap."
6. **Footer**: Copyright + MIT license

## Output Format

For each finding, use this format:

```
### [SEVERITY] [CATEGORY] — Short Title
- **File**: `path/to/file.tsx:123`
- **Description**: What's wrong and why
- **Fix**: Specific code change
```

Group findings by severity (Critical first, then High, Medium, Low, Info).
End with a summary table: | Severity | Count | Description |
