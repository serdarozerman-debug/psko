# Tasks: Educator Features & Scale

> Spec: `2026-05-23-educator-features`
> Status: In progress
> Branch: `feat/2026-05-23-educator-features`

## Build DAG

### Phase 1: Foundation (Sequential)
| ID | Agent | Scope | Blocks | Est |
|----|-------|-------|--------|-----|
| alchemist-1 | alchemist | psko-app/prisma/** | all | 1.5h |

### Phase 2: Contracts + Role System (Sequential)
| ID | Agent | Scope | Depends On | Blocks | Est |
|----|-------|-------|------------|--------|-----|
| enforcer-1 | enforcer | psko-app/src/lib/auth/__tests__/**, psko-app/src/middleware.test.ts | alchemist-1 | smith-1 | 45m |
| smith-1 | smith | psko-app/src/types/index.ts, psko-app/src/middleware.ts, psko-app/src/lib/auth/** | enforcer-1 | smith-2..6, shaper-* | 1.5h |

### Phase 3: Backend (parallel-capable per domain)
| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| enforcer-2 | enforcer | psko-app/src/app/api/educator/cohorts/**/__tests__/**, psko-app/src/app/api/join/**/__tests__/** | types, schema | smith-1 | 1h |
| alchemist-2 | alchemist | psko-app/prisma/seed.ts, psko-app/prisma/sql/** | schema | alchemist-1 | 45m |
| smith-2 | smith | psko-app/src/app/api/educator/cohorts/**, psko-app/src/app/api/join/**, psko-app/src/lib/cohorts/** | auth, types | enforcer-2, smith-1 | 2h |
| enforcer-3 | enforcer | psko-app/src/app/api/educator/assignments/**/__tests__/** | types | smith-1 | 45m |
| smith-3 | smith | psko-app/src/app/api/educator/assignments/**, psko-app/src/app/api/session/start/route.ts, psko-app/src/lib/personas/** | auth, cohorts | enforcer-3, smith-2 | 2h |
| enforcer-4 | enforcer | psko-app/src/app/api/educator/students/**/__tests__/**, psko-app/src/app/api/session/end/**/__tests__/** | types | smith-1 | 1h |
| smith-4 | smith | psko-app/src/app/api/session/end/route.ts, psko-app/src/app/api/educator/students/**, psko-app/src/app/api/educator/cohorts/[id]/report/**, psko-app/src/lib/reports/** | feedback, scores | enforcer-4, smith-2 | 2h |
| enforcer-5 | enforcer | psko-app/src/app/api/educator/personas/**/__tests__/** | persona schema | smith-1 | 45m |
| smith-5 | smith | psko-app/src/app/api/educator/personas/**, psko-app/src/app/api/personas/route.ts, psko-app/src/lib/personas/loader.ts | persona schema | enforcer-5, smith-3 | 2h |
| smith-6 | smith | psko-app/src/app/api/educator/cohorts/[id]/export/**, psko-app/src/app/api/educator/assignments/[id]/deep-link/**, psko-app/src/app/api/session/join/**, psko-app/src/lib/deeplink/** | auth, assignments | smith-3, smith-4 | 1.5h |

### Phase 4: UI (parallel — shaper × 4)
| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| shaper-1 | shaper-1 | psko-app/src/app/educator/**, psko-app/src/components/educator/cohorts/** | api routes | smith-2 | 2h |
| shaper-2 | shaper-2 | psko-app/src/components/educator/reports/**, psko-app/src/app/educator/students/**, psko-app/src/app/dashboard/report/** | reports api | smith-4 | 2h |
| shaper-3 | shaper-3 | psko-app/src/app/educator/personas/**, psko-app/src/components/educator/persona-wizard/** | persona api | smith-5 | 2h |
| shaper-4 | shaper-4 | psko-app/src/app/dashboard/page.tsx, psko-app/src/components/dashboard/AssignedPersonas.tsx | assignments api | smith-3 | 1h |

### Phase 5: LTI Service (Sequential after main backend)
| ID | Agent | Scope | Depends On | Est |
|----|-------|-------|------------|-----|
| smith-7 | smith | lti-service/**, psko-app/src/app/lti/callback/**, psko-app/src/app/api/internal/lti/** | smith-4, smith-6 | 4h |

---

## Progress

| Task | Agent | Status | Description |
|------|-------|--------|-------------|
| alchemist-1 | Alchemist | ✓ Done | Prisma schema: enums (UserRole, PersonaVisibility, MembershipStatus, RoleMode, ScoreAssessor), extend users/personas/sessions, add cohorts/cohort_memberships/assignments/session_feedback_scores; lti columns on sessions — schema valid, migration SQL at `20260523000001_educator_features`. NOTE: FK columns use TEXT (not @db.Uuid) to match existing PK type. |
| enforcer-1 | Enforcer | ✓ Done | RED tests: getRoleFromJwt (5 cases), requireEducator (4 cases), requireUser (2 cases) — all FAIL MODULE_NOT_FOUND. Commit c584c7b. |
| smith-1 | Smith | ⏳ pending | Role system: UserRole enum in types, middleware /educator/* gating, server-component role helpers, Supabase custom access token hook SQL |
| enforcer-2 | Enforcer | ⏳ pending | RED tests: cohort CRUD, join code regen, /api/join validation, ownership checks |
| alchemist-2 | Alchemist | ✓ Done | Seed already had educator demo account + Demo Cohort (DEMO01); added `prisma/sql/access_token_hook.sql` (SECURITY DEFINER, writes `app_metadata.role`, defaults STUDENT) + `supabase/README-auth-hook.md` covering registration and `db reset` re-apply. Commit 6d4be20. |
| smith-2 | Smith | ⏳ pending | Cohort + membership API routes; join-code generator (32-char alphabet, exclude 0/O/1/I/l) |
| enforcer-3 | Enforcer | ⏳ pending | RED tests: assignment create, progress query, async getPersonaById regression, session start with assignmentId |
| smith-3 | Smith | ⏳ pending | Assignments API + session start (async persona) + student dashboard data fetcher |
| enforcer-4 | Enforcer | ⏳ pending | RED tests: session end writes SessionFeedbackScore rows, student/cohort report shape, instructor annotation |
| smith-4 | Smith | ⏳ pending | Session end normalization → SessionFeedbackScore; student + cohort report endpoints; instructor annotation |
| enforcer-5 | Enforcer | ⏳ pending | RED tests: custom persona create wizard validation against Zod schema, visibility scoping, merged /api/personas |
| smith-5 | Smith | ⏳ pending | Custom persona builder API + persona loader async refactor + merged GET /api/personas |
| smith-6 | Smith | ⏳ pending | CSV export (Canvas format, UTF-8 BOM); deep-link JWT mint/verify; /api/session/join/[token] route |
| shaper-1 | Shaper | ⏳ pending | Educator dashboard shell (/educator), cohort sidebar, roster table, join-code chip, member status toggle |
| shaper-2 | Shaper | ⏳ pending | Recharts reports: LineChart (trends), RadarChart (profile vs cohort), BarChart (cohort compare); per-student + per-cohort views; student self-report |
| shaper-3 | Shaper | ⏳ pending | 4-step custom persona wizard (Identity, Clinical, Cognitive, SCID-5 optional) with live PersonaCard preview |
| shaper-4 | Shaper | ⏳ pending | Student dashboard "Assigned to you" section, status badges, due-date flag, debrief reminder hook |
| smith-7 | Smith | ⏳ pending | LTI 1.3 Express service (`lti-service/`) using ltijs + ltijs-postgresql: OIDC, launch, deep-link, AGS, cookieless, handoff token exchange in Next.js |

---

## Task Details

### alchemist-1 — Prisma Schema Migration
**Depends on:** nothing
**Agent:** alchemist
**Files to create/modify:**
- `psko-app/prisma/schema.prisma`
- `psko-app/prisma/migrations/20260523xxxxxx_educator_features/migration.sql`

**Enums to add:**
- `enum UserRole { STUDENT EDUCATOR }`
- `enum PersonaVisibility { private institution }`
- `enum MembershipStatus { ACTIVE INACTIVE }`
- `enum RoleMode { THERAPIST CLIENT }`
- `enum ScoreAssessor { ai instructor }`

**Modify `users`:**
- `role UserRole @default(STUDENT)`
- `institutionId String? @db.Uuid`

**Modify `personas`:**
- `createdBy String? @db.Uuid` (FK → users.id, onDelete SetNull)
- `isCustom Boolean @default(false)`
- `visibility PersonaVisibility @default(private)`

**Modify `sessions`:**
- `assignmentId String? @db.Uuid` (FK → assignments.id, onDelete SetNull)
- `ltiLineItemUrl String? @db.VarChar(500)`
- `ltiUserId String? @db.VarChar(255)`
- `instructorAnnotation String?` (for FR-4.7; nullable text)

**New tables:**
- `cohorts` (id, name, instructorId FK users.id, joinCode UNIQUE varchar(6), joinCodeEnabled Boolean default true, createdAt, updatedAt)
- `cohort_memberships` (id, cohortId FK cohorts.id, studentId FK users.id, joinedAt, status MembershipStatus default ACTIVE; UNIQUE(cohortId, studentId))
- `assignments` (id, cohortId, personaId FK personas.id, approachId String?, roleMode RoleMode default THERAPIST, dueAt DateTime?, createdBy FK users.id, createdAt, updatedAt)
- `session_feedback_scores` (id, sessionId FK sessions.id, domain varchar(100), score Int, assessor ScoreAssessor default ai, createdAt; @@index([sessionId, domain]))

**Acceptance:**
- `pnpm prisma migrate dev` runs cleanly
- `pnpm prisma generate` succeeds
- Existing rows backfilled (users.role default STUDENT)

**AC covered:** Data model foundation for all subsequent ACs (AC-1..14).

---

### enforcer-1 — RED Tests: Role System
**Depends on:** alchemist-1
**Agent:** enforcer
**Files to create:**
- `psko-app/src/lib/auth/__tests__/requireEducator.test.ts` (node:test)
- `psko-app/src/lib/auth/__tests__/getRoleFromJwt.test.ts` (node:test)
- `psko-app/src/middleware.test.ts` (node:test — mocked Supabase server client)

**Tests:**
- `getRoleFromJwt` extracts `app_metadata.role`; ignores `user_metadata.role`
- `requireEducator(supabase)` returns user when role=EDUCATOR; throws/redirects when STUDENT
- Middleware: STUDENT on `/educator/dashboard` redirects to `/dashboard`; EDUCATOR passes through
- Middleware: unauthenticated on `/educator/*` redirects to `/login?redirect=`

**Acceptance:** all tests written, all FAIL (RED).
**AC covered:** AC-3 prep.

---

### smith-1 — Role System Implementation
**Depends on:** enforcer-1, alchemist-1
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/types/index.ts` — re-export `UserRole`, `PersonaVisibility`, `MembershipStatus`, `RoleMode`, `ScoreAssessor` from `@prisma/client`; add `AppMetadata`, `Cohort`, `CohortMembership`, `Assignment`, `SessionFeedbackScore`, `AssignmentProgress`, `StudentReport`, `CohortReport` interfaces
- `psko-app/src/lib/auth/getRoleFromJwt.ts` — pure JWT parser
- `psko-app/src/lib/auth/requireEducator.ts` — server-component guard (uses `supabase.auth.getUser()` + DB query — FR-1.4)
- `psko-app/src/lib/auth/requireUser.ts` — student/any-auth guard
- `psko-app/src/middleware.ts` — extend matcher to `/educator/:path*`; read `app_metadata.role`; redirect STUDENT to `/dashboard`
- `psko-app/supabase/migrations/20260523xxxxxx_access_token_hook.sql` — Custom Access Token Hook function injecting `role` into `app_metadata` from users table

**Implementation notes:**
- Middleware MUST NOT query DB (FR-1.3) — JWT only
- Server Components MUST re-verify via `supabase.auth.getUser()` + `prisma.user.findUnique({ where: { id }, select: { role: true } })` (FR-1.4)
- Never read `user_metadata` for authz (FR-1.5)

**Acceptance:** enforcer-1 tests GREEN.
**AC covered:** AC-3.

---

### enforcer-2 — RED Tests: Cohort & Join API
**Depends on:** smith-1
**Agent:** enforcer
**Files to create:**
- `psko-app/src/app/api/educator/cohorts/__tests__/route.route.test.ts` (Jest)
- `psko-app/src/app/api/educator/cohorts/[id]/__tests__/route.route.test.ts`
- `psko-app/src/app/api/educator/cohorts/[id]/regenerate-code/__tests__/route.route.test.ts`
- `psko-app/src/app/api/educator/cohorts/[id]/members/[studentId]/__tests__/route.route.test.ts`
- `psko-app/src/app/api/join/[code]/__tests__/route.route.test.ts`
- `psko-app/src/lib/cohorts/__tests__/joinCode.test.ts` (node:test)

**Tests cover:**
- 403 when STUDENT calls educator endpoints
- POST cohort creates with unique 6-char join code from 32-char alphabet (no 0/O/1/I/l)
- GET cohorts returns only cohorts owned by caller
- GET cohort/[id] returns roster + per-student aggregate scores
- PATCH toggles joinCodeEnabled
- POST regenerate-code mints new code AND invalidates old (AC-10)
- DELETE member sets status=INACTIVE, does not delete sessions
- POST /api/join/[code] with valid code creates ACTIVE membership; invalid/disabled returns 4xx (FR-2.4, FR-2.5)
- Duplicate join is idempotent or rejected with clear error

**Acceptance:** all RED.
**AC covered:** AC-1, AC-10.

---

### alchemist-2 — Seeds & SQL Function
**Depends on:** alchemist-1
**Agent:** alchemist
**Files to create/modify:**
- `psko-app/prisma/seed.ts` — add educator demo user (role=EDUCATOR), sample cohort, one assignment
- `psko-app/prisma/sql/access_token_hook.sql` — function body Supabase Hook calls

**Acceptance:** `pnpm prisma db seed` runs; educator account `educator@demo.psko.app` exists.

---

### smith-2 — Cohort Management API
**Depends on:** enforcer-2, alchemist-2, smith-1
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/lib/cohorts/joinCode.ts` — `generateJoinCode()` using crypto.randomInt over 32-char alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- `psko-app/src/lib/cohorts/queries.ts` — `getCohortsForEducator`, `getCohortRoster`, `setMembershipStatus`
- `psko-app/src/app/api/educator/cohorts/route.ts` — GET/POST
- `psko-app/src/app/api/educator/cohorts/[id]/route.ts` — GET/PATCH
- `psko-app/src/app/api/educator/cohorts/[id]/regenerate-code/route.ts` — POST
- `psko-app/src/app/api/educator/cohorts/[id]/members/[studentId]/route.ts` — DELETE
- `psko-app/src/app/api/join/[code]/route.ts` — POST (student auth required)

**Implementation:**
- All `/api/educator/*` handlers call `requireEducator()` first; 403 otherwise (NFR-1)
- Ownership check: `cohort.instructorId === user.id` before any read/write (NFR-2)
- Roster query joins `session_feedback_scores` aggregated per student for inline ScoreBar
- Validate Zod body schemas (`{ name: z.string().min(1).max(255) }`)

**Acceptance:** enforcer-2 tests GREEN.
**AC covered:** AC-1, AC-10.

---

### enforcer-3 — RED Tests: Assignments API
**Depends on:** smith-1
**Agent:** enforcer
**Files to create:**
- `psko-app/src/app/api/educator/assignments/__tests__/route.route.test.ts`
- `psko-app/src/app/api/educator/assignments/[id]/progress/__tests__/route.route.test.ts`
- `psko-app/src/app/api/session/start/__tests__/route.route.test.ts` (regression for async getPersonaById + assignmentId)
- `psko-app/src/lib/personas/__tests__/getPersonaById.async.test.ts` (node:test)

**Tests cover:**
- POST /api/educator/assignments validates cohort ownership; persona exists (library or custom)
- GET progress returns per-student `{ studentId, status: "Not started"|"In progress"|"Completed", overallScore? }`
- Session.start with assignmentId verifies student is in assignment.cohort
- `getPersonaById()` is async, returns library persona from in-memory map (no DB hit), falls back to DB on miss (FR-5.5)
- Existing non-assignment session start still works (AC-9)

**Acceptance:** RED.
**AC covered:** AC-2, AC-9.

---

### smith-3 — Assignments API + Async Persona + Dashboard Fetcher
**Depends on:** enforcer-3, smith-2
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/lib/personas/loader.ts` — refactor `getPersonaById` to `async`; preload library into `Map` at module init; on miss query `prisma.persona.findUnique({ where: { id, isCustom: true } })` and adapt row → `PersonaData`
- `psko-app/src/lib/personas/index.ts` — re-export async signature
- `psko-app/src/app/api/session/start/route.ts` — `await getPersonaById()`; accept optional `assignmentId` body field; validate assignment belongs to student's cohort; persist `Session.assignmentId`
- `psko-app/src/app/api/educator/assignments/route.ts` — POST + GET
- `psko-app/src/app/api/educator/assignments/[id]/progress/route.ts` — GET
- `psko-app/src/lib/assignments/queries.ts` — `getAssignmentsForStudent(studentId)`, `getAssignmentProgress(assignmentId)`
- Update all other call sites of `getPersonaById` (prompt builder, /api/personas, etc.) to `await`

**Implementation:**
- In-memory cache populated at module load — `NFR-4` ≤50ms file-system path
- `Session.assignmentId` linkage drives status: no session = "Not started"; session exists with no `endedAt` = "In progress"; `endedAt` set = "Completed"

**Acceptance:** enforcer-3 tests GREEN.
**AC covered:** AC-2, AC-9.

---

### enforcer-4 — RED Tests: Assessment Reports
**Depends on:** smith-1
**Agent:** enforcer
**Files to create:**
- `psko-app/src/app/api/session/end/__tests__/normalization.route.test.ts`
- `psko-app/src/app/api/educator/students/[studentId]/report/__tests__/route.route.test.ts`
- `psko-app/src/app/api/educator/cohorts/[id]/report/__tests__/route.route.test.ts`
- `psko-app/src/lib/reports/__tests__/aggregate.test.ts` (node:test)

**Tests cover:**
- After session end, one `SessionFeedbackScore` row per `feedback.competency_scores` entry, `assessor='ai'`
- Malformed feedback: skip insert, log, do NOT fail session-end response (FR-4 design note)
- StudentReport returns `{ trends: { domain, points: [{ date, score }] }[], radarSelf, radarCohortAvg }`
- CohortReport returns `{ domainMeans, studentTotals: [{ studentId, name, overallScore }] }`
- Educator cannot fetch reports for students outside their cohorts (NFR-5)
- Student can fetch own report; cannot fetch another student's
- Instructor annotation PATCH writes `Session.instructorAnnotation`; student GET session does not surface it

**Acceptance:** RED.
**AC covered:** AC-4.

---

### smith-4 — Session End Normalization + Reports
**Depends on:** enforcer-4, smith-2
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/app/api/session/end/route.ts` — after writing `Session.feedback`, iterate `feedback.competency_scores`, batch insert into `session_feedback_scores`; wrap in try/catch (log + continue)
- `psko-app/src/lib/reports/aggregate.ts` — pure functions: `studentTrends`, `cohortDomainMeans`, `cohortStudentTotals`
- `psko-app/src/app/api/educator/students/[studentId]/report/route.ts` — GET; verify educator has cohort containing student
- `psko-app/src/app/api/educator/cohorts/[id]/report/route.ts` — GET
- `psko-app/src/app/api/dashboard/report/route.ts` — GET (student self-report)
- `psko-app/src/app/api/educator/sessions/[id]/annotation/route.ts` — PATCH for FR-4.7

**Acceptance:** enforcer-4 tests GREEN.
**AC covered:** AC-4.

---

### enforcer-5 — RED Tests: Custom Persona Builder API
**Depends on:** smith-1
**Agent:** enforcer
**Files to create:**
- `psko-app/src/app/api/educator/personas/__tests__/route.route.test.ts`
- `psko-app/src/app/api/educator/personas/[id]/__tests__/route.route.test.ts`
- `psko-app/src/app/api/personas/__tests__/merged.route.test.ts`

**Tests cover:**
- POST /api/educator/personas validates body against `PersonaDataSchema` (Zod); rejects invalid
- Created with `isCustom=true`, `createdBy=educatorId`, default `visibility='private'`
- PUT edits when no active session references it; 409 otherwise
- DELETE 204 when no sessions reference; 409 otherwise (FR-5.7)
- GET /api/personas: educator sees library + own customs; student sees library + customs assigned to them via cohort assignments (AC-8); student NOT in cohort doesn't see custom

**Acceptance:** RED.
**AC covered:** AC-5, AC-8.

---

### smith-5 — Custom Persona Builder API + Merged Personas Endpoint
**Depends on:** enforcer-5, smith-3
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/app/api/educator/personas/route.ts` — POST (full PersonaData), GET (educator's own)
- `psko-app/src/app/api/educator/personas/[id]/route.ts` — PUT, DELETE
- `psko-app/src/app/api/personas/route.ts` — MERGE library + DB custom personas based on viewer role and cohort membership
- `psko-app/src/lib/personas/loader.ts` — extend with `listAccessiblePersonas({ userId, role })`

**Implementation:**
- Reuse existing `PersonaDataSchema` from `src/lib/personas/schema.ts`
- Visibility filter: `private` → only `createdBy === viewer`; `institution` → match `viewer.institutionId === author.institutionId`
- Student visibility through assignments: subquery `assignments WHERE cohortId IN (memberships of student) AND personaId = persona.id`

**Acceptance:** enforcer-5 tests GREEN.
**AC covered:** AC-5, AC-8.

---

### smith-6 — LMS Integration (CSV + Deep-link)
**Depends on:** smith-3, smith-4
**Agent:** smith
**Files to create/modify:**
- `psko-app/src/lib/deeplink/sign.ts` — `signDeepLink({ studentId, personaId, approachId, assignmentId })` → JWT HS256, 7-day exp; env `DEEPLINK_SECRET`
- `psko-app/src/lib/deeplink/verify.ts` — verify + return payload; throw on tampered/expired
- `psko-app/src/lib/csv/canvasExport.ts` — emit UTF-8 with BOM (`﻿`); columns: `Student Name, SIS User ID, <domain1>, ..., <domainN>, overallScore`
- `psko-app/src/app/api/educator/cohorts/[id]/export/csv/route.ts` — GET, returns `text/csv; charset=utf-8`
- `psko-app/src/app/api/educator/assignments/[id]/deep-link/route.ts` — POST `{ studentId }` → `{ url }`
- `psko-app/src/app/api/session/join/[token]/route.ts` — GET: verify JWT, ensure `sub === currentUserId`, create Session with payload, redirect to `/session/[id]`; unauth → `/login?redirect=/session/join/[token]`
- Tests inline in `__tests__/` (Jest for routes; node:test for lib)

**Implementation:**
- CSV: stream-friendly response; one row per ACTIVE membership
- SIS User ID column = `users.email` (Phase 3 placeholder)
- JWT payload deliberately opaque IDs only (NFR-6, ethics §5)

**Acceptance:** AC-6, AC-7 pass.
**AC covered:** AC-6, AC-7.

---

### shaper-1 — Educator Dashboard + Cohort Management UI
**Depends on:** smith-2
**Agent:** shaper-1
**Files to create:**
- `psko-app/src/app/educator/layout.tsx` — `requireEducator()` guard; 280px left sidebar
- `psko-app/src/app/educator/page.tsx` — landing (cohort list)
- `psko-app/src/app/educator/cohorts/[id]/page.tsx` — roster + assignments tab
- `psko-app/src/components/educator/cohorts/CohortSidebar.tsx`
- `psko-app/src/components/educator/cohorts/RosterTable.tsx` — green/yellow/slate status dots; ScoreBar reuse
- `psko-app/src/components/educator/cohorts/JoinCodeChip.tsx` — monospace, copy-to-clipboard, regenerate, toggle enabled
- `psko-app/src/components/educator/cohorts/CreateCohortDialog.tsx`
- `psko-app/src/components/educator/assignments/CreateAssignmentDialog.tsx`
- `psko-app/src/components/educator/assignments/AssignmentList.tsx` — shows deep-link copy action + completion rate

**Acceptance:** AC-1 manual flow works end-to-end.
**AC covered:** AC-1, AC-2 (educator side), AC-10.

---

### shaper-2 — Assessment Report Charts
**Depends on:** smith-4
**Agent:** shaper-2
**Files to create/modify:**
- `psko-app/package.json` — add `recharts`
- `psko-app/src/components/educator/reports/TrendLineChart.tsx` — `LineChart` + `ResponsiveContainer`; one line per CTS-R domain
- `psko-app/src/components/educator/reports/CompetencyRadar.tsx` — `RadarChart`; self vs cohort avg; 9 axes
- `psko-app/src/components/educator/reports/CohortBarChart.tsx` — `BarChart` per-student totals
- `psko-app/src/app/educator/students/[id]/page.tsx` — per-student report
- `psko-app/src/app/educator/cohorts/[id]/report/page.tsx` — per-cohort report
- `psko-app/src/app/dashboard/report/page.tsx` — student self-report
- `psko-app/src/components/educator/reports/AnnotationEditor.tsx` — instructor-only textarea (FR-4.7)

**Implementation:** all chart components `'use client'`; tree-shake Recharts imports per spec.
**Acceptance:** AC-4 visual verification.
**AC covered:** AC-4.

---

### shaper-3 — Custom Persona Wizard (4-Step)
**Depends on:** smith-5
**Agent:** shaper-3
**Files to create:**
- `psko-app/src/app/educator/personas/page.tsx` — list of own customs
- `psko-app/src/app/educator/personas/new/page.tsx` — wizard host
- `psko-app/src/app/educator/personas/[id]/edit/page.tsx`
- `psko-app/src/components/educator/persona-wizard/WizardShell.tsx` — `useReducer` state, step navigation, "Skip" on Step 4
- `psko-app/src/components/educator/persona-wizard/StepIdentity.tsx`
- `psko-app/src/components/educator/persona-wizard/StepClinical.tsx`
- `psko-app/src/components/educator/persona-wizard/StepCognitive.tsx`
- `psko-app/src/components/educator/persona-wizard/StepScid5.tsx`
- `psko-app/src/components/educator/persona-wizard/LivePreview.tsx` — reuses `PersonaCard`
- Each step validates its slice via `PersonaDataSchema.pick(...)` before "Next" is enabled (FR-5.2)

**Acceptance:** AC-5 wizard flow saves custom persona; student session runs against it.
**AC covered:** AC-5, AC-8.

---

### shaper-4 — Student Dashboard "Assigned to You"
**Depends on:** smith-3
**Agent:** shaper-4
**Files to create/modify:**
- `psko-app/src/app/dashboard/page.tsx` — add section above existing persona library
- `psko-app/src/components/dashboard/AssignedPersonas.tsx` — card grid; status badges (Not started / In progress / Completed + score); due-date pill (red if past due)
- Hide section when student has no active memberships (FR-3.2 design)
- Hook into existing debrief reminder pattern: when assignment session ends, fire reminder regardless of trauma flag (spec §Integration #5)

**Acceptance:** AC-2 student side.
**AC covered:** AC-2.

---

### smith-7 — LTI 1.3 Service (Express + ltijs)
**Depends on:** smith-4, smith-6
**Agent:** smith
**Files to create:**
- `lti-service/package.json` (deps: ltijs ^5.9, ltijs-postgresql ^3.2, jsonwebtoken ^9, express ^4, pg ^8)
- `lti-service/src/index.ts` — ltijs setup; `cookieless: true`; postgres adapter against `lti` schema in same Supabase DB
- `lti-service/src/routes/launch.ts` — onConnect handler; role-map (FR-7.4); create handoff JWT; redirect `${APP_HOST}/lti/callback?token=...`
- `lti-service/src/routes/deeplink.ts` — onDeepLinking; renders assignment-picker page; posts back `LtiDeepLinkingResponse`
- `lti-service/src/routes/grades.ts` — internal endpoint `POST /internal/grades` (HMAC-signed with `INTERNAL_API_SECRET`); pushes AGS score with retry 1s/4s/16s (NFR-10)
- `lti-service/src/routes/config.ts` — `GET /lti/canvas-config.json` (public, rate-limited)
- `lti-service/src/middleware/handoff.ts` — JWT mint (HS256, 5min, jti); DB-backed single-use via `lti_handoff_tokens` table
- `lti-service/Dockerfile`
- `lti-service/README.md` — Moodle manual setup instructions (FR-7.10)
- `psko-app/prisma/migrations/.../lti_handoff_tokens.sql` — `(jti, userId, usedAt, expiresAt)` (under main schema; ltijs tables live in `lti` schema)
- `psko-app/src/app/lti/callback/route.ts` — verify handoff token, mark used, call Supabase admin `getUserByEmail`/`createUser` + `signInWithEmail`, set session cookie, redirect to `/dashboard` or assignment session
- `psko-app/src/app/api/internal/lti/grade/route.ts` — server-only webhook called from session-end after persisting score, forwards to `lti.psko.app/internal/grades` if `Session.ltiLineItemUrl`

**Implementation notes:**
- JWK cache TTL 1h, refresh on 401 (NFR-9)
- Reject `alg:none` and symmetric algs (NFR-9)
- AGS scope check: if `endpoint.scope` lacks `score`, log warning, do not throw (OQ-10)
- Health check `GET /health` (NFR-8)
- Cookieless mode mandatory — Safari/Chrome iframe support (FR-7.8, AC-13)

**Acceptance:** AC-11, AC-12, AC-13, AC-14 verifiable against Canvas test instance + Moodle test instance.
**AC covered:** AC-11..14.

---

## Dependency Graph

```
alchemist-1
    │
    ├── enforcer-1 ──► smith-1
    │                    │
    │                    ├── enforcer-2 ──► smith-2 ──► shaper-1
    │                    │                    │
    │                    ├── alchemist-2 ─────┘
    │                    │
    │                    ├── enforcer-3 ──► smith-3 ──► shaper-4
    │                    │                    │
    │                    ├── enforcer-4 ──► smith-4 ──► shaper-2
    │                    │                    │
    │                    ├── enforcer-5 ──► smith-5 ──► shaper-3
    │                    │                    │
    │                    │                    └────────┐
    │                    └──────── smith-6 ◄───────────┤
    │                                  │               │
    │                                  └──► smith-7 ◄──┘
```

---

## Current Session

**Phase:** Role system RED tests complete — ready for smith-1
**Active:** none
**Working on:** enforcer-1 complete (c584c7b); RED tests for getRoleFromJwt, requireEducator, requireUser all confirmed failing
**File:** psko-app/src/lib/auth/__tests__/getRoleFromJwt.test.ts, requireEducator.test.ts, requireUser.test.ts
**Next:** smith-1 (implement getRoleFromJwt, requireEducator, requireUser, middleware /educator/* gating) — unblocked by enforcer-1

---

## Decisions

- **Cookieless ltijs mode required** — Safari + Chrome Privacy Sandbox block 3p cookies in LMS iframes (FR-7.8, AC-13).
- **Handoff token store in PostgreSQL** (not Redis) for Phase 3 simplicity (OQ-8 recommendation).
- **LTI service on Railway**, Next.js on Vercel, shared Supabase DB (OQ-7 recommendation).
- **Join code alphabet** = `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars, exclude 0/O/1/I/l) per design note.
- **CSV emits UTF-8 BOM** for Excel/Canvas compat with Turkish characters (OQ-6).
- **Async `getPersonaById`** with in-memory file map keeps library hot path ≤50ms (NFR-4).
- **`SessionFeedbackScore` normalization** is the report data source; `Session.feedback` JSON remains for display (FR-4.6).
- **Custom persona deletion** blocked if any session references it (resolves OQ-5 conservatively).
- **`canvas-config.json` is public + rate-limited** (OQ-9 recommendation).

---

## Risk Areas

- **`getPersonaById` async refactor** has many callers; AC-9 explicitly demands no regression for free-practice sessions. smith-3 must grep all callers and `await` each.
- **Supabase Custom Access Token Hook** requires Supabase dashboard config (not just SQL). alchemist-2 ships SQL; deployment must enable the hook in Supabase UI before role gating works.
- **LTI service** is the largest single task (~4h). If it slips, AC-1..AC-10 still ship; AC-11..14 can land in a follow-up.
- **Shared `PersonaCard` component** is read by shaper-3 (wizard preview) and shaper-4 (assigned section) — both treat it read-only.
- **`Session.feedback` schema** assumed to contain `competency_scores: { domain, score }[]`. smith-4 must defensively parse; malformed payloads must not break session end (per FR-4 design note).
