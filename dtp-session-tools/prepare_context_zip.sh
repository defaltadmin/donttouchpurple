#!/bin/bash
# ============================================================
# DTP — Prepare Context Zip for Next Claude Session
# Run from project root: bash prepare_context_zip.sh
# ============================================================

set -e

DATE=$(date +%Y%m%d)
OUTFILE="dtp-context-${DATE}.zip"

echo "🔨 Building project first to ensure clean state..."
./node_modules/.bin/vite build 2>&1 | tail -3

echo ""
echo "📦 Creating context zip: $OUTFILE"

# Remove old zip if exists
rm -f "$OUTFILE"

# Core files Claude needs to read
zip -r "$OUTFILE" \
  App.tsx \
  engine/GameEngine.ts \
  engine/DifficultyScaler.ts \
  engine/types.ts \
  hooks/useGameEngine.ts \
  hooks/useInputHandler.ts \
  services/firebase.ts \
  config/game.ts \
  config/dailyObjective.ts \
  config/powerupWeights.ts \
  components/Screens/GameOver.tsx \
  components/Screens/RewardsHub.tsx \
  components/Screens/StartScreen.tsx \
  components/Screens/DailyChallengesPopup.tsx \
  components/Screens/EvolveTutorial.tsx \
  components/HUD/EnergyBar.tsx \
  components/HUD/PlayerPanel.tsx \
  components/HUD/Hearts.tsx \
  components/HUD/ScoreDisplay.tsx \
  components/Shop/ShopPanel.tsx \
  components/Leaderboard/LeaderboardPanel.tsx \
  components/Backgrounds/PurpleRain.tsx \
  styles/game.css \
  styles/enhancements.css \
  package.json \
  vite.config.ts \
  CHANGELOG.md \
  DTP_SESSION_CONTEXT.md \
  2>/dev/null || true

# Add gameanalytics if it exists
[ -f services/gameanalytics.ts ] && zip "$OUTFILE" services/gameanalytics.ts

echo ""
echo "✅ Context zip ready: $OUTFILE"
echo ""
echo "📋 First message for Claude:"
echo "---"
echo "Here is the full source zip for \"Don't Touch the Purple\" (React/TypeScript/Vite)."
echo "Read every file before doing anything. The DTP_SESSION_CONTEXT.md has the full game state."
echo "Start by confirming what you see in the code, then we'll proceed."
echo "---"
echo ""
echo "📊 File count in zip:"
unzip -l "$OUTFILE" | tail -1
