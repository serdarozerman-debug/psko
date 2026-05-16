#!/bin/bash
# Rename session to spec slug when /forge-spec or /forge-spec-worktree is invoked.
# Triggered by UserPromptSubmit hook.

PROMPT="$USER_PROMPT"

# Match /forge-spec or /forge-spec-worktree followed by a spec argument
if echo "$PROMPT" | grep -qE '^/forge-spec(-worktree)?\s+'; then
  SLUG=$(echo "$PROMPT" | sed -E 's|^/forge-spec(-worktree)?\s+||' | sed 's/^@//' | xargs)

  if [ -n "$SLUG" ]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "sessionTitle": "$SLUG"
  }
}
EOF
  fi
fi
