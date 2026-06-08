# MSC Arabia — Sonnet Code Review v2

**Project**: MSC Arabia — IT services corporate website (Riyadh, Saudi Arabia)
**Stack**: Vanilla HTML/CSS/JS, Cloudflare Pages + Functions, Resend API
**Date**: 2026-06-08
**Live**: https://mscarabia.com
**Hosting**: Cloudflare Pages (auto-deploy on push to main)
**Previous review**: v1 (2026-05-29)

## Build Status
- HTML: Single file, ~3600 lines
- CSS: Inlined (~1800 lines)
- JS: Inlined (~800 lines)
- Backend: Cloudflare Pages Function (`functions/api/contact.js`)
- Security: CSP via `_headers`, App Check-like validation in contact form

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
├── SONNET-REVIEW-PROMPT.md  ← Previous review prompt
└── REVIEW-PACKET-DEEPSEEK.md ← Previous DeepSeek review
```

## Key Files (included in zip)

### index.html (~3600 lines)
- **CSS Design System**: CSS custom properties (`--accent: #a855f7`, `--bg: #0a0a0f`, `--text: #e2e8f0`, `--border: #1e293b`)
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

### functions/api/contact.js
```javascript
// Cloudflare Pages Function — contact form handler
// Receives form submissions, validates, sends via Resend API
// Features:
// - Honeypot field (anti-bot)
// - Rate limiting per IP (in-memory, resets on redeploy)
// - Input sanitization (strip HTML tags)
// - Resend API email sending
// - CORS headers
// - JSON response format

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "https://mscarabia.com", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" }
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const body = await request.formData();
  const name = sanitize(body.get("name") || "");
  const email = body.get("email") || "";
  const phone = sanitize(body.get("phone") || "");
  const company = sanitize(body.get("company") || "");
  const message = sanitize(body.get("message") || "");
  const honeypot = body.get("website"); // hidden field

  // Honeypot check
  if (honeypot) return new Response(JSON.stringify({ error: "bot detected" }), { status: 400 });

  // Server-side validation
  if (!name || !email || !message) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });

  // Send email via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${context.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "MSC Arabia <contact@mscarabia.com>",
      to: ["info@mscarabia.com"],
      subject: `New Contact: ${name}`,
      html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Phone: ${phone}</p><p>Company: ${company}</p><p>Message: ${message}</p>`
    })
  });

  if (res.ok) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: "Failed to send" }), { status: 500 });
}

function sanitize(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}
```

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
- Scroll cue removed from hero
- Service card eyebrow items reduced (5 -> 3)
- Filler verbs replaced with concrete copy
- Service cards: first card spans 2 cols (`.svc-card--featured`)
- `100vh` -> `100dvh` for mobile viewport
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
- Lighthouse scores from last check

### 3. Accessibility
- RTL support completeness
- ARIA labels on interactive elements
- Keyboard navigation
- Focus management on modals (cookie consent)
- Skip-to-content link
- High contrast mode completeness

### 4. SEO
- JSON-LD structured data (Organization schema)
- Meta tags (description, OG, twitter)
- Sitemap.xml completeness
- robots.txt correctness

### 5. UX
- Mobile responsiveness
- Form validation UX (error messages, loading states)
- Cookie consent UX (GDPR compliance)
- Animation on reduced-motion preference
- Contact form success/error feedback
