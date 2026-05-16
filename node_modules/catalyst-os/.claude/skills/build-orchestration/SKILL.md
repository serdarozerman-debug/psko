# Build Orchestration

> **When to invoke:** When implementing a specification using strict TDD.
> **Invoked by:** `/forge-spec` or `/forge-spec-worktree` command.
> **Orchestrator:** Forge-Master agent.

## Purpose

Orchestrate the full build workflow: task breakdown, test writing, foundation, contracts, parallel implementation, and integration — all following strict TDD.

## Skills Referenced

- `test-driven-development` — Enforcer uses during red/green phases
- `agent-delegation` — Orchestrator follows delegation and verification rules
- `verification-before-completion` — All agents verify before claiming done
- `systematic-debugging` — Builder agents use when tests fail

## Prerequisites

- Spec must exist in `.catalyst/specs/`
- `spec.md` must be complete
- No unresolved "Open Questions"

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # Already exists from /catalyze-spec
├── research.md       # Already exists from /catalyze-spec
├── tasks.md          # Forger creates (this phase)
├── validation.md     # Arbiter creates (in /audit-spec)
├── handoff.md        # Updated throughout
└── assets/
```

## Git Workflow

```
PHASE 0: Setup
├── Read .catalyst/main/project-config.yaml
├── IF --worktree flag:
│   ├── mkdir -p {worktree_path}
│   ├── git worktree add {worktree_path}/{spec-slug} -b {branch_prefix}/{spec-slug} {development_branch}
│   ├── cd {worktree_path}/{spec-slug}
│   └── Record worktree path in spec's handoff.md
├── ELSE (default):
│   ├── Checkout to development_branch (default: main)
│   └── Create branch: {branch_prefix}/{spec-slug}

GATE 1: RED FLAG
└── Commit: "test({scope}): write failing tests for {spec}"

GATE 2: GREEN FLAG
└── Commit: "feat({scope}): implement {spec}"
```

## TDD IS MANDATORY — NO EXCEPTIONS

```
The build MUST follow this exact sequence:

1. Task(subagent_type="forger")    -> Create tasks.md
2. Task(subagent_type="enforcer")  -> Write ALL tests (must FAIL)
3. Verify                          -> Run tests, confirm RED
4. Task(subagent_type="smith/shaper/alchemist") -> Implement until GREEN
```

## Execution Order (DAG-Based)

```
Phase 1: Forger (task breakdown → tasks.md with Build DAG)
              |
Phase 2: Enforcer (write ALL failing tests)
              |
         GATE 1: RED PHASE — All tests must FAIL
              |
Phase 3: Foundation (Alchemist — sequential)
              |
         GATE 2: Foundation tests pass
              |
Phase 4: Contracts (Smith — shared types, sequential)
              |
         GATE 3: Type-check passes
              |
Phase 5: Parallel Implementation (Smith × N + Shaper × M)
         [scope-isolated parallel agents]
              |
         GATE 4: GREEN PHASE — All tests must PASS
              |
Phase 6: Integration (Enforcer — cross-boundary tests)
```

### Parallel Execution Rules

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Task Breakdown | Forger | No (creates DAG first) |
| Test Writing | Enforcer | No (must complete before impl) |
| Foundation | Alchemist | No (DB schema first) |
| Contracts | Smith (single) | No (shared types before parallel) |
| Implementation | Smith × N + Shaper × M | **Yes — multiple instances** |
| Integration | Enforcer | No (after all parallel complete) |

**Multi-Instance Rules:**
- Each parallel agent has exclusive scope (files it can write)
- Each parallel agent has read-only access to shared types
- Scopes MUST NOT overlap
- Spawn all ready agents in ONE message

## Workflow Detail

### Phase 0: Git Setup

1. Read `project-config.yaml` for `development_branch`, `branch_prefix`, and `worktree_path`
2. IF `--worktree` flag (from `/forge-spec-worktree`):
   - `mkdir -p {worktree_path}` (default: `.catalyst/worktrees`)
   - `git worktree add {worktree_path}/{spec-slug} -b {branch_prefix}/{spec-slug} {development_branch}`
   - `cd {worktree_path}/{spec-slug}` — all subsequent work happens here
   - Record `worktree: {worktree_path}/{spec-slug}` in the spec's `handoff.md`
3. ELSE (default — branch checkout):
   - Checkout development branch and pull
   - Create spec feature branch: `{branch_prefix}/{spec-slug}`

### Phase 1: Task Breakdown (Forger)

Spawn Forger → creates `tasks.md` with Build DAG including phases, scope boundaries, dependencies, and parallel opportunities.

### Phase 2: Write Tests (Enforcer) — RED PHASE

Spawn Enforcer → writes failing tests for ALL tasks. Run tests to confirm all FAIL.

### GATE 1: Red Phase Verification — BLOCKING

```
THIS IS A HARD GATE. DO NOT PROCEED UNTIL ALL 3 STEPS COMPLETE:

  1. RUN all tests → confirm every test FAILS
  2. If ANY test passes → STOP and fix before continuing
  3. COMMIT the failing tests → this is the checkpoint

COMMIT: "test({scope}): write failing tests for {spec}"

Only AFTER this commit exists may implementation begin.
No commit = no implementation. No exceptions.
```

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

- Every task has at least one test
- All tests executed
- All tests FAIL (for the right reasons — missing feature, not import errors)
- Commit is the proof that red phase happened

### Phase 3-4: Foundation & Contracts

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

Spawn Alchemist (foundation) → WAIT → Spawn Smith (contracts) → WAIT

### Phase 5: Parallel Implementation

Spawn ALL ready agents in ONE message with scope boundaries:
```
Each agent prompt includes:
- SCOPE (write): exclusive files
- READS (no modify): shared files
- Requirements from tasks.md
- Test references
```

### GATE 2: Green Phase Verification — BLOCKING

```
THIS IS A HARD GATE. DO NOT PROCEED UNTIL ALL 3 STEPS COMPLETE:

  1. RUN all tests → confirm every test PASSES
  2. If ANY test fails → fix before continuing
  3. COMMIT the implementation → this is the checkpoint

COMMIT: "feat({scope}): implement {spec}"

Only AFTER this commit exists may integration begin.
```

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

### Phase 6: Integration

> **Context checkpoint:** If context is getting long, compact now. All state is in `tasks.md`.
> Run `/primer-spec @{slug}` in a new conversation to resume.

Spawn Enforcer for cross-boundary integration tests.

## Implementation Rules

```
FOR EACH TASK:
1. Verify test exists and FAILS
2. Write MINIMAL code to make test pass
3. Run test → must PASS
4. Refactor if needed
5. Run test → must still PASS
6. Update tasks.md Progress — THE AGENT DOING THE WORK MUST DO THIS

NEVER write code without a failing test first
NEVER write more code than needed to pass the test
NEVER modify files outside your SCOPE
NEVER report done without updating tasks.md first
```

### tasks.md Update Responsibility

**Every agent (smith, shaper, alchemist, enforcer) MUST update tasks.md before reporting back.**
The orchestrator (forge-master) verifies and fills gaps, but agents are the primary updaters.
This ensures `/primer-spec` always reflects actual progress, even if the orchestrator loses context.

## Failure Modes

| Failure | Action |
|---------|--------|
| Tests pass before implementation | STOP — fix tests (testing wrong thing) |
| Implementation starts without tests | STOP — delete code, return to Phase 2 |
| Scope violation detected | STOP agent, revert, re-run with stricter prompt |
| Parallel agents conflict | STOP build, revert, restructure DAG |
| Dependency deadlock | STOP all, report to user, restructure DAG |
