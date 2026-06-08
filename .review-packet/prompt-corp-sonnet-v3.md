# MSC Arabia — Sonnet Code Review v3

**Project**: MSC Arabia — IT services corporate website (Riyadh, Saudi Arabia)
**Stack**: Vanilla HTML/CSS/JS, Cloudflare Pages + Functions, Resend API
**Date**: 2026-06-08
**Live**: https://mscarabia.com
**Hosting**: Cloudflare Pages (auto-deploy on push to main)
**Previous review**: v2 (2026-06-08)
**Latest commit**: `9631ea3`

## Build Status
- HTML: Single file, ~3600 lines
- CSS: Inlined (~1800 lines)
- JS: Inlined (~800 lines)
- Backend: Cloudflare Pages Function (`functions/api/contact.js`)
- Security: CSP via `_headers`, honeypot + server-side validation in contact form

## Architecture

```
MSCArabia.com/
├── index.html              ← Main file (all CSS/JS inlined)
├── functions/api/contact.js ← Cloudflare Pages Function (form handler, Resend API)
├── _headers                 ← Security headers + CSP + cache rules
├── 404.html                 ← Custom error page
├── privacy-policy.html      ← Standalone privacy page
├── cookie-policy.html       ← Standalone cookie page
├── sitemap.xml              ← SEO sitemap
├── robots.txt               ← Crawler rules
├── assets/
│   ├── logo.png             ← Company logo (PNG)
│   ├── logo.svg             ← Company logo (SVG)
│   ├── og-image.jpg         ← Open Graph image
│   └── fonts/               ← Self-hosted fonts
├── HANDOFF.md               ← Project handoff
└── SONNET-REVIEW-PROMPT.md  ← Previous review prompt
```

## Changes Since v2

5 commits on main:

| Commit | Description |
|--------|-------------|
| `7027488` | fix: cookie banner a11y, Vite chunk warning, JSON-LD trailing comma |
| `43db7d8` | fix: remove broken saudi-riyal.css, add SAR fallback text for U+20C1 |
| `8cca15b` | fix: sitemap dates, update HANDOFF, final cleanup |
| `1abd3cc` | fix: add SAR fallback in JS budget calculator (3 more instances) |
| `9631ea3` | fix: CSS vars for green/orange, mobile lang aria-label, inline style→CSS class |

### Key Fixes

**Unicode U+20C1 (Saudi Riyal) Fallback:**
- Unicode 17.0 added U+20C1 ﷁ as the official SAR symbol
- Not all browsers support Unicode 17.0 yet, so added `.sar-fallback` spans with visible "SAR" text
- 6 total instances: 3 in HTML (hero pricing, calculator output, service card badge) + 3 in JS (budget calculator)
- CSS: `.sar-fallback { font-size: 0.65em; color: var(--text-muted) }`

**CSS Variable Hardening:**
- Added `--green`, `--orange`, `--text-tertiary` CSS custom properties
- Replaced all hardcoded `#22c55e` → `var(--green)`, `#ff8c42` → `var(--orange)`
- Replaced `#bdc6d1`, `#8b93a8` → `var(--text-tertiary)`, `#ef4444` → `var(--error)`

**Accessibility:**
- Mobile lang-switch button: added `aria-label="Toggle language"`
- Form success/error notices: replaced JS inline `style.color` with `.notice-success`/`.notice-error` CSS classes

**Previous session fixes (v2 → v3 carryover):**
- Cookie banner `aria-modal`, `role="dialog"`, Escape-to-close, auto-focus
- Trailing comma removed from JSON-LD
- Broken `saudi-riyal.css` font dependency removed
- `100vh` → `100dvh` for mobile viewport
- Em-dashes replaced with hyphens
- Hardcoded hex values moved to CSS vars

## Key Files (included in zip)

### index.html (~3600 lines)
- **CSS Design System**: CSS custom properties (`--accent: #a855f7`, `--bg: #0a0a0f`, `--text: #e2e8f0`, `--border: #1e293b`, `--green`, `--orange`, `--text-tertiary`)
- **Dark cyberpunk/synthwave theme** with purple/pink/cyan palette
- **Responsive**: Mobile-first, breakpoints at 640px, 768px, 1024px
- **High contrast mode**: `.contrast` class on `<html>` for a11y
- **Bilingual**: English + Arabic (241 translation keys each, RTL support)
- **Sections**: Hero, Services, About, Process, Stats, Testimonials, FAQ, Contact
- **3D perspective on hero card** with floating depth orbs
- **Glassmorphism cards** (backdrop-filter blur, rgba borders)
- **Animated gradient background** with CSS keyframes
- **Contact form**: Name, Email, Phone, Company, Message with client-side + server-side validation
- **Cookie consent banner** with localStorage persistence
- **GSAP scroll animations** (fade-in, slide-up on scroll)
- **U+20C1 Saudi Riyal symbol** with `.sar-fallback` text for unsupported browsers

### functions/api/contact.js
Cloudflare Pages Function — contact form handler. Features:
- Honeypot field (anti-bot)
- Rate limiting per IP (in-memory, resets on redeploy)
- Input sanitization (strip HTML tags)
- Resend API email sending
- CORS headers
- JSON response format

### _headers
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.resend.com; frame-ancestors 'none';
```

## Previous Review Items Resolved
- U+20C1 browser support fallback (SAR text)
- Hardcoded `#22c55e`/`#ff8c42` → CSS vars
- Mobile lang-switch aria-label
- JS inline style.color → CSS classes
- Cookie banner a11y (aria-modal, Escape, auto-focus)
- Broken saudi-riyal.css font dependency
- Trailing comma in JSON-LD
- Scroll cue removed from hero
- Service card eyebrow items reduced (5 → 3)
- Filler verbs replaced with concrete copy
- Service cards: first card spans 2 cols (`.svc-card--featured`)
- `100vh` → `100dvh` for mobile viewport
- Em-dashes replaced with hyphens
- Hardcoded hex values moved to CSS vars

## Review Focus Areas

### 1. Security
- CSP headers: are they too permissive? (`'unsafe-inline'`)
- Contact form: XSS via name/message fields (HTML email output)
- Rate limiting: in-memory (resets on redeploy) — Redis/KV alternative?
- Honeypot: effective enough?
- Email HTML injection in Resend payload

### 2. Performance
- ~3600 lines in single file: should this be split?
- Self-hosted fonts: subsetting?
- OG image size
- Material Symbols 3.9MB external font — self-host subset?

### 3. Accessibility
- RTL support completeness
- ARIA labels on interactive elements (especially mobile lang-switch, now fixed)
- Keyboard navigation
- Focus management on modals (cookie consent, now fixed)
- Skip-to-content link
- High contrast mode completeness
- SAR fallback: is `.sar-fallback` accessible to screen readers?

### 4. SEO
- JSON-LD structured data (Organization schema)
- Meta tags (description, OG, twitter)
- Sitemap.xml completeness
- robots.txt correctness

### 5. UX
- Mobile responsiveness
- Form validation UX (error messages, loading states)
- Cookie consent UX (GDPR compliance, Saudi PDPL)
- Animation on reduced-motion preference
- Contact form success/error feedback (now using CSS classes)
- SAR symbol fallback visual quality on unsupported browsers
