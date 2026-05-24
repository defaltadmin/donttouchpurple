# Don't Touch Purple — Product Hunt Launch

## Tagline

**Every cell could kill you. Tap everything except purple.**

*(58 characters)*

---

## Description

Don't Touch Purple is a reflex-based grid-tapping game that starts simple and turns brutal fast. A grid of colored cells appears. Tap the safe ones. Avoid purple. Sounds easy — until bombs start chaining, the grid inverts mid-tap, and a boss event floods the screen with corruption cells you've never seen before.

There are 13 special cell types that keep every round unpredictable: shields that save you, multipliers that reward risk, portals that teleport your tap, and corruption cells that spread if you ignore them. Every 30 seconds, a boss event triggers — Bomb Surge scatters explosives across the grid while Inversion Storm flips your controls. The game doesn't get harder by just speeding up. It gets harder by changing the rules.

Four game modes give you different ways to play: Classic for the core loop, Evolve where new cell types unlock as you survive longer, Practice to learn the chaos at your own pace, and a Daily Challenge with a shared seed so everyone competes on the same grid. Global and weekly leaderboards, 37 achievements, and a dust economy with a shop system round out the progression. 15 animated WebGL backgrounds — Galaxy, Hyperspeed, Silk, Lightning, and more — make the whole thing look like a neon fever dream.

Free to play. No ads. No pay-to-win. No accounts required. Just tap.

**Play now:** https://defaltadmin.github.io/donttouchpurple

---

## First Comment (Maker Comment)

I built this because I wanted a game I could play in 30-second bursts that still felt skill-based. Most mobile reflex games boil down to "tap the right thing faster" with no real variety. I wanted every run to feel different — not because of random difficulty spikes, but because the game introduces new mechanics that change how you think about the grid.

The boss events were the breakthrough. When I added Bomb Surge and Inversion Storm, the game went from "a pleasant distraction" to something I kept losing 20 minutes to. They force you to abandon your current strategy mid-run and adapt. That's the "just one more try" hook — you die, but you die thinking "I know what to do differently next time."

Everything is built with React 19, TypeScript, and WebGL (OGL). The backgrounds aren't static — they're real-time shader-driven animations that react to your game state. The whole thing runs in a browser with no install, no account, no friction. I wanted anyone with a link to be playing in under 5 seconds.

It's free, there are no ads, and there never will be. I made this because I wanted to play it. If you do too, I'd love to hear what breaks you.

---

## Topics

1. **Games** — Primary category
2. **Open Source** — MIT licensed, fully public repo
3. **Web Apps** — Browser-based, no install required
4. **Indie Games** — Solo developer, no studio backing
5. **Developer Tools** — Built with React 19, TypeScript, Vite, WebGL (appeals to maker community)

---

## Assets Checklist

### Required

- [ ] **Logo (240x240 PNG)** — DTP icon/logo, clean on dark background
- [ ] **Gallery Images (1270x760 PNG, 3-5 images)** —
  1. Gameplay screenshot showing grid with multiple cell types active
  2. Boss event in progress (Bomb Surge or Inversion Storm)
  3. Achievement unlock + shop screen showing dust economy
  4. Daily Challenge / leaderboard screen
  5. Background theme showcase (split 4 ways: Galaxy, Lightning, Silk, Hyperspeed)
- [ ] **Thumbnail (240x240 PNG)** — Same as logo or cropped gameplay moment

### Recommended

- [ ] **GIF or Video (under 60 seconds)** — Screen recording showing:
  - Normal gameplay (5 seconds)
  - A boss event triggering (5 seconds)
  - Death + "just one more try" restart (3 seconds)
  - Quick flash of backgrounds/themes (5 seconds)
- [ ] **Social preview image (1200x630)** — For when the listing is shared on Twitter/X
- [ ] **Maker avatar** — Personal photo or recognizable indie dev avatar

### Screenshot Notes

- Capture at 1280x800 or similar desktop resolution
- Dark backgrounds — game aesthetic is deep purple/black, ensure UI elements are visible
- Show a moment with 3+ cell types visible to convey variety
- Boss event screenshot is the most important — that's the differentiator

---

## Launch Day Checklist

### Timing

- **Target: Tuesday or Wednesday, 12:01 AM Pacific Time** — Product Hunt resets daily at midnight PT. Early posting = full 24 hours of visibility.
- **Avoid:** Mondays (weekend backlog competes), Thursdays/Fridays (lower engagement), and any day with a major tech event.
- **Pre-launch:** Submit the listing 2-3 days early for review. Product Hunt manually reviews new submissions.

### Week Before Launch

- [ ] Submit listing for Product Hunt review (2-3 days before)
- [ ] Prepare all gallery images and GIF/video
- [ ] Write and schedule social posts (Twitter/X, Reddit, Hacker News)
- [ ] Prepare a short email for friends/colleagues who might upvote
- [ ] Join relevant Product Hunt discussions to build presence
- [ ] Test the game link — make sure it loads fast and works on mobile
- [ ] Pre-write Reddit posts for r/WebGames, r/gamedev, r/IndieGaming, r/reactjs

### Launch Day (12:01 AM PT)

- [ ] Confirm listing is live on Product Hunt
- [ ] Post maker comment (copy from above)
- [ ] Tweet/X announcement with link to PH listing
- [ ] Post on Hacker News (Show HN) — title: "Show HN: Don't Touch Purple – reflex grid-tapping game with boss events"
- [ ] Post on r/WebGames — title: "Don't Touch Purple – browser-based reflex game with 13 cell types and boss events"
- [ ] Post on r/gamedev — focus on the technical side (React 19 + WebGL, open source)
- [ ] Send personal messages to friends/early supporters (don't mass-blast, keep it genuine)

### Morning (8-10 AM PT)

- [ ] Respond to every comment on the Product Hunt listing
- [ ] Share the listing on LinkedIn if relevant network exists
- [ ] Post in any Discord/Slack communities where game devs hang out

### Throughout the Day

- [ ] Monitor and respond to all PH comments within 1 hour
- [ ] Share milestone updates ("We hit #5 on Product Hunt!") on social
- [ ] Thank commenters individually
- [ ] Track upvote trajectory — if slowing, engage more communities

### After Launch

- [ ] Write a thank-you post for supporters
- [ ] Share results (final ranking, traffic numbers) on Twitter/X — makers love transparency
- [ ] Add "As seen on Product Hunt" badge to the game/README
- [ ] Analyze traffic spike — what converted, what bounced
- [ ] Follow up on any feedback or bug reports from PH comments

### Reddit Post Drafts

**r/WebGames:**
> **Don't Touch Purple — reflex grid-tapping game with boss events**
>
> Tap the colored cells. Avoid purple. Sounds simple until a Bomb Surge fills the screen with explosives and an Inversion Storm flips your controls.
>
> 13 special cell types, 4 game modes, daily challenges, leaderboards, 37 achievements. 15 animated WebGL backgrounds. Free, no ads, no accounts.
>
> Play: https://defaltadmin.github.io/donttouchpurple
> Source: https://github.com/defaltadmin/donttouchpurple

**r/reactjs:**
> **I built a real-time reflex game with React 19 + WebGL (OGL)**
>
> Don't Touch Purple is a grid-tapping game where cells are replaced each tick, state machines drive the UI, and 15 shader-based backgrounds run in real-time. No canvas game framework — just React for UI, OGL for rendering, and a pure-logic game engine with zero React imports.
>
> Open source, MIT licensed. Would love feedback on the architecture.
>
> Repo: https://github.com/defaltadmin/donttouchpurple

---

## Positioning Notes

### What Makes DTP Different (for PH audience)

1. **Boss events** — No other reflex game has periodic rule-breaking events that force adaptation mid-run
2. **13 cell types** — Not just "tap this, avoid that" — each cell changes the strategy
3. **No install, no account, no friction** — Link to playing in under 5 seconds
4. **WebGL backgrounds that react to gameplay** — Not a static HTML game
5. **Open source** — PH community respects this; MIT licensed, public repo
6. **No ads, no pay-to-win** — Genuinely free, no dark patterns

### Competitor Awareness

- **Flappy Bird** — Simple, viral, one mechanic. DTP has depth.
- **2048** — Puzzle, not reflex. Different audience.
- **Agar.io** — Multiplayer. DTP is single-player with leaderboards.
- **Color Switch** — Similar "avoid the wrong color" but DTP has boss events and cell variety.

### Key Metrics to Track

- Product Hunt ranking (target: top 5 of the day)
- GitHub stars spike
- Unique visitors from PH referral
- Average session duration (are people playing or bouncing?)
- Leaderboard sign-ups (are people engaging beyond one round?)
