# Leaderboard

## How Scoring Works

Your final score is calculated from:
- **Base points**: Each safe cell tap earns points
- **Combo multiplier**: Consecutive safe taps increase your score
- **Survival bonus**: Longer games earn more per tap
- **Special cell bonuses**: Multiplier cells double your score temporarily

## Seed System

Every game has a unique seed number that determines:
- The exact sequence of cell spawns
- When special cells appear
- Boss event timing
- Difficulty progression curve

You can share your seed with friends so they play the exact same game. This enables fair competition — same cells, same timing, same boss events. Only your reactions differ.

## Global Leaderboard

- Scores are submitted to Firebase after each game
- Server-side validation prevents impossible scores
- Rate limiting: max 8 submissions per minute per player
- Player names are sanitized (alphanumeric + underscore, max 8 chars)

## Weekly Challenges

Each week features specific challenges with bonus Dust rewards:
- "Score 200 in Classic mode"
- "Survive 3 boss events in Evolve"
- "Reach 10x combo"
