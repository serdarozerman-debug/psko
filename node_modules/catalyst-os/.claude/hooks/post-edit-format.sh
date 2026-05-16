#!/usr/bin/env bash
# PostToolUse hook: Auto-format files after Edit/Write operations
# Runs the project's formatter on changed code files.
# Always exits 0 — formatting is advisory, never blocks.

set -euo pipefail

FILE_PATH="${1:-}"

# Skip if no file path provided or file doesn't exist
[[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]] && exit 0

# Get file extension
EXT="${FILE_PATH##*.}"

# Skip non-code files
case "$EXT" in
  md|txt|yaml|yml|json|lock|log|csv|svg|png|jpg|gif|ico|woff|woff2|ttf|eot)
    exit 0
    ;;
esac

# Find project root (where package.json or .git lives)
PROJECT_ROOT="$(cd "$(dirname "$FILE_PATH")" && git rev-parse --show-toplevel 2>/dev/null || echo "")"
[[ -z "$PROJECT_ROOT" ]] && exit 0

# --- Formatter detection (first match wins) ---

# Biome
if [[ -f "$PROJECT_ROOT/biome.json" || -f "$PROJECT_ROOT/biome.jsonc" ]]; then
  if command -v npx &>/dev/null; then
    npx --yes @biomejs/biome format --write "$FILE_PATH" 2>/dev/null || true
    exit 0
  fi
fi

# Prettier
if [[ -f "$PROJECT_ROOT/.prettierrc" || -f "$PROJECT_ROOT/.prettierrc.json" || -f "$PROJECT_ROOT/.prettierrc.js" || -f "$PROJECT_ROOT/.prettierrc.yaml" || -f "$PROJECT_ROOT/.prettierrc.yml" || -f "$PROJECT_ROOT/prettier.config.js" || -f "$PROJECT_ROOT/prettier.config.mjs" ]]; then
  if command -v npx &>/dev/null; then
    npx --yes prettier --write "$FILE_PATH" 2>/dev/null || true
    exit 0
  fi
fi

# Check package.json for prettier as dependency (common case: no .prettierrc but prettier installed)
if [[ -f "$PROJECT_ROOT/package.json" ]] && grep -q '"prettier"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
  if command -v npx &>/dev/null; then
    npx --yes prettier --write "$FILE_PATH" 2>/dev/null || true
    exit 0
  fi
fi

# --- TypeScript type-check (non-blocking) ---
case "$EXT" in
  ts|tsx)
    if [[ -f "$PROJECT_ROOT/tsconfig.json" ]] && command -v npx &>/dev/null; then
      npx --yes tsc --noEmit 2>/dev/null || true
    fi
    ;;
esac

exit 0
