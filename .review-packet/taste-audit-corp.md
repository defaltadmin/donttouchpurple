# Taste-Skill Audit: MSCArabia.com

**Audited:** 2026-06-01
**Source:** `MSCArabia.com-work/index.html` (3658 lines, single-file static site)
**Other files:** cookie-policy.html, privacy-policy.html, 404.html
**Framework:** Static HTML, no build step, no framework, bilingual EN/AR

---

## Scores

| Metric | Score | Rationale |
|--------|-------|-----------|
| DESIGN_VARIANCE | 4/10 | Symmetrical centered sections, predictable 3-col grids, no asymmetric layouts |
| MOTION_INTENSITY | 5/10 | Hero canvas (gradient orbs + scroll parallax), scroll-reveal, marquee, shimmer, background shift |
| VISUAL_DENSITY | 7/10 | Hero (eyebrow + h1 + sub + 2 CTAs + 4 stats + floating card), 6 service cards, engineering panels, manpower cols + quote form, about stats, contact form, 4-col footer |

---

## Findings

### HIGH SEVERITY

#### H1 -- Em-dashes everywhere [Section 9 -- banned]

The taste-skill bans em-dashes (---) anywhere. The site has **30+ em-dashes** across visible content, meta tags, structured data, and both EN/AR translations.

**index.html visible content:**

| Line | Element | Text |
|------|---------|------|
| 6 | `<title>` | `MSC Arabia --- IT Services, Fire Safety & Manpower Solutions` |
| 7 | `<meta description>` | `...IT Hardware Procurement.` |
| 30 | `og:title` | same as title |
| 38 | `twitter:title` | same as title |
| 1920 | hero_sub EN | `...workforce solutions --- trusted by Saudi Arabia's leading enterprises.` |
| 1993 | svc2_desc EN | `Enterprise Mobile Device Management --- secure, deploy, and manage...` |
| 2008 | svc3_desc EN | `...evacuation systems --- from design through commissioning...` |
| 2038 | svc5_desc EN | `...hardware and licensed software --- from vendor selection...` |
| 2150 | about_p2 EN | `...Petro Rabigh --- combining international certifications...` |
| 2173 | proj-desc | `Reflex-based grid-tapping game --- React, TypeScript, WebGL, Firebase` |
| 2178 | proj-desc | `Bilingual corporate site --- EN/AR, Cloudflare Pages, Workers` |
| 2606 | hero_sub AR | Arabic translation also has em-dash |
| 2790 | about_p2 AR | Arabic translation also has em-dash |

**cookie-policy.html:**

| Line | Element | Text |
|------|---------|------|
| 52 | table cell | `Google Analytics --- distinguishes unique users` |
| 58 | table cell | `Google Analytics 4 --- maintains session state` |

**Fix:** Replace all `---` with ` - ` (hyphen + spaces) or restructure sentences. Update all i18n translation keys (lines 2318, 2357, 2362, 2372, 2502, 2606, 2790).

---

#### H2 -- 3-column equal feature cards [Section 9.C]

**index.html:849:**
```css
@media (min-width: 1024px) { .svc-bento { grid-template-columns: repeat(3, 1fr); } }
```

All 6 service cards (lines 1973-2062) share identical structure: icon, title, brief, 3-item checklist, tag pills, CTA link. The grid forces uniform sizing.

**Fix:** Use asymmetric bento layout. Make the first card span 2 columns. Vary card templates (2-3 different layouts).

---

### MEDIUM SEVERITY

#### M1 -- Scroll cue in hero [Section 9.F]

**index.html:1945-1947:**
```html
<div class="hero-scroll">
  <span data-i18n="scroll_cta">Scroll</span>
  <div class="hero-scroll-chevron"></div>
</div>
```

Animated bouncing scroll indicator at hero bottom. CSS at lines 504-533.

**Fix:** Delete the `hero-scroll` element and its CSS entirely. Users know how to scroll.

---

#### M2 -- Neon/outer glow effects [Section 9 -- outer glows banned by default]

| Line | Selector | Glow |
|------|----------|------|
| 603 | `.btn-primary:hover` | `0 0 30px rgba(230,57,70,0.25), 0 0 60px rgba(230,57,70,0.1)` |
| 869 | `.svc-card:hover` | `0 0 32px rgba(230,57,70,0.05)` |
| 871-879 | `.svc-card-glow` | Dedicated radial-gradient glow element (6 instances) |
| 728 | `.contact-card:hover` | `0 0 40px rgba(230,57,70,0.05)` |
| 1525 | `.sd.active span` | `0 0 10px rgba(230,57,70,0.5)` |
| 600 | `.btn-primary` (default) | `0 0 0 0 var(--accent-glow)` (animated pulse) |

The `svc-card-glow` divs (lines 1974, 1989, 2004, 2019, 2034, 2049) are dedicated glow overlays activated on hover.

**Fix:** Remove outer glow box-shadows. Replace with subtle border-color changes or inset shadows. Keep hover lift but drop the glow halo. Remove `svc-card-glow` elements.

---

#### M3 -- Middle-dot overuse [Section 9.F -- max 1 per line]

**index.html:1955** (noscript fallback):
```
Amsa Hospitality · TSS Advertising · Kudu · EHIC · Hellmann Logistics
```
Four middle-dots on one line.

**Fix:** Use commas instead.

(Footer at line 2238 has 1 middle-dot -- acceptable.)

---

#### M4 -- "Trusted by" header pattern [Section 9]

**index.html:1954:**
```html
<p class="clients-label">Trusted by Saudi Arabia's Leading Organisations</p>
```

Generic "Trusted by" client wall header. Same pattern as "Quietly in use at" / "Quietly trusted by."

**Fix:** Replace with a specific claim or remove the label entirely and let the logos speak.

---

#### M5 -- Pure black (#000) in high-contrast mode [Section 9]

Eight instances of `#000` in the `.contrast` accessibility mode (lines 1666, 1674, 1691, 1693, 1695, 1696, 1698, 1706).

**Note:** High-contrast mode intentionally maximizes contrast for accessibility. This is defensible for the use case but violates the strict rule.

**Fix (optional):** Change to `#0a0a0a` or `#111`. Low priority since this is an accessibility override, not default design.

---

### LOW SEVERITY

#### L1 -- Eyebrow overuse [Section 4.7]

`.sec-pill` (uppercase mono eyebrow label) appears on 5 of 7 content sections: Services (1968), Engineering (2071), Manpower (2106), Projects (2167), Contact (2201). Max recommended: ceil(7/3) = 3.

Each `.sec-pill` has a `::before` decorative colored dot (lines 816-822).

**Fix:** Keep eyebrows on at most 2-3 sections. Remove the `::before` decorative dot.

---

#### L2 -- Filler-adjacent corporate language [Section 9.D]

The specific banned words ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize") are NOT present. However:

| Line | Phrase | Count |
|------|--------|-------|
| 1969, 2237, 2347 | "Comprehensive" | 3x |
| 1970, 2202, 2203 | "Transform / transformation" | 3x |
| 1970, 2203 | "Accelerate" | 2x |
| 1935, 2326 | "Precision Engineering" | 1x |

**Fix:** Replace with specifics. "Comprehensive IT & Engineering Solutions" -> "Managed IT, Fire Safety, and Workforce." "Let's Transform Your Business Together" -> "Talk to an Engineer."

---

#### L3 -- Self-referential portfolio [credibility]

**index.html:2171-2181:** The "Built by MSC Arabia" projects section lists the DTP game and the MSCArabia site itself. Only 2 projects, one is the page being viewed.

**Fix:** Remove until 3+ real client projects exist, or reframe as "Our Technology."

---

## What's Clean (no violations found)

- No version labels in hero
- No section-number eyebrows (01/INDEX, 001 · Capabilities)
- No "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize"
- No generic names (John Doe, Sarah Chan)
- No fake-perfect numbers (99.99%, 1234567)
- No weather/locale strips
- No broken Unsplash links (no external images at all)
- No "Quietly in use at" / "Quietly trusted by" exact phrases
- No decorative status dots (green/red indicators)
- No generic step labels (Stage 1, Step 2)
- #000 only in high-contrast accessibility mode, not default design
- Clean color system: off-black `#06070b` base, well-defined CSS variables
- Proper `prefers-reduced-motion` handling
- Good font stack (Plus Jakarta Sans + IBM Plex Sans Arabic)
- Solid SEO (JSON-LD, OG, canonical, hreflang)
- Solid accessibility (semantic HTML, aria-labels, skip-nav, form labels)

---

## Priority Fix Order

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Replace all 30+ em-dashes with hyphens | 30 min | High -- most pervasive tell |
| 2 | Remove scroll cue from hero | 1 min | High -- instantly recognizable AI tell |
| 3 | Vary service card layouts (break 3-col equal grid) | 2 hours | High -- structural |
| 4 | Remove outer glow effects | 30 min | Medium -- polish |
| 5 | Cut eyebrows from 5 to 2-3 | 10 min | Medium -- repetition |
| 6 | Rewrite filler copy with concrete specifics | 1 hour | Medium -- copy quality |
| 7 | Fix middle-dot overuse in noscript | 5 min | Low -- edge case |

**Estimated total:** 4-5 hours to move from "AI default" to "deliberately designed."
