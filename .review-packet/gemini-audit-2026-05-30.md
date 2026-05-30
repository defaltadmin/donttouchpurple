# Gemini Audit — 2026-05-30

## Security
- Critical: Dust sync insecure (fbSyncDust accepts client value) — soft currency, accepted risk
- High: Score spoofing via API — has server-side validation already
- Medium: Weak monotonic guard on dust (10k delta allows micro-cheating)
- Medium: Disabled App Check (duplicate of SEC-004)

## Performance
- High: useGameEngine snapshot re-renders entire tree
- Medium: emitSnapshot large object
- Medium: App.tsx monolithic (known)

## Code Quality / Game Logic
- Medium: Clock domain mixing (duplicate)
- Low: WeakMap key stability in TickProcessor
- Low: Dead code _bombDefuseCount
- Low: Visibility auto-resume bug (valid!)
