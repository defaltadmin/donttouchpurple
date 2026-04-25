# Project: Don't Touch Purple

## Context
High-intensity avoid-em-up game built with React, TypeScript, and Vite. Uses Firebase for leaderboard/backend.

## Architecture
- `/engine`: Core logic (GameEngine.ts, DifficultyScaler.ts).
- `/hooks`: React integration (useGameEngine.ts).
- `/components`: UI (HUD, Screens, Settings).
- `/config`: Game balancing (difficulty, patterns, powerups).

## Development Rules
1. **The Sonnet Bridge:** 
   - User often brings logic/UI code from Sonnet (web).
   - CLI Agent must apply these changes surgically.
   - Always verify imports and type safety after applying Sonnet code.
2. **Git First:** 
   - Every feature or fix must be committed with a clear message.
   - To update Sonnet, use `git diff` to provide context.
3. **Environment:**
   - Windows (win32).
   - Use `pnpm` for package management.
4. **Active Features/Gotchas:**
   - `devRotationSpeed`: Must be emitted in snapshots to `PlayerPanel`.
   - `devGodMode`: Ensure damage sites are properly guarded.
   - `heatmap`: Managed in `DevOverlay.tsx`.

## Standard Commands
- Build: `pnpm build`
- Dev: `pnpm dev`
- Resume: Use `./RESUME_GEMINI.bat`

## Tone
- Terse, technical, senior engineer level.
- No filler. Just implementation and verification.
