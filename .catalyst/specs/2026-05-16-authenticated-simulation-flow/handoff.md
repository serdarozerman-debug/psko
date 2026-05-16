# Handoff: Dual-Role Simulation Flows

> Last updated: 2026-05-16
> Status: Complete

## TL;DR

PSKO now has two learning modes. Students choose their role before every session:

- **Therapist Mode** (🩺) — Student plays the psychologist, PSKO plays the patient. Ends with CTS-R competency scoring. This is the original behaviour, fully preserved.
- **Client Mode** (🎭) — Student plays the patient, PSKO plays a skilled psychologist. Ends with an emotional experience debrief. This is new.

## What Changed

- Added `RoleMode` enum (`THERAPIST` | `CLIENT`) to the Prisma `Session` model with default `THERAPIST` (migration applied to production)
- Added `RoleMode` and `ClientDebrief` types to `src/types/index.ts`
- Created `therapist-prompt.ts` — psychologist system prompt for CLIENT mode
- Created `debrief-prompt.ts` — emotional debrief feedback prompt for CLIENT mode
- Updated `patient-agent.ts` and `supervisor-agent.ts` to branch on `roleMode`
- Updated session API routes (`start`, `end`, `message`) to read and pass `roleMode`
- Added `RoleModeSelector.tsx` — modal that intercepts the persona card click
- Updated `PersonaCard.tsx` to open the selector before creating a session
- Updated `FeedbackReport.tsx` to render either the CTS-R report or the emotional debrief
- Updated `SimulationChat.tsx` — mode badge, adaptive labels, CLIENT mode hides therapist hints panel
- Updated dashboard history to show 🩺/🎭 role badge per session

## Key Decisions

**Why `roleMode` on Session rather than on Message?**
The mode is a session-level property. All messages within a session share one mode. Storing it on `Session` keeps queries simple and avoids repeating it on every message row.

**Why keep `message.role` as `student/patient` in both modes?**
These are structural identifiers (who wrote this message), not character names. The AI's character (psychologist vs patient) is fully determined by `Session.roleMode`. Mixing in a `therapist` role value would have created type inconsistencies across the codebase.

**Why `ClientDebrief.type = 'client-debrief'` discriminant?**
Both feedback shapes are stored as `Json?` in the same column. The `type` field allows callers to narrow the union without checking `roleMode` again.

**Why migrate to `node:test + tsx/cjs` from vitest?**
All vitest versions and jest hang on this machine due to an esbuild IPC pipe deadlock (macOS arm64, Node 20). `node:test` is built-in and tsx transforms TypeScript directly without spawning an esbuild service process.

## How to Test

1. Sign in at `/login`
2. Go to `/dashboard`
3. Click **Start Session** on any persona card
4. The **Choose Your Role** modal appears — select 🩺 Therapist or 🎭 Client
5. Conduct the session (at least 3 exchanges)
6. Click **End Session**
7. Verify the feedback page renders:
   - Therapist mode → "Session Feedback" with CTS-R score bars
   - Client mode → "Session Debrief" with experience summary and reflection prompts
8. Return to `/dashboard` — confirm the session appears in history with the correct role badge

Smoke test checklist for both modes is documented in `research.md`.

## Gotchas

- **ESLint hangs** on this machine (same esbuild deadlock). Use `npx tsc --noEmit` for type checking instead.
- **Dashboard `select` query**: the history query uses an explicit `select` — if new fields are added to `Session`, they won't appear in the dashboard history list until the query is updated.
- **CLIENT mode hides the hints panel** — the guidance sidebar (therapeutic approach hints and suggested questions) is not shown in CLIENT mode because the student is not the therapist. If you want to show an equivalent client-side prompt (e.g. "what might you say next?"), that's a future iteration.
- **Next.js 14 CVEs** — pre-existing HIGH severity vulnerabilities (DoS, cache poisoning). Not introduced by this spec; defer to a maintenance upgrade spec.

## What's Next

- Production smoke test: run both modes end-to-end on the deployed Vercel instance
- Next.js upgrade spec (HIGH CVEs in 14.x)
- Phase 2: additional therapeutic approaches (ACT, DBT, Psychodynamic)
- Future: educator dashboard to track student progress across both modes
- Future: E2E test suite (currently no automated E2E)
