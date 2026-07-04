# GPT-5.5 — Complete Triple-Repo Audit

**Platform:** ChatGPT with GitHub access (or paste code manually)
**Date:** 2026-07-04
**Repos:** `defaltadmin/donttouchpurple` | `defaltadmin/world-prayer-times` | `defaltadmin/mscarabia`
**Purpose:** Final audit — find every remaining bug, visual issue, performance problem, and security gap. Deliver code blocks for all fixes.

---

## Context

Three production web apps have been through 5 rounds of audits and fixes. This is the final pass. Everything below has already been done — do NOT re-flag these:

### Already Fixed (Do Not Re-Flag)
- DTP: 22 backgrounds rewritten to brand palette, UA regex removed from all files, Firebase env guard, start-screen animation, 320px HUD guard, GridPulse/PurpleCascade/AuroraBorealis rewrites, Silk/Galaxy/Hyperspeed UA fix, Worker auth hardened, console.log removed, data-dda-emergency event emission
- Prayer: Task CRUD + modal + timeline, VTIMEZONE iCal (8 timezones), empty state, font preload, notification system, Worker auth with COURSE_SECRET + timingSafeEqual, CSP analytics domains, meeting-links error detail
- Corp: Case studies section, scroll reveal + count-up, email capture Worker + form, inline scripts externalized to app.js, 22 onclick handlers converted to data-action delegation, SVG icons (48 instances), Space Grotesk font pairing, SAR symbol U+FDFC, template copy replaced, static gradient (no hue-rotate), ambient colors constrained

---

## What You Must Do

Read every file in all three repos via GitHub (or paste the code). Then deliver a comprehensive audit with **complete, copy-pasteable code blocks** for every fix. No suggestions without code. No "consider adding X." Just code.

### Rules
1. Read EVERY file before suggesting anything
2. Every fix = a complete code block with file path and line range
3. Test your logic — functions must be syntactically correct
4. One fix per block (don't bundle)
5. Be brutally honest — if something looks mediocre, rewrite it
6. Don't re-flag anything from the "Already Fixed" list

---

## Audit Checklist

### A. DTP (donttouchpurple) — Game

**Files to read:** `App.tsx`, `engine/GameEngine.ts`, `engine/types.ts`, `components/Backgrounds/*.tsx` (all 22), `components/HUD/*.tsx`, `components/Screens/*.tsx`, `styles/game.css`, `styles/enhancements.css`, `hooks/useGameEngine.ts`, `services/firebase.ts`, `workers/score-validator.ts`, `DESIGN.md`, `HANDOFF.md`

Check for:
1. **Backgrounds** — Do all 22 use brand palette (`#fda9ff`, `#f3aeff`, `#f9bd22`, `#c026d3`)? Do they accept `reducedMotion`? Do they check `data-low-quality`? Do they clean up event listeners on unmount?
2. **Game engine** — Any remaining `navigator.userAgent` usage? Any `document.querySelector` that should be ref? Any memory leaks (intervals not cleared)?
3. **React components** — Any unnecessary re-renders? Missing `useMemo`/`useCallback`? Components over 200 lines that should be split?
4. **CSS** — Any `!important` overuse? Inconsistent spacing? Missing `prefers-reduced-motion` guards?
5. **Performance** — Any animation not using `transform`/`opacity` only? Any layout thrashing?
6. **Accessibility** — All interactive elements have `aria-label`? Focus visible on all buttons? Keyboard navigable?
7. **Mobile** — Touch targets ≥44px? Safe area insets? No horizontal scroll?
8. **Security** — Any `innerHTML`? Any user input not sanitized? CSP violations?

### B. Prayer Times — Schedule App

**Files to read:** `index.html` (single file, ~3500 lines), `worker/index.js`, `sw.js`, `CONTEXT.md`

Check for:
1. **Task system** — CRUD works? Modal opens/closes? Tasks persist in localStorage? Recurrence logic correct?
2. **iCal export** — VTIMEZONE for all 8 timezones correct? Tasks included? Prayer times use TZID format? RRULE correct?
3. **Notifications** — Scheduler fires 5 minutes before? Permission flow correct? Works in background?
4. **CSS** — Consistent spacing? Animations GPU-composited? Empty state styled?
5. **JavaScript** — Any `eval()`? Any `innerHTML` without sanitization? Any event listeners not cleaned up?
6. **CSP** — All domains in `connect-src` and `script-src` correct? No inline scripts remaining?
7. **Mobile** — Timeline scrollable? Modal full-screen on mobile? Touch targets adequate?
8. **i18n** — All keys defined in both `en` and `ar` objects? RTL layout correct?

### C. mscarabia — Corporate Site

**Files to read:** `index.html`, `assets/js/app.js`, `assets/js/main.js`, `assets/css/*.css`, `functions/api/quote.js`, `functions/api/contact.js`, `_headers`

Check for:
1. **CSP** — All 22 inline onclicks converted to `data-action`? Any remaining `onclick=` in HTML?
2. **Scripts** — All JS externalized? No inline `<script>` blocks?
3. **i18n** — Every `data-i18n` key has both `en` and `ar` translations? RTL layout works?
4. **Forms** — Contact form submits correctly? Quote capture sends email? Validation on all fields?
5. **Performance** — Fonts preloaded? Images optimized? CSS not render-blocking?
6. **Accessibility** — All images have `alt`? Heading hierarchy correct? Forms have labels?
7. **SEO** — OG tags complete (1200x630)? Twitter cards? Canonical URL? Structured data valid?
8. **Mobile** — Responsive at 320px? Navigation works? Calculator usable on touch?

---

## Output Format

For each repo:

```
## [REPO] — Audit Findings

### Critical (must fix)
1. [Issue]
   **File:** `path:line`
   **Code:**
   ```[language]
   [complete fix]
   ```

### High Priority (should fix)
...

### Medium Priority (nice to fix)
...

### Visual Polish (if you can see the code, describe what to improve)
...

### Quick Wins (copy-paste immediately)
...
```

---

## Specific Things to Check

### DTP
- Are the `.stat-card` and `.hearts` classes real? (grep `components/HUD/` to verify)
- Does `start-card` or `menu-card` match the actual start screen container?
- Is `reducedMotion` actually passed to all 22 backgrounds?
- Are there any `setTimeout` without cleanup?

### Prayer Times
- Does `renderPopular()` exist? (the empty-state button calls it)
- Is `unlockCourse` accessible from the delegated retry listener?
- Does the iCal export handle cities with no cached prayer data?
- Is `userOffsetH` initialized correctly?

### mscarabia
- Does `toggleLang` exist in `main.js`? (the data-action delegation calls it)
- Does `toggleMobileMenu` / `closeMobileMenu` exist?
- Does `openModal` / `closeModal` accept string args?
- Is the quote Worker (`/api/quote`) deployed and reachable?

---

## Quality Bar

After implementing every code block from this audit:
- DTP: 230+ tests pass, zero console errors, all backgrounds render
- Prayer: iCal imports correctly into Google Calendar, tasks persist, notifications fire
- Corp: 0 console errors, all sections scroll-reveal, email capture works, RTL complete

**Start by reading every file. Then audit everything. Then give me the code blocks.**
