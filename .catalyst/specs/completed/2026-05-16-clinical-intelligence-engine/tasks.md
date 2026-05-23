# Tasks: Clinical Intelligence Engine

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
| clinical-frameworks | smith-1 | src/lib/clinical/frameworks/**, src/lib/clinical/intake/**, src/lib/clinical/phase-engine/** | src/types/index.ts | api-types | 1.5h |
| api-routes | smith-2 | src/app/api/intake/**, src/app/api/session/[id]/phase/**, src/app/api/session/start/route.ts, src/app/api/session/message/route.ts | src/lib/clinical/**, src/types/** | api-types | 1h |

### Phase 4: Parallel Frontend (shaper × 2)

| ID | Agent | Scope | Reads | Depends On | Est |
|----|-------|-------|-------|------------|-----|
| ui-intake | shaper-1 | src/components/intake/**, src/app/dashboard/page.tsx | src/types/index.ts, src/lib/clinical/intake/** | clinical-frameworks | 1h |
| ui-session-panel | shaper-2 | src/components/simulation/SessionGuidancePanel.tsx, src/components/simulation/SimulationChat.tsx | src/types/index.ts, src/app/api/session/[id]/phase/** | api-routes | 45m |

### Phase 5: Tests + Build (Sequential)

| ID | Agent | Scope | Depends On | Est |
|----|-------|-------|------------|-----|
| tests | enforcer | src/lib/clinical/**/*.test.ts | clinical-frameworks | 30m |
| build | enforcer | — | ui-*, tests | 15m |

## Dependency Graph

```
db-schema (alchemist)
    │
    └── api-types (smith)
            │
            ├── clinical-frameworks (smith-1) ──────────────┐
            │                                               │
            ├── api-routes (smith-2) ──────────────────────┤
            │                                               │
            ├── ui-intake (shaper-1) ─────────────────────┤
            │                                               │
            └── ui-session-panel (shaper-2) ────────────────┘
                                                            │
                                                   tests + build
```

## Progress

| Task | Status | Agent | Tests | Commit | Notes |
|------|--------|-------|-------|--------|-------|
| db-schema | ✅ Done | alchemist | — | 8aac032 | IntakeResponse + currentPhase in schema.prisma |
| api-types | ✅ Done | smith | — | 8aac032 | src/types/index.ts |
| clinical-frameworks | ✅ Done | smith-1 | ✅ | 8aac032 | frameworks/, intake/, phase-engine/ |
| api-routes | ✅ Done | smith-2 | — | 8aac032 | intake/analyze + session/phase (GET+POST) |
| ui-intake | ✅ Done | shaper-1 | — | 8aac032 | src/components/intake/IntakeFlow.tsx |
| ui-session-panel | ✅ Done | shaper-2 | — | 8aac032 | src/components/simulation/SessionGuidancePanel.tsx |
| tests | ✅ Done | enforcer | ✅ | 8aac032 | detect-phase.test.ts + validate-transition.test.ts |
| build | ✅ Done | enforcer | — | — | Deployed to Vercel |

## Synced
**Date:** 2026-05-23
**Method:** /sync-project (batch archive)

## Decisions

- Intake is OPTIONAL — sessions without intake default to existing static guidance behavior
- Phase detection: turn-count based (simple, no API cost) with `currentPhase` stored on Session
- Content-aware phase detection deferred to a future enhancement (avoids per-turn API calls)
- `IntakeResponse` stored independently; linked to session at start time
- Clinical frameworks live in `src/lib/clinical/` alongside existing `src/lib/approaches/` (both kept for backward compat)
- The `ApproachConfig` interface is extended with optional `phases?: ProtocolPhase[]`
