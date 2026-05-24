## Catalyst OS

Before any action, read `.claude/skills/using-skills/SKILL.md` and follow it.

---

## Interaction Policy (read first, every session)

**Do not stop mid-task to ask clarifying questions.**

- Make a reasonable assumption, state it in one short line, and proceed.
- If a question is truly unavoidable, **batch ALL of them in the first message** and continue autonomously after they are answered. Never ask one-at-a-time.
- Never re-ask anything that is already answered in this file, in `AGENTS.md`, in `.catalyst/main/*`, or earlier in the session.
- When in doubt between two reasonable options, pick the one that better matches the conventions already in the codebase and move on.

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
