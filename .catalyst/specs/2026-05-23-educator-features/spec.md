---
spec: 2026-05-23-educator-features
status: draft
domain: educator

provides:
  - Educator role with protected dashboard at /educator/*
  - Cohort creation and join-code-based student enrollment
  - Competency assessment reports (per-student and per-cohort)
  - Custom persona builder (educator-authored cases)
  - LMS integration via CSV export and signed deep-link URLs

requires:
  - 2026-05-16-clinical-intelligence-engine
  - 2026-05-23-persona-expansion

affects:
  - Student dashboard (assigned personas section)
  - Session start flow (async persona lookup, assignment linkage)
  - Feedback pipeline (SessionFeedbackScore normalization)
  - Phase 4 (LTI 1.3 builds on the deep-link token infrastructure)

patterns_established: []
key_files: []
key_decisions: []
---

# Spec: Educator Features & Scale (Phase 3)

PSKO has demonstrated that individual students can independently use AI simulation to practice clinical skills. Phase 3 unlocks institutional adoption by adding the educator layer: cohort management, structured assessment reporting, the ability for educators to author their own clinical cases, and lightweight LMS interoperability. The goal is to make PSKO adoptable by a psychology program as a course tool — not just an individual student's personal practice app.

Full LTI 1.3 integration is deferred to Phase 4. Phase 3 ships the minimum viable LMS surface: CSV grade export and signed deep-link URLs that educators can paste into any LMS.

---

## Goals

1. Enable educators to create cohorts, enroll students, and assign specific persona + approach combinations.
2. Give educators visibility into cohort-level and individual student competency progression over time.
3. Allow educators to build custom patient personas validated against the existing clinical schema.
4. Provide CSV grade export and shareable session deep-links compatible with standard LMS workflows.
5. Keep all educator-only surfaces behind a hard role gate so students cannot access them.

---

## Non-Goals

- LTI 1.3 / OAuth 2.0 launch protocol — deferred to Phase 4.
- SAML or SCIM group synchronization with institutional identity providers.
- PDF report export — CSV only in Phase 3.
- Public persona sharing — educator personas are private or institution-scoped only.
- Real-time AI supervision during live sessions (already deferred in roadmap).
- Educator ability to directly edit the AI feedback already generated for a session (annotation only, not replacement).
- Turkish-language UI — deferred to Phase 5.

---

## Functional Requirements

### FR-1 — Role System

**FR-1.1** The `User` model shall have a `role` field typed as `STUDENT | EDUCATOR` with default `STUDENT`.

**FR-1.2** At sign-in, Supabase Custom Access Token Hook shall inject `role` into `app_metadata` within the JWT. The hook reads role from the `users` table at token issuance time.

**FR-1.3** `middleware.ts` shall read `app_metadata.role` from the JWT to gate `/educator/*` routes. No database queries may be made inside middleware.

**FR-1.4** Layout components and Server Components inside `/educator/*` shall perform a secondary, authoritative role check via `supabase.auth.getUser()` + DB query before rendering any educator data.

**FR-1.5** `user_metadata` shall never be used for authorization decisions. Only `app_metadata` is trusted.

**FR-1.6** Educator accounts shall be provisioned via Supabase service-role `inviteUserByEmail` with `role: 'EDUCATOR'` written to the `users` table at invite time. Self-registration creates `STUDENT` accounts only.

**FR-1.7** A student navigating directly to any `/educator/*` URL shall be redirected to `/dashboard` with a 403-equivalent UI state.

---

### FR-2 — Cohort Management

**FR-2.1** An educator shall be able to create a cohort with a name. The system shall auto-generate a unique 6-character alphanumeric join code on creation.

**FR-2.2** The join code shall be displayed to the educator in the dashboard and copyable in one click.

**FR-2.3** An educator shall be able to disable a join code (sets `joinCodeEnabled = false`) to stop new enrollments, and regenerate a new one at any time.

**FR-2.4** A student shall be able to join a cohort by navigating to `/join/[code]`. The route shall validate the code is active, create a `CohortMembership` record with `status: ACTIVE`, and redirect the student to `/dashboard`.

**FR-2.5** If a student attempts to join with an invalid or disabled code, they shall see an error message and not be enrolled.

**FR-2.6** An educator shall be able to view the full student roster for each cohort: name, email, join date, membership status (ACTIVE / INACTIVE), and aggregate competency scores.

**FR-2.7** An educator shall be able to mark a student's membership as INACTIVE (removes them from active tracking without deleting their session history).

**FR-2.8** The educator dashboard shall show a list of all cohorts the educator owns in a 280px left sidebar. Selecting a cohort loads its roster and assignments in the main panel.

**FR-2.9** A student shall only see cohorts they are a member of; they shall not see other cohorts' data.

---

### FR-3 — Assignments

**FR-3.1** An educator shall be able to create an assignment for a cohort by specifying: persona, therapeutic approach (optional), role mode (THERAPIST or CLIENT), and optional due date.

**FR-3.2** An assigned persona shall appear in a prominent "Assigned to you" section above the standard persona library on the student's `/dashboard`. Unstarted assignments shall show a visual indicator.

**FR-3.3** Each assignment shall display one of three statuses per student: "Not started", "In progress", or "Completed". "Completed" shall show the student's `overallScore` for that assignment's session.

**FR-3.4** When a student starts a session for an assigned persona, the `Session` record shall be linked to the `Assignment` via `assignmentId`. The assignment status shall update based on session state.

**FR-3.5** Educators shall see assignment completion rates across the cohort roster (count completed / total enrolled).

**FR-3.6** Assignments shall support a due date field. Past-due incomplete assignments shall be visually flagged in both the student and educator views.

---

### FR-4 — Assessment Reports

**FR-4.1** After each session ends, the supervisor feedback's `competency_scores` array shall be normalized and persisted to the `SessionFeedbackScore` table (one row per domain per session). Assessor is `'ai'`.

**FR-4.2** An educator shall be able to view a per-student report showing: competency score trends over time (line chart, per CTS-R domain), and a competency radar chart showing the student's current profile vs. cohort average.

**FR-4.3** An educator shall be able to view a per-cohort aggregate report showing: mean scores per domain across all students, and a bar chart comparing individual students' overall scores within the cohort.

**FR-4.4** A student shall be able to view their own per-student report (same charts as FR-4.2) from their dashboard. They shall not see other students' data.

**FR-4.5** Charts shall be rendered using Recharts: `LineChart` for score trends over time, `RadarChart` for competency profiles, `BarChart` for cohort comparison.

**FR-4.6** Reports shall draw data from the `SessionFeedbackScore` table, not from parsing the `feedback` JSON blob. The JSON blob is retained for display purposes only.

**FR-4.7** Instructors shall be able to add a short text annotation to any session's feedback visible only to themselves (does not alter the AI-generated feedback content visible to the student).

---

### FR-5 — Custom Persona Builder

**FR-5.1** An educator shall be able to create a custom patient persona using a 4-step wizard:
  - Step 1 — Identity: name, age, presenting problem, backstory, difficulty level, conversational style
  - Step 2 — Clinical Profile: disorder profile (DSM-5 labels), recommended approaches
  - Step 3 — Cognitive Model: core beliefs, intermediate beliefs, automatic thoughts, emotional state, triggers, defenses, values
  - Step 4 — SCID-5 (optional): onset age, duration months, functional impairment, prior treatment, trauma flags

**FR-5.2** Each wizard step shall validate its fields against the existing `PersonaDataSchema` Zod schema (`src/lib/personas/schema.ts`) before allowing progression to the next step.

**FR-5.3** On save, the custom persona shall be written to the `Persona` table with `isCustom = true` and `createdBy = educatorId`.

**FR-5.4** An educator shall be able to set persona visibility to `private` (author only) or `institution` (all educators in the same institution). Students do not see the visibility toggle; custom personas appear to students only when assigned.

**FR-5.5** Custom personas shall be retrievable by `getPersonaById()`. This function must become async and fall back to a DB query when the persona is not found in the file-system library.

**FR-5.6** `GET /api/personas` shall merge file-system library personas and educator custom personas from the database. Students see only library personas plus any custom personas assigned to them. Educators see library + all their own custom personas.

**FR-5.7** An educator shall be able to edit or delete a custom persona they authored, provided it has no active (in-progress) sessions against it.

**FR-5.8** The `POST /api/session/start` route shall be updated to handle the now-async `getPersonaById()` call.

---

### FR-6 — LMS Integration (Limited)

**FR-6.1 — CSV Export:** An educator shall be able to export a cohort's grade data as a CSV file. Columns shall match Canvas gradebook format: `Student Name`, `SIS User ID`, `overallScore`, and one column per CTS-R competency domain. One row per student.

**FR-6.2 — Deep-Link Generation:** An educator shall be able to generate a signed URL for an assignment (persona + approach + student). The URL format is `/session/join/[token]`. When a student visits the URL, the system auto-starts the correct session without further selection steps.

**FR-6.3** Deep-link tokens shall be signed JWTs containing: `studentId`, `personaId`, `approachId`, `assignmentId`, and an expiry of 7 days. The signing secret is server-only; token is not decodable client-side to expose persona data.

**FR-6.4** An expired or tampered deep-link token shall return a user-facing error page, not silently create a misconfigured session.

**FR-6.5** Deep-link URLs shall be displayable in the educator dashboard alongside each assignment, with a copy-to-clipboard action.

---

## Non-Functional Requirements

**NFR-1 — Security:** All `/educator/*` routes and all educator API endpoints (`/api/educator/*`) must reject requests where the authenticated user's `app_metadata.role` is not `EDUCATOR`. Return HTTP 403.

**NFR-2 — Security:** Row-Level Security policies shall be applied to `Cohort`, `CohortMembership`, and `Assignment` tables so that an educator can only read/write rows they own. Students can only read `CohortMembership` rows where they are the `studentId`.

**NFR-3 — Performance:** The cohort roster page shall load within 2 seconds for cohorts of up to 200 students. Aggregate score queries shall be indexed on `(sessionId, domain)` in `SessionFeedbackScore`.

**NFR-4 — Async persona loader:** `getPersonaById()` refactored to `async` must not introduce regression in session start latency beyond 50ms (file-system path remains synchronous-equivalent via cached in-memory map; DB path adds one indexed query).

**NFR-5 — Data isolation:** A student shall never receive data from another student's session through any API endpoint, even if they manipulate request parameters. Server-side user ID binding is mandatory on all student-facing queries.

**NFR-6 — Token security:** Deep-link JWTs shall use `HS256` minimum. The signing secret shall be stored in environment variables, never in source code.

**NFR-7 — Audit trail:** `CohortMembership` status changes and assignment creation/deletion shall be logged with `createdAt` / `updatedAt` timestamps on all tables.

---

## Acceptance Criteria

**AC-1** An educator can sign in, create a cohort, copy the join code, and share it. A student uses the code to join. The educator's roster shows the student with status ACTIVE.

**AC-2** An educator creates an assignment (persona + approach + due date). The student sees the assigned persona at the top of their dashboard with "Not started" status. After completing the session, status shows "Completed" with the overall score.

**AC-3** A student with role STUDENT who navigates directly to `/educator/dashboard` is redirected to `/dashboard` without seeing any educator data.

**AC-4** A student completes 3 sessions. Their personal report page shows a line chart with 3 data points per CTS-R domain. The chart data matches the scores in `SessionFeedbackScore` table.

**AC-5** An educator builds a custom persona using the 4-step wizard. The persona is saved with `isCustom = true`. When the educator assigns it to a cohort, a student can start a session with it. The session runs correctly using the DB-loaded persona.

**AC-6** An educator exports a cohort CSV. The file opens in Excel/Google Sheets with correct column headers matching Canvas gradebook format and one row per enrolled student.

**AC-7** An educator generates a deep-link for an assignment. Pasting the URL into a browser as the assigned student auto-starts the correct session. Visiting the same URL after 7 days returns an error page.

**AC-8** An educator creates a custom persona, assigns it to two cohorts. The `GET /api/personas` response for an educator includes the custom persona. A student not in either cohort does not see the custom persona in their persona list.

**AC-9** The existing session flow (non-assignment) continues to work unchanged after the `getPersonaById()` async refactor.

**AC-10** Regenerating a join code invalidates the old code. A student attempting to use the old code after regeneration receives an error.

---

## Data Model Changes

### Modified Tables

| Table | Column | Type | Default | Notes |
|-------|--------|------|---------|-------|
| `users` | `role` | `enum('STUDENT','EDUCATOR')` | `STUDENT` | New enum; migrate existing rows to STUDENT |
| `users` | `institutionId` | `uuid?` | `NULL` | FK to future `Institution` table; nullable in Phase 3 |
| `personas` | `createdBy` | `uuid?` | `NULL` | FK → `users.id`; NULL for library personas |
| `personas` | `isCustom` | `boolean` | `false` | Distinguishes DB-only custom personas from file-loaded library |
| `personas` | `visibility` | `enum('private','institution')` | `private` | Only meaningful when `isCustom = true` |
| `sessions` | `assignmentId` | `uuid?` | `NULL` | FK → `assignments.id`; NULL for self-directed sessions |

### New Tables

#### `cohorts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default uuid | — |
| `name` | `varchar(255)` | NOT NULL | Display name for the cohort |
| `instructorId` | `uuid` | NOT NULL, FK → `users.id` | Owning educator |
| `joinCode` | `varchar(6)` | NOT NULL, UNIQUE | 6-char alphanumeric; uppercase |
| `joinCodeEnabled` | `boolean` | NOT NULL, default `true` | False = code revoked |
| `createdAt` | `timestamptz` | NOT NULL, default now() | — |
| `updatedAt` | `timestamptz` | NOT NULL, auto | — |

#### `cohort_memberships`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default uuid | — |
| `cohortId` | `uuid` | NOT NULL, FK → `cohorts.id` | — |
| `studentId` | `uuid` | NOT NULL, FK → `users.id` | — |
| `joinedAt` | `timestamptz` | NOT NULL, default now() | — |
| `status` | `enum('ACTIVE','INACTIVE')` | NOT NULL, default `ACTIVE` | — |
| Unique constraint on `(cohortId, studentId)` | | | Prevent duplicate membership |

#### `assignments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default uuid | — |
| `cohortId` | `uuid` | NOT NULL, FK → `cohorts.id` | — |
| `personaId` | `uuid` | NOT NULL, FK → `personas.id` | Library or custom persona |
| `approachId` | `varchar(50)?` | NULLABLE | TherapeuticApproach enum value; NULL = student chooses |
| `roleMode` | `enum('THERAPIST','CLIENT')` | NOT NULL, default `THERAPIST` | — |
| `dueAt` | `timestamptz?` | NULLABLE | Optional due date |
| `createdBy` | `uuid` | NOT NULL, FK → `users.id` | Educator who created it |
| `createdAt` | `timestamptz` | NOT NULL, default now() | — |
| `updatedAt` | `timestamptz` | NOT NULL, auto | — |

#### `session_feedback_scores`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default uuid | — |
| `sessionId` | `uuid` | NOT NULL, FK → `sessions.id` | — |
| `domain` | `varchar(100)` | NOT NULL | CTS-R domain name (e.g. "Agenda Setting") |
| `score` | `integer` | NOT NULL | 1–6 (CTS-R scale) |
| `assessor` | `enum('ai','instructor')` | NOT NULL, default `'ai'` | Source of score |
| `createdAt` | `timestamptz` | NOT NULL, default now() | — |
| Index on `(sessionId, domain)` | | | Required for NFR-3 |

---

## API Surface

All new educator endpoints require `app_metadata.role === 'EDUCATOR'` and return HTTP 403 otherwise.

| Method | Path | Auth | Request body | Response | Notes |
|--------|------|------|--------------|----------|-------|
| `POST` | `/api/educator/cohorts` | educator | `{ name: string }` | `Cohort` | Creates cohort + generates join code |
| `GET` | `/api/educator/cohorts` | educator | — | `Cohort[]` | All cohorts owned by educator |
| `GET` | `/api/educator/cohorts/[id]` | educator | — | `Cohort + members[]` | Roster with scores |
| `PATCH` | `/api/educator/cohorts/[id]` | educator | `{ joinCodeEnabled?, name? }` | `Cohort` | Toggle code or rename |
| `POST` | `/api/educator/cohorts/[id]/regenerate-code` | educator | — | `{ joinCode: string }` | Generates new join code |
| `DELETE` | `/api/educator/cohorts/[id]/members/[studentId]` | educator | — | `204` | Sets status INACTIVE |
| `POST` | `/api/educator/assignments` | educator | `{ cohortId, personaId, approachId?, roleMode, dueAt? }` | `Assignment` | — |
| `GET` | `/api/educator/assignments/[id]/progress` | educator | — | `AssignmentProgress[]` | Per-student completion status |
| `GET` | `/api/educator/students/[studentId]/report` | educator | — | `StudentReport` | Score trends for a student |
| `GET` | `/api/educator/cohorts/[id]/report` | educator | — | `CohortReport` | Aggregate cohort scores |
| `POST` | `/api/educator/personas` | educator | `PersonaData` (Zod-validated) | `Persona` | Creates custom persona |
| `PUT` | `/api/educator/personas/[id]` | educator | `Partial<PersonaData>` | `Persona` | Edit custom persona |
| `DELETE` | `/api/educator/personas/[id]` | educator | — | `204` | Fails if active sessions exist |
| `GET` | `/api/educator/cohorts/[id]/export/csv` | educator | — | `text/csv` | Canvas-format grade export |
| `POST` | `/api/educator/assignments/[id]/deep-link` | educator | `{ studentId: string }` | `{ url: string }` | Generates signed JWT URL |
| `POST` | `/api/join/[code]` | student | — | redirect | Validates code, creates membership |
| `GET` | `/api/session/join/[token]` | student | — | redirect to session | Validates JWT, starts session |
| `GET` | `/api/personas` | any authenticated | — | `Persona[]` | MODIFIED: merges library + custom |

---

## Integration Points

### 1. Persona Loader (`src/lib/personas/index.ts` and `loader.ts`)

`getPersonaById(id: string)` is currently synchronous and only reads from the file-system library. It must be refactored to:

```typescript
// Before (sync, file-only)
export function getPersonaById(id: string): PersonaData | undefined

// After (async, file + DB fallback)
export async function getPersonaById(id: string): Promise<PersonaData | undefined>
```

Implementation: maintain an in-memory map of file-system personas (loaded once at module init). On cache miss, query `personas` table where `id = ? AND isCustom = true`. This keeps the hot path (library personas) near-zero latency while supporting custom personas.

All call sites must be updated: `POST /api/session/start`, `GET /api/personas`, and any prompt builder that calls `getPersonaById`.

### 2. Session Start Route (`src/app/api/session/start/route.ts`)

Must be updated for:
- Awaiting the now-async `getPersonaById()`.
- Accepting optional `assignmentId` in request body. If present, validate the assignment belongs to the student's cohort, and write `Session.assignmentId` on creation.

### 3. Session End Route (`src/app/api/session/end/route.ts`)

After the supervisor agent returns `SupervisorFeedback`, the existing feedback JSON is written to `Session.feedback`. Phase 3 adds: iterate `feedback.competency_scores`, insert one row per domain into `session_feedback_scores` with `assessor = 'ai'`.

### 4. Student Dashboard (`src/app/dashboard/page.tsx`)

Add "Assigned to you" section rendered above the persona library. Section queries `assignments` for the student's cohort memberships, plus matching session status per assignment. Section is hidden if the student has no active cohort memberships.

### 5. Debrief Reminder Pattern (from Phase 2C)

`TriggerWarningModal.tsx` and the debrief reminder already exist in `src/components/session/`. Phase 3 extends the debrief reminder to fire for any assignment session, regardless of whether the persona has a trauma flag — assignment contexts warrant structured reflection.

### 6. Middleware (`src/middleware.ts`)

Add `/educator/:path*` to the protected route matcher. Read `session.user.app_metadata.role` from the Supabase server client in middleware; redirect to `/dashboard` if role is not `EDUCATOR`.

### 7. Recharts Dependency

`recharts` must be added to `psko-app/package.json`. Import only the specific chart components needed (`LineChart`, `RadarChart`, `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `Legend`) to minimize bundle size. Chart components are Client Components (`'use client'`).

---

## Ethical & Privacy Considerations

### Student Data (KVKK / GDPR)

PSKO's primary market is Turkish universities. Turkey's **Kişisel Verilerin Korunması Kanunu (KVKK, Law No. 6698)** governs personal data processing and is closely aligned with GDPR principles.

**Key obligations for Phase 3:**

1. **Lawful basis for educator access:** Educators viewing student session data (competency scores, transcripts) must be covered by an institutional data processing agreement. The platform should not expose raw session transcripts to educators by default — only normalized scores. Transcript access should be opt-in and require explicit student consent at enrollment.

2. **Data minimization:** CSV exports should include only aggregated competency scores (not full transcript text). Student names in exports should use initials or student IDs when institutions require anonymization.

3. **Retention policy:** Student session data linked to a cohort should not be retained indefinitely after the student leaves the institution. `CohortMembership.status = INACTIVE` must eventually trigger a scheduled data review.

4. **Cross-border data transfer:** Supabase infrastructure region must be confirmed as EU or Turkey to comply with KVKK Article 9 restrictions on overseas transfer without Data Protection Board approval.

5. **Deep-link token scope:** Signed JWTs for deep-links must not include sensitive student data (name, email) — only opaque IDs. The token is the access vehicle, not a data carrier.

6. **Consent for custom personas:** Educators must affirm during persona creation that the persona is a fictional composite and not based on an identifiable real patient, in compliance with clinical ethics standards.

### Clinical Ethics

- Educator annotations on AI feedback (FR-4.7) are for instructional notes only. The platform UI must make clear to students that annotations are instructor commentary, not AI output.
- Competency scores are training indicators, not professional qualification records. This must be stated in any exported CSV or report.

---

## Open Questions

**OQ-1 — Institution model in Phase 3:** The `users.institutionId` column is added but the `Institution` table is deferred. Institution-scoped custom persona visibility (FR-5.4) will use a join via `users.institutionId` matching across educators. Should we add a lightweight `institutions` table in Phase 3 (just `id`, `name`) to anchor this FK properly, or use a plain text `institutionSlug` field and defer the table?

**OQ-2 — Educator self-promotion:** Currently only service-role invite can set `role = EDUCATOR`. Should we add a separate `/admin/*` section for a super-admin to promote existing users to educator, or keep educator provisioning exclusively via invite email for Phase 3?

**OQ-3 — Assignment vs. free practice sessions in reports:** When a student completes a session outside any assignment (free practice), those sessions currently produce `SessionFeedbackScore` rows. Should educator reports show all sessions (including free practice) for a student, or only sessions linked to assignments in that cohort? Showing all gives a richer competency picture; showing only assigned sessions simplifies attribution.

**OQ-4 — Join code collision probability:** 6-character alphanumeric (A-Z0-9) gives ~2.1B combinations. At 10,000 concurrent cohorts the birthday collision probability is negligible (~0.0000023%). Is 6 characters sufficient, or should we use 8 to future-proof for scale?

**OQ-5 — Custom persona lifecycle with archived cohorts:** If a cohort is archived (all students INACTIVE), and it has sessions against a custom persona, should the educator be allowed to delete the custom persona? Proposal: block deletion if any session (active or ended) references the persona; instead offer an archive/hide flag.

**OQ-6 — CSV export encoding for Turkish characters:** Turkish student names include characters outside ASCII (ğ, ş, ç, ı, ö, ü). The Canvas gradebook CSV importer requires UTF-8 with BOM. Confirm the export pipeline emits UTF-8 BOM (`﻿`) to prevent mojibake in Excel on Windows.

---

## Per-Feature Design Notes

### Role System

The two-check pattern (middleware for coarse routing + Server Component for authoritative check) is intentional. Middleware runs at the edge on every request and must be fast — it cannot make DB round-trips. The edge check prevents STUDENT users from even receiving the HTML shell of educator pages. The Server Component check inside the layout is the security boundary that actually gates data access. Both must be present; neither is redundant.

The Supabase Custom Access Token Hook fires at JWT issuance (login + token refresh). Role changes (e.g., promoting a student to educator) do not take effect until the user's next login. This is acceptable for Phase 3 since educator accounts are provisioned by invite, not promoted interactively.

### Cohort Management

Join codes use uppercase alphanumeric to avoid visual confusion between `0`/`O` and `1`/`I`/`l`. Consider excluding those four characters entirely, giving a 32-character alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Codes should be displayed with a monospace font in the UI.

The roster table follows the compact row pattern described in UI decisions: green dot = ACTIVE, yellow = pending (joined but no sessions), slate = INACTIVE. The inline ScoreBar domain chips reuse the existing `ScoreBar` component from `src/components/feedback/FeedbackReport.tsx`.

### Assessment Reports

The `SessionFeedbackScore` normalization is the critical architectural change in Phase 3. The existing `Session.feedback` JSON blob was sufficient for displaying a single session's feedback, but is not queryable for trends. The new normalized table enables `GROUP BY domain` queries for trends and cohort aggregates without JSON extraction.

Insertion into `session_feedback_scores` happens inside the existing session end handler, immediately after the feedback JSON is parsed. If the supervisor agent returns malformed feedback (missing `competency_scores`), the insert is skipped and the error is logged — it must not cause the session end to fail from the student's perspective.

The radar chart shows 9 axes, one per CTS-R domain. Domains with no score data yet are shown at 0. The line chart's x-axis is session date; y-axis is score (1–6). Both charts are responsive (fill container width) using Recharts' `ResponsiveContainer`.

### Custom Persona Builder

The wizard state is managed in a single React `useReducer` in a Client Component. Each step submits its partial data to the reducer; navigation between steps does not require server round-trips. The full persona object is only submitted to `POST /api/educator/personas` when the educator clicks "Save" on the final step.

Step 4 (SCID-5) is optional. If the educator skips it, the persona is valid — the `Scid5FieldsSchema` is `z.optional()` in the existing schema. The wizard must make this explicit with a "Skip this step" action.

Educators should see a live preview panel alongside the wizard showing what the persona card will look like to students. This reuses `PersonaCard` from `src/components/simulation/PersonaCard.tsx`.

On `getPersonaById()` refactor: the in-memory cache should be populated once on module load (same as current behavior for file-system personas). Custom personas from the DB are not cached in memory — each lookup for a custom persona hits the DB. This is acceptable since custom persona sessions are less frequent and the DB query is indexed on `id`. If volume grows, a short-lived TTL cache can be added in Phase 4.

### LMS Integration

The CSV column order must match Canvas gradebook exactly for bulk import to work without remapping. Confirmed order: `Student Name`, `SIS User ID`, `<domain1>`, `<domain2>`, ..., `overallScore`. The `SIS User ID` column should be populated from `users.email` as the closest available identifier in Phase 3 (no actual SIS ID integration yet).

The deep-link JWT payload:

```json
{
  "sub": "<studentId>",
  "personaId": "<personaId>",
  "approachId": "<approach|null>",
  "assignmentId": "<assignmentId>",
  "iat": 1234567890,
  "exp": 1234567890
}
```

The `/api/session/join/[token]` route verifies the JWT, confirms `sub` matches the authenticated user's ID (prevents one student using another's deep-link), creates a session with the encoded parameters, and redirects to `/session/[sessionId]`.

If the student is not authenticated when visiting the deep-link URL, they are redirected to `/login?redirect=/session/join/[token]`. After login, the redirect parameter resumes the deep-link flow.
