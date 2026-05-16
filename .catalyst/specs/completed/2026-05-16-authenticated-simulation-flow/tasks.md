# Tasks: Dual-Role Simulation Flows

## Build DAG

### Phase 1: Foundation (Sequential)

| ID | Agent | Scope | Blocks | Est |
|----|-------|-------|--------|-----|
| db-schema | alchemist | prisma/schema.prisma | api-*, ui-* | 30m |

### Phase 2: Contracts (Sequential)

| ID | Agent | Scope | Depends On | Blocks | Est |
|----|-------|-------|------------|--------|-----|
| api-types | smith | src/types/index.ts | db-schema | api-*, ui-* | 20m |

### Phase 3: Parallel Backend (smith × 2)

| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| prompts | smith-1 | src/lib/claude/prompts/**, src/lib/claude/patient-agent.ts, src/lib/claude/supervisor-agent.ts | src/types/index.ts | api-types | 1h |
| api-routes | smith-2 | src/app/api/session/** | src/types/index.ts, src/lib/claude/** | api-types | 45m |

### Phase 4: Parallel Frontend (shaper × 3)

| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| ui-role-selector | shaper-1 | src/components/simulation/RoleModeSelector.tsx | src/types/index.ts | api-types | 30m |
| ui-dashboard | shaper-2 | src/components/simulation/PersonaCard.tsx, src/app/dashboard/page.tsx | src/components/simulation/RoleModeSelector.tsx, src/types/index.ts | ui-role-selector | 45m |
| ui-session | shaper-3 | src/components/feedback/FeedbackReport.tsx, src/components/simulation/SimulationChat.tsx, src/app/session/[id]/page.tsx | src/types/index.ts | api-types | 1h |

### Phase 5: Integration + Tests (Sequential)

| ID | Agent | Scope | Depends On | Est |
|----|-------|-------|------------|-----|
| tests | enforcer | src/lib/claude/prompts/*.test.ts | prompts, api-routes | 45m |
| build | enforcer | — | ui-*, tests | 15m |

## Dependency Graph

```
db-schema (alchemist)
    │
    └── api-types (smith)
            │
            ├── prompts (smith-1) ────────────────────┐
            │                                          │
            ├── api-routes (smith-2) ─────────────────┤
            │                                          │
            ├── ui-role-selector (shaper-1)            │
            │       │                                  │
            │       └── ui-dashboard (shaper-2) ───────┤
            │                                          │
            └── ui-session (shaper-3) ─────────────────┘
                                                       │
                                              tests + build (enforcer)
```

## Task Details

### db-schema
- **Title**: Add RoleMode enum and roleMode field to Session model
- **Agent**: alchemist
- **Scope**: `prisma/schema.prisma`
- **Acceptance**:
  - `RoleMode` enum defined with `THERAPIST` (default) and `CLIENT`
  - `roleMode RoleMode @default(THERAPIST)` added to Session model
  - `prisma migrate dev` runs successfully
  - `prisma generate` produces updated client types

### api-types
- **Title**: Add RoleMode, ClientDebrief types; update SessionData
- **Agent**: smith
- **Scope**: `src/types/index.ts`
- **Acceptance**:
  - `RoleMode` exported as `'THERAPIST' | 'CLIENT'`
  - `ClientDebrief` interface defined with emotional debrief fields
  - `SessionData` has `roleMode: RoleMode`
  - `MessageRole` extended with `'therapist'` alias (for display only)
  - TypeScript compiles without errors

### prompts
- **Title**: Create therapist-prompt, debrief-prompt; update agent functions to branch on roleMode
- **Agent**: smith-1
- **Scope**: `src/lib/claude/prompts/therapist-prompt.ts` (new), `src/lib/claude/prompts/debrief-prompt.ts` (new), `src/lib/claude/patient-agent.ts` (update), `src/lib/claude/supervisor-agent.ts` (update)
- **Acceptance**:
  - `buildTherapistPrompt(persona)` returns a psychologist system prompt referencing persona's disorder profile as the treatment focus
  - `buildDebriefPrompt(persona, messages)` returns an emotional debrief prompt
  - `getOpeningStatement` accepts `roleMode`; in CLIENT mode calls `getTherapistOpening`
  - `streamPatientResponse` accepts `roleMode`; uses therapist system prompt in CLIENT mode
  - `generateFeedback` accepts `roleMode`; returns `ClientDebrief` in CLIENT mode, `SupervisorFeedback` in THERAPIST mode

### api-routes
- **Title**: Update session start/end/message routes to accept and pass roleMode
- **Agent**: smith-2
- **Scope**: `src/app/api/session/start/route.ts`, `src/app/api/session/end/route.ts`, `src/app/api/session/message/route.ts`
- **Acceptance**:
  - `POST /api/session/start` accepts `roleMode` field, defaults to `'THERAPIST'`; stores in DB; returns correct opening message per mode
  - `POST /api/session/end` reads `session.roleMode` from DB; passes to `generateFeedback`
  - `POST /api/session/message` reads `session.roleMode`; passes to stream function

### ui-role-selector
- **Title**: Create RoleModeSelector component
- **Agent**: shaper-1
- **Scope**: `src/components/simulation/RoleModeSelector.tsx`
- **Acceptance**:
  - Modal or inline overlay with two clear mode options: CLIENT and THERAPIST
  - Each option shows title, description, and icon
  - On selection, calls `onSelect(mode)` callback and closes
  - On dismiss, calls `onClose()` callback
  - Keyboard accessible

### ui-dashboard
- **Title**: Update PersonaCard to show mode selector; add role badge to session history
- **Agent**: shaper-2
- **Scope**: `src/components/simulation/PersonaCard.tsx`, `src/app/dashboard/page.tsx`
- **Acceptance**:
  - Clicking "Start Session" on PersonaCard shows RoleModeSelector instead of immediately starting
  - After mode selection, session starts with chosen `roleMode`
  - Dashboard history shows role badge ("🩺 Therapist" or "🎭 Client") per session row

### ui-session
- **Title**: Update session page, SimulationChat, and FeedbackReport for roleMode
- **Agent**: shaper-3
- **Scope**: `src/app/session/[id]/page.tsx`, `src/components/simulation/SimulationChat.tsx`, `src/components/feedback/FeedbackReport.tsx`
- **Acceptance**:
  - `session/[id]/page.tsx` reads `session.roleMode`, passes to both `SimulationChat` and `FeedbackReport`
  - `SimulationChat` shows correct placeholder and AI message label per mode (CLIENT: "Share what's on your mind..." / "Psychologist"; THERAPIST: "Type your response as the therapist..." / persona name)
  - `FeedbackReport` renders CTS-R competency view for THERAPIST mode; renders emotional debrief view for CLIENT mode

### tests
- **Title**: Write and pass unit tests for new prompts and mode branching
- **Agent**: enforcer
- **Scope**: `src/lib/claude/prompts/therapist-prompt.test.ts`, `src/lib/claude/prompts/debrief-prompt.test.ts`
- **Acceptance**: All tests pass with `npm test`

### build
- **Title**: Confirm TypeScript and Next.js build succeed
- **Agent**: enforcer
- **Acceptance**: `npx tsc --noEmit` and `npm run build` succeed without errors

## Progress

| Task | Status | Agent | Tests | Commit | Notes |
|------|--------|-------|-------|--------|-------|
| db-schema | ✓ Done | alchemist | ✓ Pass | 4ca16fa | RoleMode enum + migration applied |
| api-types | ✓ Done | smith | ✓ Pass | 4ca16fa | RoleMode, ClientDebrief, SessionData |
| prompts | ✓ Done | smith-1 | ✓ Pass | c8f9a20 | therapist-prompt + debrief-prompt + agent updates |
| api-routes | ✓ Done | smith-2 | ✓ Pass | c8f9a20 | start/end/message routes roleMode-aware |
| ui-role-selector | ✓ Done | shaper-1 | ✓ Pass | c8f9a20 | RoleModeSelector.tsx |
| ui-dashboard | ✓ Done | shaper-2 | ✓ Pass | c8f9a20 | PersonaCard → selector, history badge |
| ui-session | ✓ Done | shaper-3 | ✓ Pass | c8f9a20 | SimulationChat + FeedbackReport mode-aware |
| tests | ✓ Done | enforcer | ✓ Pass (18/18) | 4ca16fa | node:test + tsx/cjs runner |
| build | ✓ Done | enforcer | ✓ Pass | c8f9a20 | commits clean, tsc silent |

## Current Session

**Phase:** COMPLETE
**Active:** —
**Working on:** —
**Next:** /audit-spec @2026-05-16-authenticated-simulation-flow

## Decisions

- `roleMode` defaults to `THERAPIST` — backward compatible; existing sessions behave as before
- DB `message.role` stays as `student` / `patient` — these are structural identifiers, not display labels; display adapts per `roleMode`
- `ClientDebrief` is a distinct type from `SupervisorFeedback`; both stored as JSON in the same `feedback` column
- Same five personas reused in both modes; no new persona data needed

## Risk Areas

- **Prisma migration on production Supabase** — migration must run via `DIRECT_URL` with pgBouncer bypass; already configured in `.env`
- **Backward compat for existing sessions** — `roleMode` defaults to `THERAPIST`, existing rows will get `THERAPIST` after migration
- **FeedbackReport type narrowing** — feedback JSON column stores either structure; must discriminate on `roleMode` not on JSON shape
