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
- **Do not edit this section, the Hang & Workaround Discipline section below, or the Stop hook script** unless the user explicitly asks. These are safety contracts.

## Hang & Workaround Discipline (read with Stop Hook section)

The Stop hook + bypass-permissions combo is aggressive. Without discipline it will keep spawning workarounds when something is actually broken. Follow these rules strictly:

- **Background shell timeout: 5 minutes.** If a long-running command (`tsc`, `jest`, `vitest`, `npm run build`, `docker build`, migrations, anything in the background queue) has been running >5 min without progress output, STOP it. Do NOT spawn another shell that "waits for it" or "re-runs it with different flags". Kill the hung process, read its last output, investigate the root cause.
- **No parallel workarounds.** Maximum 2 concurrent background shells targeting the same task. If `tsc` is already running, do not start `tsc with cd`, `tsc noEmit`, `Wait for tsc to complete` alongside it. Pick one strategy, wait for it, then iterate.
- **Hang ≠ flaky.** When a tool hangs (no output, no progress), the answer is almost never "try again with different flags". The cause is usually config: `tsconfig.json` `include` too broad, `--watch` accidentally on, no incremental cache, infinite type recursion in new code, missing env var, locked DB. Investigate first.
- **Budget circuit breaker.** If you've spent >30 min or >100k tokens on a single sub-task without forward progress (no new commit, no test RED→GREEN transition, no file actually written), STOP. Write a one-line `STUCK: <reason>` summary and let the user decide.
- **Escalation override.** The Stop hook re-prompts you once, but on the second pass `stop_hook_active=true` and you can halt. Use this deliberately when truly stuck — do not pretend progress is happening to keep the loop going.

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
