#!/bin/bash
# Claude Code Stop hook — auto-continue with safety circuit breaker.
#
# Behaviour:
#   - On normal end-of-turn: exits 2 (forces Claude to keep generating).
#   - When already in a re-prompt cycle (stop_hook_active=true): exits 0
#     so Claude can halt cleanly, and resets the counter.
#   - After CLAUDE_AUTOCONTINUE_MAX consecutive auto-continues without a
#     clean stop, the circuit breaker trips and exits 0 to force a pause
#     so the user can review.
#
# Tunables:
#   CLAUDE_AUTOCONTINUE_MAX    default 30
#   CLAUDE_AUTOCONTINUE_STATE  default /tmp/claude-autocontinue

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  ACTIVE=$(echo "$INPUT" | jq -r ".stop_hook_active // false")
  SESSION_ID=$(echo "$INPUT" | jq -r ".session_id // \"default\"")
else
  if echo "$INPUT" | grep -q "\"stop_hook_active\"[[:space:]]*:[[:space:]]*true"; then
    ACTIVE="true"
  else
    ACTIVE="false"
  fi
  SESSION_ID="default"
fi

STATE_DIR="${CLAUDE_AUTOCONTINUE_STATE:-/tmp/claude-autocontinue}"
mkdir -p "$STATE_DIR" 2>/dev/null
COUNT_FILE="$STATE_DIR/$SESSION_ID.count"

if [ "$ACTIVE" = "true" ]; then
  rm -f "$COUNT_FILE" 2>/dev/null
  exit 0
fi

MAX_AC="${CLAUDE_AUTOCONTINUE_MAX:-30}"
COUNT=$(cat "$COUNT_FILE" 2>/dev/null || echo 0)
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNT_FILE"

if [ "$COUNT" -gt "$MAX_AC" ]; then
  echo "Circuit breaker tripped: $COUNT consecutive auto-continues. Stopping for user review (reset by sending a new prompt)." >&2
  rm -f "$COUNT_FILE"
  exit 0
fi

echo "Auto-continue ($COUNT/$MAX_AC): devam ediliyor..." >&2
exit 2
