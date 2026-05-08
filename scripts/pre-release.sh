#!/bin/bash
set -e
echo "🚀 Pre-Release Validation..."
npm run build > /dev/null 2>&1
SIZE=$(du -sh dist/ | cut -f1)
echo "✅ Build size: $SIZE"
LOGS=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "logger\." | grep -v "__tests__" | wc -l || true)
if [ "$LOGS" -gt "0" ]; then echo "⚠️ Found $LOGS stray console.* calls (use logger instead)"; else echo "✅ No stray console calls"; fi
HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo "📦 Version: v${VERSION}+${HASH}"
echo "🔍 Open dist/index.html in browser to verify before push"
