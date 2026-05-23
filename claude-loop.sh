#!/usr/bin/env bash
# claude-loop — run Claude Code, auto-resume after rate-limit, AND auto-continue
# when Claude pauses at a "ready for next step" checkpoint.
#
# Two automation paths
# --------------------
# 1) Rate-limit / usage-window exhaustion → parse reset time, sleep, then
#    `claude --continue -p "<nudge>"` to pick up the same session.
# 2) Continuation checkpoint detected in successful output (e.g. "ready for
#    next session continuation") → immediately fire `claude --continue -p` to
#    proceed to the next step. Loops until output stops asking for continuation
#    or MAX_ITERATIONS is hit.
#
# Usage
# -----
#   ./claude-loop.sh "implement Phase 1 MessageBus"
#   ./claude-loop.sh --continue                       # resume most recent session
#   ./claude-loop.sh --no-auto-continue "prompt"      # disable checkpoint chaining
#   ./claude-loop.sh --max-iterations 5 "prompt"
#
# Env overrides
# -------------
#   CLAUDE_LOOP_MAX_ITERATIONS         total iterations cap (default 50)
#   CLAUDE_LOOP_MAX_WINDOW             fallback sleep for rate-limit (default 18000s = 5h)
#   CLAUDE_LOOP_CONTINUE_PROMPT        nudge sent on --continue (default: "continue with the next step")
#   CLAUDE_LOOP_CONTINUATION_PATTERNS  regex (egrep) for checkpoint markers — pipe-separated
#   CLAUDE_LOOP_LOG                    log path (default ./claude-loop.log)
#
# Tested on macOS (BSD date). Linux fallback paths included.

set -uo pipefail

MAX_ITERATIONS="${CLAUDE_LOOP_MAX_ITERATIONS:-50}"
MAX_WINDOW_SECONDS="${CLAUDE_LOOP_MAX_WINDOW:-18000}"
CONTINUE_PROMPT="${CLAUDE_LOOP_CONTINUE_PROMPT:-continue with the next step}"
CONTINUATION_PATTERNS="${CLAUDE_LOOP_CONTINUATION_PATTERNS:-ready for next session continuation|ready for the next (step|session)|awaiting next (step|instruction|input)|ready to proceed|continuing in (the )?next session|paused for user input|next session continuation|let me know when you.?re ready|shall i (continue|proceed)}"
LOG_FILE="${CLAUDE_LOOP_LOG:-./claude-loop.log}"

PROMPT=""
CONTINUE_ONLY=0
NO_AUTO_CONTINUE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --continue)
      CONTINUE_ONLY=1
      shift
      ;;
    --no-auto-continue)
      NO_AUTO_CONTINUE=1
      shift
      ;;
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,32p' "$0"
      exit 0
      ;;
    *)
      PROMPT="$1"
      shift
      ;;
  esac
done

if [[ -z "$PROMPT" && $CONTINUE_ONLY -eq 0 ]]; then
  echo "usage: $0 [--no-auto-continue] [--max-iterations N] \"prompt\"   |   $0 --continue" >&2
  exit 2
fi

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}

# Best-effort parse of seconds-to-wait from Claude Code rate-limit output.
parse_wait_seconds() {
  local out="$1"
  local sec iso epoch_reset epoch_now hhmm

  sec=$(printf '%s' "$out" | grep -oEi 'retry[-_ ]?after[: ]+[0-9]+' | grep -oE '[0-9]+' | head -1 || true)
  if [[ -n "${sec:-}" ]]; then echo "$sec"; return; fi

  iso=$(printf '%s' "$out" | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z' | head -1 || true)
  if [[ -n "${iso:-}" ]]; then
    if epoch_reset=$(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$iso" "+%s" 2>/dev/null); then
      :
    else
      epoch_reset=$(date -u -d "$iso" "+%s" 2>/dev/null || echo "")
    fi
    epoch_now=$(date -u "+%s")
    if [[ -n "$epoch_reset" ]]; then
      local diff=$((epoch_reset - epoch_now))
      if (( diff > 0 )); then echo "$diff"; return; fi
    fi
  fi

  hhmm=$(printf '%s' "$out" | grep -oE 'resets? at [0-9]{1,2}:[0-9]{2}' | grep -oE '[0-9]{1,2}:[0-9]{2}' | head -1 || true)
  if [[ -n "${hhmm:-}" ]]; then
    local today_target
    today_target=$(date "+%Y-%m-%d")" $hhmm:00"
    if epoch_reset=$(date -j -f "%Y-%m-%d %H:%M:%S" "$today_target" "+%s" 2>/dev/null); then
      :
    else
      epoch_reset=$(date -d "$today_target" "+%s" 2>/dev/null || echo "")
    fi
    epoch_now=$(date "+%s")
    if [[ -n "$epoch_reset" ]]; then
      local diff=$((epoch_reset - epoch_now))
      if (( diff <= 0 )); then diff=$((diff + 86400)); fi
      echo "$diff"; return
    fi
  fi

  echo "$MAX_WINDOW_SECONDS"
}

human_eta() {
  local secs="$1"
  date -v "+${secs}S" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -d "+${secs} seconds" "+%Y-%m-%d %H:%M:%S"
}

is_rate_limit() {
  printf '%s' "$1" | grep -qiE 'rate.?limit|usage limit|too many requests|HTTP 429|status 429'
}

is_continuation_checkpoint() {
  printf '%s' "$1" | grep -qiE "$CONTINUATION_PATTERNS"
}

iteration=0
while (( iteration < MAX_ITERATIONS )); do
  iteration=$((iteration+1))

  if (( iteration == 1 && CONTINUE_ONLY == 0 )); then
    log "Iteration $iteration — claude -p (initial prompt)"
    OUTPUT=$(claude -p "$PROMPT" 2>&1)
    RC=$?
  else
    log "Iteration $iteration — claude --continue -p \"$CONTINUE_PROMPT\""
    OUTPUT=$(claude --continue -p "$CONTINUE_PROMPT" 2>&1)
    RC=$?
  fi

  printf '%s\n' "$OUTPUT"

  # Path 1: rate-limited → sleep and retry
  if is_rate_limit "$OUTPUT"; then
    WAIT=$(parse_wait_seconds "$OUTPUT")
    if (( WAIT > MAX_WINDOW_SECONDS )); then WAIT=$MAX_WINDOW_SECONDS; fi
    if (( WAIT < 30 )); then WAIT=30; fi
    log "Rate limit detected. Sleeping ${WAIT}s — resume at $(human_eta "$WAIT")."
    sleep "$WAIT"
    continue
  fi

  # Path 2: non-rate-limit failure → bail out
  if (( RC != 0 )); then
    log "Non-rate-limit failure (exit=$RC). Stopping."
    exit "$RC"
  fi

  # Path 3: success — check if Claude is paused at a continuation checkpoint
  if (( NO_AUTO_CONTINUE == 0 )) && is_continuation_checkpoint "$OUTPUT"; then
    log "Checkpoint detected — auto-continuing to next step."
    continue
  fi

  log "Done — completed on iteration $iteration with no pending continuation."
  exit 0
done

log "Exceeded max iterations ($MAX_ITERATIONS). Stopping for safety; resume with --continue."
exit 1
