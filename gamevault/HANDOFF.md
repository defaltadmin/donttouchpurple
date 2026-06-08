# Game Vault — Handoff for Next AI

## Overview

Standalone single-file HTML/CSS/JS dashboard for managing cross-platform game libraries. Built from a Gemini-generated template (`reference.html`) into a polished production-ready tool (`index.html`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | **The dashboard** — open this. 27 KB, all-in-one. |
| `reference.html` | Original Gemini output that inspired the build (keep for context) |
| `game-vault-instructions.md` | Original user instructions for Playnite integration |
| `HANDOFF.md` | This file — for the next AI to pick up |

## How to Run

**Option A — Dev server** (if Vite project is running):
```
http://localhost:5173/game-vault.html
```
Or after moving to `gamevault/`, serve with anything:
```
npx serve gamevault/
```

**Option B — Direct open**:
Just double-click `gamevault/index.html` in your file explorer. Works standalone (no build step, no dependencies).

## What's Built

### Core features
- **20 sample games** pre-loaded (Steam, GOG, Epic, Xbox, PlayStation, Rockstar)
- **Playnite JSON import** via file upload (collapsible section with PowerShell script)
- **Search** by title, **filter** by platform or play status, **sort** by name/playtime/rating/release date
- **Star ratings** (1-5) + **play status** (Unassigned/Backlog/Playing/Completed)
- **Random game picker** with animated modal
- **Stats bar**: total games, installed count, total playtime, platform count
- **Export ratings** as JSON download
- **Reset all metadata**
- **Toast notifications** for all actions

### Design
- Glassmorphism dark theme (rgba borders, backdrop-filter blur)
- Animated gradient background
- Responsive (mobile-first with breakpoint at 600px)
- Hover states, focus rings, smooth transitions

### Data schema (Playnite export format)
Fields consumed from JSON: `Name`, `Source`, `ReleaseDate`, `Playtime` (seconds), `IsInstalled`

## State
- ✅ Working and tested (27 KB, 0 dependencies)
- ✅ File served by Vite dev server at `/game-vault.html`
- ✅ Also works standalone when opened directly

## Potential Next Steps
1. Add cover art support (URL or local path in JSON schema)
2. Add charts (playtime distribution, platform breakdown via Chart.js)
3. Add filtering by year/decade
4. Add bulk edit mode (multi-select games, batch status update)
5. Add dark/light theme toggle
6. Add game notes/comments field
7. Add CSV import option alongside JSON
8. Add keyboard shortcuts (Enter to search, Escape to close modal, etc.)
9. Add persistent game data (currently reloads sample data on each open; could save imported data to localStorage too)
10. Integrate into the main DTP game app as an admin tool

## Original User Instructions (preserved verbatim in `game-vault-instructions.md`)

The user provided two options for seeding data:
- **Option A**: Playnite PowerShell export → JSON upload
- **Option B**: Hardcoded array in `gamesData` variable
