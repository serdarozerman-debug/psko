#!/usr/bin/env bash
# PreCompact hook: Auto-save current state to tasks.md before context compaction
# Ensures /primer-spec always has accurate resume info, even if agents forgot to update.
# Always exits 0 — state saving should never block compaction.

set -euo pipefail

# Find project root
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
[[ -z "$PROJECT_ROOT" ]] && exit 0

# --- Detect active spec from branch name ---
BRANCH="$(git branch --show-current 2>/dev/null || echo "")"
SLUG=""

# Extract slug from branch: feat/YYYY-MM-DD-slug or feat/slug
if [[ "$BRANCH" =~ ^[^/]+/(.+)$ ]]; then
  SLUG="${BASH_REMATCH[1]}"
fi

[[ -z "$SLUG" ]] && exit 0

# --- Find matching tasks.md ---
TASKS_FILE=""

# Try exact match first
for dir in "$PROJECT_ROOT"/.catalyst/specs/*-"$SLUG"; do
  if [[ -f "$dir/tasks.md" ]]; then
    TASKS_FILE="$dir/tasks.md"
    break
  fi
done

# Try broader match if exact didn't work
if [[ -z "$TASKS_FILE" ]]; then
  for dir in "$PROJECT_ROOT"/.catalyst/specs/*"$SLUG"*; do
    if [[ -f "$dir/tasks.md" ]]; then
      TASKS_FILE="$dir/tasks.md"
      break
    fi
  done
fi

[[ -z "$TASKS_FILE" ]] && exit 0

# --- Build state snapshot ---
TIMESTAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
GIT_STATUS="$(git status --short 2>/dev/null | head -20 || echo "unknown")"
MODIFIED_COUNT="$(git status --short 2>/dev/null | wc -l | tr -d ' ' || echo "0")"

STATE_BLOCK="**Phase:** (check Progress table above)
**Timestamp:** $TIMESTAMP
**Branch:** $BRANCH
**Modified files:** $MODIFIED_COUNT
**Auto-saved:** Yes (PreCompact hook)

\`\`\`
$GIT_STATUS
\`\`\`

> Resume with \`/primer-spec @$SLUG\` in a new conversation."

# --- Update Current Session section ---
# Replace existing Current Session content, or append if missing
if grep -q "^## Current Session" "$TASKS_FILE" 2>/dev/null; then
  # Find the line number of "## Current Session" and the next "##" heading
  SESSION_LINE="$(grep -n "^## Current Session" "$TASKS_FILE" | head -1 | cut -d: -f1)"
  NEXT_HEADING="$(tail -n +"$((SESSION_LINE + 1))" "$TASKS_FILE" | grep -n "^## " | head -1 | cut -d: -f1)"

  if [[ -n "$NEXT_HEADING" ]]; then
    # There's a section after Current Session — replace between them
    END_LINE="$((SESSION_LINE + NEXT_HEADING - 1))"
    {
      head -n "$SESSION_LINE" "$TASKS_FILE"
      echo ""
      echo -e "$STATE_BLOCK"
      echo ""
      tail -n +"$END_LINE" "$TASKS_FILE"
    } > "${TASKS_FILE}.tmp" && mv "${TASKS_FILE}.tmp" "$TASKS_FILE"
  else
    # Current Session is the last section — replace to end
    {
      head -n "$SESSION_LINE" "$TASKS_FILE"
      echo ""
      echo -e "$STATE_BLOCK"
    } > "${TASKS_FILE}.tmp" && mv "${TASKS_FILE}.tmp" "$TASKS_FILE"
  fi
else
  # No Current Session section — append it
  {
    echo ""
    echo "## Current Session"
    echo ""
    echo -e "$STATE_BLOCK"
  } >> "$TASKS_FILE"
fi

exit 0
