# Game Mechanics

## Core Gameplay

Tap colored cells to score points. Each safe cell tap earns points based on your current multiplier. But if you tap a purple cell — it's over.

## Special Cells

| Cell | Color | Effect |
|------|-------|--------|
| Safe | Varies | +Points (base 1, modified by multiplier) |
| Purple | Purple | Instant game over |
| Red | Red | Danger — tap everything except red |
| Shield | Yellow | Protects against one mistake |
| Freeze | Blue | Pauses the game for 1 second |
| Multiplier | Gold | 2x score for a limited time |
| Medpack | Green | Restores 1 heart |
| Ice | Cyan | Freezes a cell in place for 2 seconds |
| Bomb | Dark | Removes 1 heart |

## Boss Events (Evolve Mode)

### Storm
Cells shuffle at lightning speed. Your muscle memory betrays you. The grid you memorized 2 seconds ago? Gone.

### Inversion
Safe and danger colors SWAP. Everything you learned is now wrong. Green is death. Purple is safe.

### Blackout
The grid goes COMPLETELY DARK. You tap from memory alone. One wrong move and it's over.

## Rare Color Mode

Periodically, the game shifts to a rare color mode where the color palette changes. You must rapidly re-learn which colors are safe and which are dangerous.

## Scoring

- Base points per tap: 1
- Multiplier: 2x when multiplier cell is active
- Combo bonus: Consecutive safe taps increase your combo
- Survival bonus: Longer survival = higher score per tick
- Impossible score check: `score > tick * 15 + 300` triggers server-side validation
