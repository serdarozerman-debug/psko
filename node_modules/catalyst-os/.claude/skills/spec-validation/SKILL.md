# Spec Validation

> **When to invoke:** When running validation checks on a completed implementation.
> **Invoked by:** `/audit-spec` command.
> **Orchestrator:** Arbiter agent.
>
> **Lifecycle position:** `/catalyze-spec` → `/forge-spec` → **`/audit-spec`** → `/seal-spec`
>
> This skill audits the CODE implementation (quality, security, tests) — not the spec document.

## Purpose

Orchestrate comprehensive validation: TDD compliance, unit tests, E2E tests, code quality, and security scanning.

## Skills Referenced

- `verification-before-completion` — All validation must produce evidence
- `agent-delegation` — Parallel agent spawning rules
- `test-driven-development` — TDD compliance verification

## Prerequisites — BLOCKING

Before ANY validation begins, verify the spec was actually built:

1. **tasks.md must exist** in the spec folder
   - IF NOT FOUND → STOP: "No tasks.md found. Run `/forge-spec @{slug}` first."
2. **Spec status must be IN_PROGRESS or later** (not DRAFT)
   - IF DRAFT → STOP: "Spec is still in DRAFT. Run `/forge-spec @{slug}` to implement it first."
3. All tasks in `tasks.md` marked complete
4. TDD compliance verified (tests pass)

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── validation.md     # Arbiter creates (this phase)
├── handoff.md        # Arbiter creates (on success)
└── ...existing files
```

## TDD Compliance Check (FIRST!)

```
Before validation begins, verify TDD was followed:

1. Check tasks.md has test locations for each task
2. Verify all tests pass
3. Verify tests were written before implementation

If TDD was skipped → REJECT and return to /forge-spec
```

## Parallel Execution

```
TDD Check (sequential, must pass first)
        |
        v
[Enforcer + Sentinel + Inquisitor + Watcher] (all parallel)
        |
        v
Arbiter compiles results → validation.md
        |
        v (if all pass)
Arbiter generates handoff.md
```

## Workflow

### Phase 0: TDD Compliance (BLOCKING)

Read tasks.md, verify each task has tests, run all tests. If not compliant → BLOCK.

### Phase 1-4: Validation (PARALLEL)

Spawn all Guardians in parallel:

**Enforcer** (Unit Tests):
- Run all unit tests
- Check coverage thresholds
- Verify test quality

**Sentinel** (E2E Tests):
- Run full E2E test suite
- Test user flows
- Capture screenshots on failure

**Inquisitor** (Code Quality + Simplification):
- Run linters
- Code review checks
- Documentation gaps
- **Code simplification suggestions** (unnecessary abstractions, over-engineering, dead code, verbose patterns)
- Simplifications must NOT change behavior — only structure
- Provide before/after snippets for each suggestion

**Watcher** (Security):
- Dependency audit
- Secret scanning
- Input validation checks

**Alchemist** (Schema Integrity — only for specs touching database):
- Query actual database schema for all tables the spec touches
- Verify column names in spec/code match real database columns
- Verify all foreign keys and constraints exist in the actual DB
- Verify API endpoints persist all fields the spec expects (end-to-end trace)
- Verify any SQL functions/stored procedures the feature depends on actually exist
- Check for missing sequences, triggers, or DB-level defaults the feature assumes

### Phase 5: Compile Results (Arbiter)

Create `validation.md` with results from all Guardians.

### Phase 6: Generate handoff.md (On Success)

If all validation passes, create handoff.md with:
- Summary of what was built
- Key decisions and reasoning
- Files modified
- How to test
- Edge cases and gotchas
- Follow-up items

## Validation Template

```markdown
# Validation: {Feature Name}

## TDD Compliance
- [x] Tests written before implementation
- [x] All tasks have tests
- [x] All tests pass

## Test Results
### Unit Tests (Enforcer)
- Total: N, Passing: N, Coverage: X%

### E2E Tests (Sentinel)
- Total: N, Passing: N

## Quality Checks
### Lint & Simplification (Inquisitor)
- Lint Status: PASS/FAIL, Errors: N, Warnings: N
- Simplification Opportunities: N found

### Security (Watcher)
- Dependencies: status
- Secrets: status
- Inputs: status

### Schema Integrity (Alchemist) — if spec touches database
- Column names match: status
- Constraints verified: status
- API end-to-end trace: status
- DB functions/sequences: status

## Overall Status: PASS/FAIL

## Issues Found
| Issue | Severity | Resolution |
|-------|----------|------------|
```

## Output

### Success
```
Validation complete!
Status: READY FOR APPROVAL
Next: /seal-spec @slug
```

### TDD Failure
```
Validation blocked!
TDD Compliance: FAILED
Action: Return to /forge-spec and follow TDD process
```

### Validation Failure
```
Validation failed!
Failed Checks: [details]
Action: Fix issues and re-run /audit-spec
```
