# Opus V4 — Full Polish Overhaul (No Suggestions, Only Code)

**Platform:** ClickUp AI Brain (GitHub MCP connected)
**Date:** 2026-07-04
**Repos:** `defaltadmin/donttouchpurple` | `defaltadmin/mscarabia` | `defaltadmin/world-prayer-times`

---

## The Problem

The previous audits were too conservative. They flagged small CSS tweaks and called it done. The sites still don't feel premium. The backgrounds in the game are inconsistent. The corp site looks like a template. The prayer times app has no personal task/reminder system and the iCal export is broken for timezone-aware import.

**This audit is different.** You are doing a full frontend + backend overhaul. Every output must be a **complete, copy-pasteable code block** that Mimo can drop into the files. No "consider adding X." No "you might want to." Show the exact code, the exact file, the exact line range.

---

## Rules

1. **Read EVERY file** in each repo before suggesting anything. No guessing.
2. **Every change = a code block.** No exceptions. If you can't write the code, don't mention the issue.
3. **Each code block must specify:** File path, line range to replace, the old code, the new code.
4. **Test your logic.** If you write a function, make sure it compiles. If you write CSS, make sure selectors match.
5. **Be aggressive.** If something looks mediocre, rewrite it. If a component is ugly, redesign it. This is a polish overhaul, not a minor tune-up.
6. **One issue at a time.** Don't bundle 5 fixes into one code block. Each fix is separate so Mimo can apply them incrementally.

---

## SITE 1: game.mscarabia.com — Background Overhaul

### The Problem
The 22 OGL/WebGL backgrounds are inconsistent. Some are polished (Galaxy, Nebula), others look unfinished or generic (VoidTunnel, GridPulse). The HANDOFF.md lists 14 unfinished backgrounds. The user sees this as the #1 visual quality issue.

### What You Must Do

1. **Read every background component** in `components/Backgrounds/`. For each one, evaluate:
   - Does it look premium or generic?
   - Does it animate smoothly (60fps, GPU-composited)?
   - Does it respect `prefers-reduced-motion`?
   - Does it handle WebGL context loss?
   - Is it consistent with the "Hyper-Juice Arcade" design system?

2. **For each background that needs work**, provide the COMPLETE rewritten component. Not a diff — the full file. Each background should:
   - Use the DESIGN.md token system (`--bg`, `--accent`, `--gold`, etc.)
   - Have smooth, purposeful animation (not just particles floating randomly)
   - Include proper cleanup on unmount
   - Handle `data-low-quality` mode (simplified rendering)
   - Be under 150 lines

3. **Create a new background** if any are truly unsalvageable. The goal: every background should make someone say "wow" when they see it, not "that's nice."

4. **The background selector UI** — make it feel premium. Smooth transitions between backgrounds, preview thumbnails, proper spacing.

### Key Files
- `components/Backgrounds/*.tsx` — all 22 backgrounds
- `components/Backgrounds/cleanup-pattern.ts` — shared cleanup
- `styles/game.css` — background-related CSS
- `DESIGN.md` — token system

---

## SITE 2: mscarabia.com — Full Visual Overhaul

### The Problem
The corp site has good bones (Space Grotesk + Plus Jakarta Sans, crimson palette, inline SVGs) but the overall feel is still "developer portfolio" not "$50K agency build." Sections need better visual hierarchy, more intentional whitespace, and the kind of micro-interactions that make a site feel alive.

### What You Must Do

1. **Read the entire `index.html`** (all 2397 lines). For each section, evaluate:
   - Is the visual hierarchy clear? (h1 > h2 > h3 > body)
   - Is the spacing consistent? (8px grid system)
   - Are hover states smooth and intentional?
   - Does the section transition feel polished?
   - Is the mobile experience as good as desktop?

2. **Rewrite the hero section.** It should be the most impressive thing on the page. Current hero is functional but not breathtaking. Make it agency-grade:
   - Animated gradient or subtle particle effect
   - Strong headline with proper type scale
   - Clear CTA with hover animation
   - Stats bar that counts up on scroll

3. **Rewrite the services section.** Each card should feel like a premium service offering, not a bullet list:
   - Icon with hover color transition
   - Brief description with proper line height
   - "Learn more" link with arrow animation
   - Staggered entrance animation on scroll

4. **Rewrite the calculator section.** This is the lead magnet — it should look like a $500K SaaS pricing calculator:
   - Real-time total with animated number transition
   - Range sliders with custom styling (already done, but verify)
   - Professional result display with CTA
   - Email capture form integrated into the result

5. **Add scroll-triggered animations** using IntersectionObserver. Every section should fade/slide in as you scroll down. Use `transform` + `opacity` only (GPU-composited).

6. **Add a premium loading state** — a brief skeleton/shimmer while fonts load, then a smooth reveal.

### Key Files
- `index.html` — the entire site
- `assets/js/main.min.js` — interactions
- `assets/js/hero-canvas.min.js` — hero background

---

## SITE 3: prayer.mscarabia.com — Features + Polish

### The Problem
The prayer times app is functional but missing key features that would make it indispensable:
1. No personal task/reminder system (add your own tasks alongside prayer times)
2. iCal export is broken for timezone-aware import (Outlook/Google Calendar)
3. No notification system for prayer reminders
4. The UI could be more polished (spacing, animations, micro-interactions)

### What You Must Do

#### A. Personal Tasks/Reminders System

Add a feature where users can create personal tasks that appear on the timeline alongside prayer times. This turns the app from "prayer reference" into "daily schedule coordinator."

**Requirements:**
- Users can add tasks with: name, start time, duration, recurrence (daily/weekly/none)
- Tasks appear as colored blocks on the timeline (different color from prayer blocks)
- Tasks persist in localStorage
- Tasks can be edited/deleted
- Tasks show in the iCal export

**Provide:**
1. The complete HTML for the "Add Task" modal/form
2. The complete CSS for the task blocks on the timeline
3. The complete JS for task CRUD (create, read, update, delete)
4. The integration with `renderRow()` to display tasks on the timeline
5. The integration with `exportICal()` to include tasks in the export

#### B. iCal Export Fix

The current iCal export has timezone issues. When someone imports into Outlook or Google Calendar, the times are wrong because the VTIMEZONE component is missing or incorrect.

**Requirements:**
- Include proper VTIMEZONE components for all supported timezones
- Use `DTSTART;TZID=Asia/Riyadh` format (not UTC conversion)
- Include RRULE for recurring prayer times
- Include the new personal tasks in the export
- Test: the exported .ics file should import correctly into Outlook and Google Calendar

**Provide:**
1. The complete rewritten `exportICal()` function
2. Proper VTIMEZONE definitions for at least: Asia/Riyadh, Europe/London, America/New_York, Asia/Kolkata
3. The integration with the personal tasks system

#### C. Notification System

Add browser notifications for prayer reminders. The plumbing exists (~line 2380) but it's in-session only.

**Requirements:**
- Request notification permission on first visit
- Send notification 5 minutes before each prayer
- Work even when the tab is in the background (use Service Worker)
- Allow users to enable/disable notifications per prayer
- Respect `prefers-reduced-motion`

**Provide:**
1. The Service Worker code for background notifications
2. The notification scheduling logic
3. The UI toggle for enabling/disabling notifications
4. The CSS for the notification settings panel

#### D. UI Polish

- Smooth transitions between dark/light theme
- Better spacing on mobile (consistent padding)
- Animated prayer block entrance (staggered fade-in)
- Better empty state (when no cities are added)
- Improved font loading (preload critical fonts)

**Provide:**
1. CSS for each animation/transitions
2. The IntersectionObserver code for scroll-triggered animations
3. The improved empty state component

### Key Files
- `index.html` — the entire app (single-file)
- `CONTEXT.md` — existing audit trail
- `PRD.md` — product requirements

---

## Output Format

For EACH site, produce:

```
## [SITE] — Overhaul Changes

### Change 1: [name]
**File:** `path/to/file`
**Lines:** X-Y (old) → X-Y (new)

**Old code:**
```[language]
[exact old code]
```

**New code:**
```[language]
[complete new code]
```

**What this fixes:** [one sentence]

### Change 2: [name]
...
```

---

## Quality Bar

After Mimo applies every code block from this audit:

1. **DTP backgrounds** — every background should look like it belongs in a premium browser game, not a CodePen demo
2. **mscarabia** — should look like it was built by a 5-person agency with a design director
3. **prayer times** — should feel like an indispensable daily tool, not a reference page

The difference between this audit and the previous ones: **previous audits suggested. This audit delivers code.**

**Start by reading every file. Then rewrite what needs rewriting. Then give Mimo the code blocks.**
