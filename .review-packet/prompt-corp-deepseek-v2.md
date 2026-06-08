# MSC Arabia — DeepSeek Code Review v2

**Project**: MSC Arabia — IT services corporate website (Riyadh, Saudi Arabia)
**Stack**: Vanilla HTML/CSS/JS, Cloudflare Pages + Functions, Resend API
**Date**: 2026-06-08
**Live**: https://mscarabia.com
**Hosting**: Cloudflare Pages (auto-deploy on push to main)
**Reviewer**: DeepSeek

## File Map

```
MSCArabia.com/
├── index.html              ← THE FILE (all CSS/JS inlined, ~3600 lines)
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
```

## Tech Stack
- **Zero frameworks**: Vanilla HTML/CSS/JS only
- **No build step**: Directly deployed from source
- **Hosting**: Cloudflare Pages
- **Backend**: Cloudflare Pages Function (`functions/`)
- **Email**: Resend API
- **Fonts**: Self-hosted + Google Fonts (Poppins, Cairo for Arabic)
- **Animations**: CSS keyframes + GSAP (CDN)
- **Analytics**: Google Tag Manager

## Instructions

Review the following source files for **security vulnerabilities, XSS vectors, CSP bypasses, input validation issues, and correctness bugs**.

For each finding, provide:
```
### [ID] — Title
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: Security/Stability/Performance/UX/Code Quality
- **File + Line**: exact location
- **Description**: what's wrong
- **Impact**: what could happen
- **Fix**: how to fix it
```

## Source Files

### MSCArabia.com/_headers
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

### MSCArabia.com/functions/api/contact.js
```javascript
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
  const honeypot = body.get("website");

  if (honeypot) return new Response(JSON.stringify({ error: "bot detected" }), { status: 400 });
  if (!name || !email || !message) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });

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

  if (res.ok) return new Response(JSON.stringify({ success: true }), { status: 200 });
  return new Response(JSON.stringify({ error: "Failed to send" }), { status: 500 });
}

function sanitize(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}
```

### MSCArabia.com/robots.txt
```
User-agent: *
Allow: /
Sitemap: https://mscarabia.com/sitemap.xml
```

### MSCArabia.com/sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://mscarabia.com/</loc><priority>1.0</priority></url>
  <url><loc>https://mscarabia.com/privacy-policy</loc><priority>0.5</priority></url>
  <url><loc>https://mscarabia.com/cookie-policy</loc><priority>0.5</priority></url>
  <url><loc>https://mscarabia.com/404</loc><priority>0.1</priority></url>
</urlset>
```

### MSCArabia.com/404.html
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Page Not Found | MSC Arabia</title>
  <style>
    body { background: #0a0a0f; color: #e2e8f0; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .container { text-align: center; }
    h1 { font-size: 4rem; color: #a855f7; margin: 0; }
    p { font-size: 1.2rem; color: #94a3b8; }
    a { color: #a855f7; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Page not found</p>
    <a href="/">← Back to home</a>
  </div>
</body>
</html>
```

## Review Focus

Focus on:
1. **Security**: CSP bypass vectors, XSS in contact form (HTML is injected into email body without proper encoding), rate limiting (in-memory, resets on redeploy), secret exposure
2. **Stability**: Error handling in contact form (timeouts, Resend API failures)
3. **Privacy**: Cookie consent GDPR compliance, form data handling
4. **Correctness**: RTL completeness, form validation gaps, i18n consistency
