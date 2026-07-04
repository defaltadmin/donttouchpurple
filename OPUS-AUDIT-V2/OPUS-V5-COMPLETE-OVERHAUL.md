# Opus V5 — Complete Overhaul (Single-Shot, All Phases, No Questions)

**Platform:** ClickUp AI Brain (GitHub MCP connected)
**Date:** 2026-07-04
**Budget:** This is a one-shot prompt. Do NOT stop to ask questions. Do NOT pause between phases. Generate ALL code blocks for ALL phases in a single response. If you're unsure about something, make a reasonable decision and note it.

---

## Context

Three repos need a complete polish overhaul. Previous audits identified issues but didn't deliver enough code. This prompt demands code blocks for every change. You have GitHub MCP access — read every file before writing code.

**Repos:**
- `defaltadmin/donttouchpurple` — React/TS game with 22 OGL backgrounds
- `defaltadmin/world-prayer-times` — Single-file vanilla JS prayer times app
- `defaltadmin/mscarabia` — Static HTML/CSS/JS corporate site

**Design systems:**
- DTP: "Hyper-Juice Arcade" — `#151028` surface, `#fda9ff` primary (pink), `#f9bd22` tertiary (gold), MD3 tokens
- Prayer: Teal/cyan palette, IBM Plex Sans Arabic, glassmorphism
- Corp: Crimson-led, Space Grotesk + Plus Jakarta Sans, inline SVGs

---

## PHASE 1: DTP Background Overhaul (13 backgrounds)

### Background Pattern

Every background must follow this pattern (already proven in GridPulse.tsx):

```tsx
import { useEffect, useRef } from 'react';
import { useBackgroundController } from '../../hooks/useBackground';
import { useSafeRaf } from './cleanup-pattern';

// Brand palette from DESIGN.md
const COLORS = ['#fda9ff', '#f3aeff', '#f9bd22', '#c026d3'];

export default function BackgroundName({ reducedMotion }: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const { register } = useBackgroundController(true);

  const draw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas || document.hidden) return;
    const lowQ = document.documentElement.hasAttribute('data-low-quality');
    // ... rendering logic ...
  };

  const { start, stop } = useSafeRaf(draw);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctxRef.current = ctx;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); ctxRef.current = null; };
  }, []);

  useEffect(() => {
    if (reducedMotion) { draw(); return; }
    const unregister = register({ pause: stop, resume: start });
    start();
    return () => { unregister?.(); stop(); };
  }, [register, start, stop, reducedMotion]);

  return <canvas ref={canvasRef} className="dtp-bg-canvas" aria-hidden="true" />;
}
```

### Required Changes for Each Background

For EACH of these 13 backgrounds, provide the COMPLETE rewritten file:

1. **VoidTunnel** — `components/Backgrounds/VoidTunnel.tsx`
2. **StarWarp** — `components/Backgrounds/StarWarp.tsx`
3. **PurpleRain** — `components/Backgrounds/PurpleRain.tsx`
4. **PurpleCascade** — `components/Backgrounds/PurpleCascade.tsx`
5. **BlockOrbit** — `components/Backgrounds/BlockOrbit.tsx`
6. **DataStream** — `components/Backgrounds/DataStream.tsx`
7. **CellBreath** — `components/Backgrounds/CellBreath.tsx`
8. **WarpGate** — `components/Backgrounds/WarpGate.tsx`
9. **PulseField** — `components/Backgrounds/PulseField.tsx`
10. **AmbientFlow** — `components/Backgrounds/AmbientFlow.tsx`
11. **DigitalRain** — `components/Backgrounds/DigitalRain.tsx`
12. **AuroraBorealis** — `components/Backgrounds/AuroraBorealis.tsx`
13. **Silk** — `components/Backgrounds/Silk.tsx`

### Rules for Each Background
- Use ONLY brand colors: `#fda9ff` (pink), `#f3aeff` (light pink), `#f9bd22` (gold), `#c026d3` (magenta), `#151028` (surface)
- NO generic rainbow colors (no blue, green, orange, cyan unless they're brand tokens)
- MUST accept `reducedMotion` prop — static single frame when true
- MUST check `data-low-quality` — simplified rendering (no shadowBlur, fewer particles)
- MUST use `document.hidden` for idle skip
- MUST use `dtp-bg-canvas` class
- MUST clean up all event listeners on unmount
- Under 150 lines each
- Must work with existing `useBackgroundController` + `useSafeRaf` hooks

### Background Quality Checklist
For each background, answer:
- Does it look like it belongs in a premium browser game?
- Does it animate at 60fps?
- Does it respect reduced motion?
- Does it handle low-quality mode?
- Is the color palette on-brand?

---

## PHASE 2: Prayer Times — Personal Tasks System

### What to Build

Add a personal task/reminder system to the prayer times app. Users can create tasks that appear on the timeline alongside prayer times.

### Data Model (localStorage)

```js
// Key: 'wp_tasks'
// Value: JSON array of task objects
{
  id: string,          // crypto.randomUUID()
  name: string,        // task name (max 50 chars)
  startHour: number,   // 0-23 (UTC)
  startMin: number,    // 0-59
  durationMin: number, // in minutes
  color: string,       // hex color for the block
  recurrence: 'none' | 'daily' | 'weekly',
  days: number[],      // 0-6 (Sun-Sat) for weekly
  createdAt: number    // timestamp
}
```

### UI Components to Add

1. **"Add Task" button** — next to the "Add City" button in the header
2. **Task modal** — form with: name, start time (hour:minute picker), duration (slider), color picker (5 brand colors), recurrence selector
3. **Task blocks on timeline** — colored blocks on the 24h grid, same rendering pattern as prayer blocks
4. **Task context menu** — right-click/tap-hold on a task block to edit or delete
5. **Task list panel** — scrollable list of all tasks, accessible from the header

### Code to Provide

For each component, provide the COMPLETE HTML + CSS + JS:

1. **Task modal HTML** — the form markup
2. **Task modal CSS** — styling matching the existing glassmorphism design
3. **Task CRUD JS** — `createTask()`, `updateTask()`, `deleteTask()`, `getTasks()`, `saveTasks()`
4. **Task rendering** — integration with `renderRow()` to show task blocks on the timeline
5. **Task context menu** — edit/delete UI
6. **Task list panel** — scrollable list view

### Timeline Integration

Task blocks should:
- Render as colored rectangles on the 24h grid (same as prayer blocks)
- Use a distinct color palette (e.g., `#34d399` green, `#60a5fa` blue, `#f472b6` pink, `#fbbf24` gold, `#a78bfa` purple)
- Show task name on hover/tap
- Be draggable to resize duration (optional — if time permits)

---

## PHASE 3: Prayer Times — iCal Export Fix

### Problem

The current `exportICal()` function produces .ics files that import with wrong times in Outlook/Google Calendar because:
1. Missing VTIMEZONE components
2. Using UTC conversion instead of TZID
3. No personal tasks included

### Solution

Rewrite `exportICal()` to:

1. **Include VTIMEZONE definitions** for:
   - `Asia/Riyadh` (AST, UTC+3)
   - `Europe/London` (GMT/BST)
   - `America/New_York` (EST/EDT)
   - `Asia/Kolkata` (IST, UTC+5:30)
   - `Asia/Dubai` (GST, UTC+4)
   - `Asia/Jakarta` (WIB, UTC+7)
   - `Asia/Kuala_Lumpur` (MYT, UTC+8)
   - `Asia/Tokyo` (JST, UTC+9)

2. **Use TZID format** for all events:
   ```
   DTSTART;TZID=Asia/Riyadh:20260704T033000
   DTEND;TZID=Asia/Riyadh:20260704T040000
   ```

3. **Include personal tasks** from Phase 2

4. **Include recurring prayer times** with RRULE:
   ```
   RRULE:FREQ=DAILY
   ```

5. **Proper line folding** (75 chars per line per RFC 5545)

6. **Escaped descriptions** (commas, semicolons, newlines)

### Code to Provide

The COMPLETE rewritten `exportICal()` function (replace the existing one in `index.html`). Should be ~150-200 lines. Include:
- VTIMEZONE block for all 8 timezones
- Prayer time events with proper TZID
- Personal task events
- RRULE for daily prayers
- Proper line folding
- Download trigger

---

## PHASE 4: Prayer Times — Notification System

### What to Build

Browser notifications for prayer reminders. 5 minutes before each prayer, the user gets a notification.

### Architecture

1. **Service Worker** — `sw.js` already exists. Add notification scheduling to it.
2. **Permission request** — ask on first visit, show a subtle prompt
3. **Scheduling** — calculate next prayer time, schedule notification via `self.registration.showNotification()`
4. **Settings** — toggle per-prayer notifications

### Code to Provide

1. **Service Worker additions** — notification click handler, background sync
2. **Notification scheduling JS** — `schedulePrayerNotification(prayerName, minutesBefore)`, `cancelAllNotifications()`
3. **Permission request UI** — subtle banner or modal
4. **Settings panel** — toggles for each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha)
5. **Integration** — hook into the existing notification code at ~line 2380

---

## PHASE 5: Prayer Times — UI Polish

### Changes Needed

1. **Theme transition** — smooth cross-fade when switching dark/light (not instant snap)
2. **Animated prayer block entrance** — staggered fade-in when timeline loads
3. **Better empty state** — when no cities added, show a friendly prompt with illustration
4. **Improved font loading** — preload critical fonts, use `font-display: swap`
5. **Consistent spacing** — use the `--sp-*` token system everywhere
6. **Mobile improvements** — better touch targets, smoother scrolling
7. **Micro-interactions** — button hover effects, link transitions, focus states

### Code to Provide

For each polish item, provide the exact CSS or JS change with file location and line numbers.

---

## PHASE 6: mscarabia — Visual Overhaul

### Hero Section Rewrite

The hero should be the most impressive part of the site. Provide:

1. **Animated gradient background** — subtle, GPU-composited (transform only, no filter)
2. **Stats counter** — animated count-up on scroll (10+ years, 17+ clients, 500+ workers)
3. **Strong headline** — proper type scale with Space Grotesk
4. **CTA button** — hover animation (scale + shadow)
5. **Scroll-triggered reveal** — IntersectionObserver fade-in

### Services Section Polish

1. **Card hover effects** — subtle lift + border glow
2. **Icon color transitions** — smooth color change on hover
3. **Staggered entrance** — cards fade in one by one on scroll
4. **Better spacing** — consistent padding/margins

### Calculator Section Upgrade

1. **Real-time total** — animated number transition when sliders change
2. **Email capture** — form field in the result area
3. **PDF estimate** — generate a simple PDF summary (can use a client-side library or just format as printable HTML)
4. **Professional result display** — glassmorphism card with the total and CTA

### Scroll Animations

Add IntersectionObserver to every section:
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

CSS:
```css
.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.revealed { opacity: 1; transform: translateY(0); }
```

### Code to Provide

1. **Hero section** — complete HTML rewrite
2. **Hero CSS** — animations, gradients, type scale
3. **Services cards** — hover effects, entrance animations
4. **Calculator upgrade** — email capture, animated total
5. **Scroll reveal JS** — IntersectionObserver code
6. **Scroll reveal CSS** — transition classes

---

## PHASE 7: mscarabia — Backend Integration

### Calculator Email Capture

When the user clicks "Request Quote" on the calculator:

1. **Capture form data** — name, email, company, workers, budget, duration, professions
2. **Send to Cloudflare Worker** — create a new Worker endpoint `/api/quote`
3. **Worker processes** — validates input, sends email via Mailgun/SendGrid, stores in KV
4. **Response** — success message with "We'll send your detailed estimate within 24 hours"

### Code to Provide

1. **Worker code** — `worker/quote-worker.js` (Cloudflare Worker)
2. **Worker config** — `worker/wrangler.toml`
3. **Frontend integration** — form submission handler
4. **Email template** — HTML email with the quote details
5. **Error handling** — retry logic, fallback message

---

## Output Format

For EACH phase, produce:

```
## PHASE X: [Name]

### Change X.1: [description]
**File:** `path/to/file`
**Action:** [REPLACE / ADD / MODIFY]

**Code:**
```[language]
[complete code block]
```

### Change X.2: [description]
...
```

---

## Rules

1. **No questions.** If you're unsure, make a reasonable decision.
2. **No stopping.** Generate ALL code for ALL 7 phases in one response.
3. **Complete code only.** Every code block must be copy-pasteable.
4. **File paths must be exact.** Match the actual repo structure.
5. **Test your logic.** Functions must be syntactically correct.
6. **One change per block.** Don't bundle multiple changes.
7. **Include line numbers** when modifying existing files.
8. **Read before writing.** Use GitHub MCP to read each file before providing code.

---

## Quality Bar

After Mimo applies every code block:

1. **DTP backgrounds** — all 22 should look premium, on-brand, and consistent
2. **Prayer times** — should feel like an indispensable daily tool with tasks, notifications, and proper calendar export
3. **mscarabia** — should look like a $50K agency build with scroll animations, email capture, and professional polish

**Start reading files now. Then generate all code blocks. Do not stop until every phase is complete.**
