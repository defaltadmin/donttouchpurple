#!/bin/bash
set -e
echo "🚀 Preparing v7.0.0 Release..."

echo "1️⃣ Verifying build health..."
pnpm typecheck || { echo "❌ TypeScript failed"; exit 1; }
pnpm test -- --run || { echo "❌ Tests failed"; exit 1; }
pnpm build || { echo "❌ Build failed"; exit 1; }

echo "2️⃣ Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Uncommitted changes detected. Commit them first:"
  git status --porcelain
  exit 1
fi

echo "3️⃣ Tagging & Pushing..."
git tag -f v7.0.0 -m "Release v7.0.0: Architecture refactor, UX polish, performance hardening, security upgrades"
git push origin main
git push origin --tags --force

echo "✅ v7.0.0 pushed. CI/CD will auto-deploy to GitHub Pages."
echo "🌐 Monitor: https://github.com/$(git config --get remote.origin.url | sed -n 's/.*://p' | sed 's/.git//')/actions"
echo "📦 Release draft will appear at: https://github.com/$(git config --get remote.origin.url | sed -n 's/.*://p' | sed 's/.git//')/releases/tag/v7.0.0"
