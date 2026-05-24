# Handoff: Educator Features (2026-05-23)

## What Was Built

Full educator role system for PSKO: cohort management, assignment workflow, assessment reporting, and a custom persona wizard. Acceptance criteria AC-1..AC-10 are live in production at psko-app.vercel.app. AC-11..AC-14 (LTI 1.3) are deferred pending a Canvas/Moodle test instance.

## Key Decisions

| Decision | Reasoning |
|----------|-----------|
| FK columns use `TEXT` not `@db.Uuid` | Matches existing PK type across the schema; avoids a migration on live data |
| Join codes use 32-char alphabet (no 0/O/1/I/l) | Avoids visual ambiguity when codes are hand-typed |
| `requireEducator` throws; routes catch + map | Keeps auth logic centralized; routes stay thin |
| `access_token_hook.sql` not auto-applied | Supabase DB hooks must be enabled in dashboard; documented in `supabase/README-auth-hook.md` |
| `PersonaDataSchema` does not include `visibility` | Schema validates persona content; visibility is routing-level metadata. Extracted from raw body separately. |
| LTI 1.3 deferred | No test LMS instance available; stubs would give false confidence. Spec AC-11..14 marked `deferred`. |

## Files Modified / Created

### Database
- `prisma/schema.prisma` — enums, user/persona/session extensions, cohorts, cohort_memberships, assignments, session_feedback_scores
- `prisma/migrations/` — migration SQL for all schema changes
- `prisma/seed.ts` — educator@demo.psko.app + Demo Cohort DEMO01
- `prisma/sql/access_token_hook.sql` — Supabase custom JWT hook

### Auth
- `src/lib/auth/index.ts` — `getRoleFromJwt`, `requireEducator`, `requireUser`
- `src/middleware.ts` — `/educator/*` route gating

### API Routes
- `src/app/api/educator/cohorts/route.ts` — GET/POST cohorts
- `src/app/api/educator/cohorts/[id]/route.ts` — GET/PATCH cohort
- `src/app/api/educator/cohorts/[id]/regenerate-code/route.ts` — POST
- `src/app/api/educator/cohorts/[id]/members/[studentId]/route.ts` — DELETE
- `src/app/api/educator/cohorts/[id]/export/route.ts` — CSV export
- `src/app/api/educator/cohorts/[id]/report/route.ts` — cohort report
- `src/app/api/educator/assignments/route.ts` — GET/POST assignments
- `src/app/api/educator/assignments/[id]/progress/route.ts` — student progress
- `src/app/api/educator/students/[studentId]/report/route.ts` — individual report
- `src/app/api/educator/personas/route.ts` — GET/POST (with visibility fix)
- `src/app/api/educator/personas/[id]/route.ts` — GET/PATCH/DELETE
- `src/app/api/join/[code]/route.ts` — student join endpoint
- `src/app/api/session/start/route.ts` — updated to accept assignmentId
- `src/app/api/session/end/route.ts` — writes SessionFeedbackScore (with JSON guard fix)
- `src/app/api/personas/route.ts` — merged educator + student persona listing

### Libraries
- `src/lib/cohorts/joinCode.ts` — `generateJoinCode()`
- `src/lib/cohorts/queries.ts` — cohort DB helpers
- `src/lib/reports/normalizeScores.ts` — competency score normalization
- `src/lib/deeplink/index.ts` — JWT mint/verify for assignment deep-links (hardcoded secret removed)

### UI
- `src/app/educator/` — full educator dashboard (cohorts, assignments, reports, personas)
- `src/components/educator/persona-wizard/` — 4-step custom persona wizard
- `src/components/educator/reports/` — Recharts-based competency radar + score tables

## How to Test

1. Log in as `educator@demo.psko.app` (password in `.env.local`)
2. Create a cohort → copy join code → log in as student → POST `/api/join/[code]`
3. Create an assignment → start a session as student with `assignmentId` → end session → check feedback scores
4. Open educator dashboard → view cohort report → export CSV
5. Custom persona wizard: Educator → Personas → Create → complete 4 steps → verify visibility toggle persists

## Edge Cases & Gotchas

- **Auth hook not auto-applied**: If JWT role claims are missing, `requireEducator` will always throw 403. Enable hook in Supabase dashboard → Database → Functions → `custom_access_token_hook`.
- **Join code case-sensitivity**: Codes are stored uppercase. The `/api/join/[code]` route does `toUpperCase()` before lookup — frontend should too.
- **Assignment-session link**: `session.assignmentId` is nullable. The `session/end` route skips feedback-score writes if `assignment` is null (student self-practice).
- **LTI deferred stub**: `smith-7` routes return 501 Not Implemented. Do not advertise LTI to users until AC-11..14 are built.
- **CSV export formula injection**: Values starting with `=`, `+`, `-`, `@` are not sanitized. Avoid using exported CSVs in security-sensitive contexts until this is patched.

## Follow-up Items

| Item | Priority | Notes |
|------|----------|-------|
| Extract `mapAuthError` to `src/lib/auth/mapAuthError.ts` | High | Duplicated in 13 route files |
| CSV formula injection fix | Medium | `csvEscape()` in export route |
| Next.js 15.x upgrade | Medium | Resolves known CVEs |
| LTI 1.3 (AC-11..14) | High | Blocked on test LMS instance |
| E2E test infrastructure | Medium | Needs seeded Supabase env for CI |
