#!/bin/bash
set -e
echo "Release Prep..."
echo "1. Running type check..."
npx tsc --noEmit || { echo "TS errors found"; exit 1; }
echo "2. Running tests & coverage..."
npm run test:coverage || { echo "Tests failed"; read -p "Continue anyway? (y/n) " -n 1 -r; [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1; }
echo "3. Building production..."
npm run build
SIZE=$(du -sh dist/ | cut -f1)
echo "Production bundle size: $SIZE"
echo "4. Checking for stray console.* calls..."
LOGS=$(grep -rn "console\.\(log\|info\|debug\)" src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v "logger\." | wc -l)
[ "$LOGS" -gt "0" ] && echo "Found $LOGS unguarded console calls. Consider using logger.*"
echo "5. Validating manifest & SW..."
[ -f "public/manifest.json" ] && echo "Manifest present"
grep -q "navigator.serviceWorker" App.tsx && echo "SW registration present"
echo "Ready! To release:"
echo "   git tag v$(node -p "require('./package.json').version") -m 'Release v$(node -p "require('./package.json').version')'"
echo "   git push origin --tags"
echo "   CI will auto-build, generate changelog, and deploy to GitHub Pages."
