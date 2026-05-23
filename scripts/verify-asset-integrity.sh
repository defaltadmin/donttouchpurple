#!/bin/bash
# Supply-chain verification for DTP project assets
# Inspired by autoskills SHA-256 hash verification pattern
# Usage: bash scripts/verify-asset-integrity.sh [--update]
#
# Verifies integrity of critical project assets using SHA-256 checksums.
# Run with --update to regenerate the checksum file after intentional changes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECKSUM_FILE="$PROJECT_ROOT/.asset-checksums.sha256"
ASSETS_DIR="$PROJECT_ROOT/public/assets"

# Files to verify
VERIFY_PATHS=(
  "public/assets/lottie/trophy.json"
  "public/assets/lottie/star.json"
  "public/assets/lottie/fire.json"
  "public/assets/lottie/loading-ambient.json"
  "public/assets/lottie/boss-storm.json"
  "public/assets/lottie/boss-inversion.json"
  "public/assets/lottie/boss-blackout.json"
  "firebase.json"
  ".github/workflows/ci.yml"
)

update_checksums() {
  echo "Generating checksums..."
  > "$CHECKSUM_FILE"
  for path in "${VERIFY_PATHS[@]}"; do
    full_path="$PROJECT_ROOT/$path"
    if [ -f "$full_path" ]; then
      hash=$(sha256sum "$full_path" | cut -d' ' -f1)
      echo "$hash  $path" >> "$CHECKSUM_FILE"
    else
      echo "WARN: $path not found, skipping"
    fi
  done
  echo "Checksums written to $CHECKSUM_FILE"
}

verify_checksums() {
  if [ ! -f "$CHECKSUM_FILE" ]; then
    echo "No checksum file found. Run with --update first."
    exit 1
  fi

  local failures=0
  local checked=0

  while IFS='  ' read -r expected_hash file_path; do
    [ -z "$file_path" ] && continue
    full_path="$PROJECT_ROOT/$file_path"
    if [ ! -f "$full_path" ]; then
      echo "MISSING: $file_path"
      ((failures++))
      continue
    fi
    actual_hash=$(sha256sum "$full_path" | cut -d' ' -f1)
    if [ "$actual_hash" != "$expected_hash" ]; then
      echo "CHANGED: $file_path"
      echo "  Expected: $expected_hash"
      echo "  Actual:   $actual_hash"
      ((failures++))
    else
      echo "OK: $file_path"
    fi
    ((checked++))
  done < "$CHECKSUM_FILE"

  echo ""
  echo "Checked: $checked, Failed: $failures"
  if [ "$failures" -gt 0 ]; then
    echo "INTEGRITY CHECK FAILED"
    echo "Run with --update if changes were intentional."
    exit 1
  else
    echo "ALL ASSETS VERIFIED"
  fi
}

case "${1:-verify}" in
  --update)
    update_checksums
    ;;
  *)
    verify_checksums
    ;;
esac
