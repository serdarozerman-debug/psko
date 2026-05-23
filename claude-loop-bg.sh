#!/usr/bin/env bash
# claude-loop-bg — run claude-loop.sh in the background under `caffeinate`
# so the work survives terminal close, lid close (on AC), and idle sleep.
#
# Subcommands
# -----------
#   start "prompt"      kick off a fresh session
#   start --continue    resume the most recent session in this directory
#   status              show whether a background loop is running
#   tail                tail -f the log
#   stop                terminate the background loop
#
# Layout
# ------
#   ./claude-loop.sh        the actual loop (must be next to this file)
#   ./claude-loop.log       per-attempt log written by claude-loop.sh
#   ./claude-loop.out       captured stdout/stderr of the detached process
#   ./.claude-loop.pid      PID of the caffeinate wrapper (used by status/stop)
#
# Notes
# -----
#   * `caffeinate -is` keeps the system awake while it runs. The `-s` flag only
#     applies on AC power; on battery, the system can still sleep when the lid
#     closes — keep the lid open or plug in for multi-hour runs.
#   * The PID file tracks the caffeinate wrapper; `stop` kills the whole tree
#     (caffeinate → claude-loop.sh → claude).

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOOP_SCRIPT="$PROJECT_DIR/claude-loop.sh"
PID_FILE="$PROJECT_DIR/.claude-loop.pid"
LOG_FILE="$PROJECT_DIR/claude-loop.log"
OUT_FILE="$PROJECT_DIR/claude-loop.out"

usage() {
  cat >&2 <<EOF
usage: $0 {start|status|tail|stop} [args...]

  $0 start "Phase 1: implement MessageBus publish/subscribe"
  $0 start --continue
  $0 status
  $0 tail
  $0 stop
EOF
  exit 2
}

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid=$(cat "$PID_FILE" 2>/dev/null) || return 1
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

cmd="${1:-}"
[[ -z "$cmd" ]] && usage
shift || true

case "$cmd" in
  start)
    if [[ ! -x "$LOOP_SCRIPT" ]]; then
      echo "error: $LOOP_SCRIPT not found or not executable" >&2
      exit 1
    fi
    if is_running; then
      echo "Already running with PID $(cat "$PID_FILE"). Use 'stop' first."
      exit 1
    fi
    if [[ $# -eq 0 ]]; then
      echo "error: pass a prompt or --continue" >&2
      usage
    fi

    # Launch detached: caffeinate keeps system awake, nohup detaches from terminal,
    # output goes to OUT_FILE, disown removes it from the shell's job table.
    nohup caffeinate -is "$LOOP_SCRIPT" "$@" > "$OUT_FILE" 2>&1 &
    PID=$!
    echo "$PID" > "$PID_FILE"
    disown 2>/dev/null || true

    cat <<EOF
Started.
  PID:    $PID
  cmd:    caffeinate -is ./claude-loop.sh $*
  log:    $LOG_FILE
  out:    $OUT_FILE

Monitor:  $0 tail
Status:   $0 status
Stop:     $0 stop
EOF
    ;;

  status)
    if is_running; then
      PID=$(cat "$PID_FILE")
      echo "Running. PID $PID"
      ps -p "$PID" -o pid,etime,command 2>/dev/null || true
      echo
      echo "Last 5 log lines:"
      [[ -f "$LOG_FILE" ]] && tail -n 5 "$LOG_FILE" || echo "  (no log yet)"
    else
      echo "Not running."
      [[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"
    fi
    ;;

  tail)
    if [[ ! -f "$LOG_FILE" ]]; then
      echo "no log file at $LOG_FILE yet" >&2
      exit 1
    fi
    exec tail -f "$LOG_FILE"
    ;;

  stop)
    if ! is_running; then
      echo "Not running."
      [[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"
      exit 0
    fi
    PID=$(cat "$PID_FILE")
    # Kill children first (claude-loop.sh, claude), then the caffeinate wrapper.
    pkill -P "$PID" 2>/dev/null || true
    kill "$PID" 2>/dev/null || true
    sleep 1
    if kill -0 "$PID" 2>/dev/null; then
      kill -9 "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
    echo "Stopped PID $PID."
    ;;

  *)
    usage
    ;;
esac
