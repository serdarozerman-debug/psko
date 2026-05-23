## Catalyst OS

Before any action, read `.claude/skills/using-skills/SKILL.md` and follow it.

---

## Interaction Policy (read first, every session)

**Do not stop mid-task to ask clarifying questions.**

- Make a reasonable assumption, state it in one short line, and proceed.
- If a question is truly unavoidable, **batch ALL of them in the first message** and continue autonomously after they are answered. Never ask one-at-a-time.
- Never re-ask anything that is already answered in this file, in `AGENTS.md`, in `.catalyst/main/*`, or earlier in the session.
- When in doubt between two reasonable options, pick the one that better matches the conventions already in the codebase and move on.

## Stop Hook — End-of-Turn Contract

A Stop hook (`.claude/hooks/stop-auto-continue.sh`) auto-continues every turn. Because of this:

- **When the work is actually finished, just say it's done in one short line and STOP.** Do not invent new tasks, do not propose follow-ups, do not start a new feature unprompted.
- Saying "done" is enough — the user will provide the next instruction. The auto-continue exists to avoid manual nudges *within* a task, not to perpetually generate new work.
- If you genuinely have a useful next step in the same task (e.g. running tests after implementing), do it. If the task is complete, stop generating.

## Standing Decisions (do not re-ask)

These are already decided. Do not ask the user to re-confirm them.

- **Framework / language:** Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS — no other CSS frameworks
- **LLM:** Claude API (Anthropic SDK) — do not swap providers
- **Database / ORM:** Supabase (Postgres) accessed via Prisma
- **Auth:** Supabase Auth
- **Hosting:** Vercel
- **Lint / format:** ESLint + Prettier; run before commit
- **Tests:** colocated under `__tests__/` or `*.test.ts(x)`; write tests for new logic
- **Git workflow:** `feat/*` branches off `main`/`development`; squash merge; conventional commits (`feat:`, `fix:`, `chore:` …).
- **Specs:** features go through `/catalyze-spec` → `/seal-spec` → `/forge-spec` → `/audit-spec`.
- **Secrets:** never commit; use `.env.local` (gitignored) and Vercel env vars.
- **PII / clinical data:** treat all user-entered clinical content as sensitive — no logging of message bodies, no third-party analytics on conversation content.

If a task seems to contradict one of these, follow the standing decision and flag the conflict at the end of the work — do not pause to ask.

## Long-running Work — auto-resume on rate-limit

For multi-hour features, start Claude Code via the wrapper so that if the 5-hour usage window is hit, the work resumes automatically once the window resets:

```bash
./claude-loop.sh "Implement the simulation transcript export endpoint"
# or, to resume the most recent session manually:
./claude-loop.sh --continue
```

The wrapper has two automation paths:

1. **Rate-limit / usage-window** — detects the limit error, parses the reset time
   (or falls back to 5h), sleeps, then calls `claude --continue -p` to pick up
   the same session.
2. **Auto-continue on checkpoint** — if Claude's successful output contains a
   pause-state marker (e.g. "ready for next session continuation",
   "ready for the next step", "awaiting next instruction", "shall I proceed"),
   the wrapper immediately fires `claude --continue -p "continue with the next step"`
   to advance — no manual nudge needed. Capped at `CLAUDE_LOOP_MAX_ITERATIONS=50`
   for safety.

Disable auto-continue with `--no-auto-continue`. Override patterns/nudge prompt
via `CLAUDE_LOOP_CONTINUATION_PATTERNS` and `CLAUDE_LOOP_CONTINUE_PROMPT`. Logs
go to `./claude-loop.log`.

### Detached background mode (survives terminal close and idle sleep)

For overnight or multi-hour runs, use the background launcher — it wraps the loop
in `caffeinate -is` (prevents idle/system sleep) and `nohup` (survives terminal close):

```bash
./claude-loop-bg.sh start "Implement the simulation transcript export endpoint"
./claude-loop-bg.sh start --continue          # resume the most recent session
./claude-loop-bg.sh status                    # is it running? show last log lines
./claude-loop-bg.sh tail                      # tail -f the log
./claude-loop-bg.sh stop                      # kill the whole tree
```

Note: lid-close sleep is only fully prevented when on AC power. On battery, keep
the lid open for multi-hour runs.

---

## PSKO — Project Context

AI-powered clinical psychology simulation trainer for psychology students.

**Stack:** Next.js 14 · TypeScript · Tailwind · Claude API · Supabase · Prisma · Vercel

**Key docs:**
- Mission: `.catalyst/main/mission.md`
- Architecture: `.catalyst/main/architecture.md`
- Tech Stack: `.catalyst/main/tech-stack.md`
- Roadmap: `.catalyst/main/roadmap.md`
- Conventions: `.catalyst/main/conventions.md`
- Concerns: `.catalyst/main/concerns.md`
