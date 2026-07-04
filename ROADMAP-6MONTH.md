# MSC Arabia — 6-Month Product Roadmap (from Opus V3)

**Date:** 2026-07-04
**Status:** Approved, ready for execution

---

## Per-Site Features

### prayer.mscarabia.com
1. **Mosque/Madrasah Mode** — shareable read-only board for lobby screens. URL-param view, city + class schedule + live countdown. The wedge that gets shared with a whole congregation.
2. **Adhan + Pre-Prayer Push Notifications** — persistent offline reminders via existing service worker + Notification API. #1 reason people keep a prayer app installed.
3. **Teacher Attendance Roster** — panel already shows "Missing 2 lessons releases your place." Make it real with Worker + KV/Firestore writes. Turns madrasah into system of record.

### game.mscarabia.com
1. **Async Weekly Seeded Ladder** — same seed per week, leaderboard resets Monday. Existing `mulberry32` + HMAC-signed scores. This is the retention engine.
2. **Replay/Ghost from Challenge Link** — record input trace, let someone race a ghost. Streamer catnip, zero new backend.
3. **Auto OG Share Card** — `scoreCardGen` exists. Auto-generate OG image per run for social previews. Free viral loop.

### mscarabia.com
1. **Calculator Email-Capture** — capture email from quote → fire contact form → instant PDF estimate. Calculator is the best lead magnet, currently dead-end.
2. **Fire Safety Compliance Checklist** — NFPA/Civil Defense gated download or interactive tool. The "let's call them" hook.
3. **Case Studies** — one-paragraph proof stories with Aramco, STC, Petro Rabigh names.

---

## New Sites

### MSC Client Portal (M)
Ticket status + SLA countdown + asset list. React/Firebase. Turns support into retention moat.

### Fire Safety Inspection PWA (M)
Offline-first checklist for on-site engineers. Photo capture, compliance report generation. Highest business value on the list.

### Manpower Job Board (S/M)
Public-facing, feeds visa/deployment pipeline.

---

## Cross-Cutting
- Extract `@msc/ui` shared tokens + components
- Finish 14 unfinished DTP backgrounds
- Verify Arabic completeness on corp site

---

## Priority Matrix

### Month 1-2 (immediate)
- [ ] Weekly seeded ladder (DTP)
- [ ] Calculator email-capture (corp)
- [ ] Verify Firebase secrets working in prod

### Month 2-4 (core)
- [ ] Prayer push notifications
- [ ] Mosque/Madrasah mode
- [ ] Fire Safety Inspection PWA kickoff

### Month 4-6 (scale)
- [ ] Client Portal
- [ ] Shared `@msc/ui` package
- [ ] Finish DTP backgrounds
