# /status-spec

Check the current status of a spec and sync progress with reality.

## Usage

```
/status-spec @2025-11-29-stripe-integration
```

## Pre-computed Context

```bash
# Current git state
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== DIFF STAT ===" && git diff --stat
echo "=== RECENT COMMITS ===" && git log --oneline -10
echo "=== SPEC FILES ===" && ls .catalyst/specs/*$ARGUMENTS*/ 2>/dev/null || echo "No spec found for: $ARGUMENTS"
echo "=== TASKS.MD ===" && cat .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null | head -80 || echo "No tasks.md"
echo "=== SPEC STATUS ===" && head -20 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
```

---

## Purpose

Resume work on a spec after being away. This command:
1. Reads spec files to understand the feature
2. Checks git to see actual progress
3. Syncs tasks.md with reality
4. Gives you a clear "where we are" summary

Use the pre-computed context above — do NOT re-run these commands. Only run additional commands if specific details are missing.

---

## Workflow

### Phase 1: Read Spec State

Read all spec files (use pre-computed context first, read full files only if needed):
- `spec.md` → Feature overview, requirements, status
- `tasks.md` → Task breakdown, marked progress
- `research.md` → Context and decisions made
- `validation.md` → If validation has run

### Phase 2: Check Git Reality

Use pre-computed git context. Only run additional commands if needed:

```bash
# Additional detail if needed
git log --oneline -10 --grep="{slug}"
```

### Phase 3: Reconcile Tasks

Compare tasks.md with git reality:

1. **Find completed work not marked:**
   - Files created/modified that match task descriptions
   - Tests written for tasks
   - Mark these tasks as done in tasks.md

2. **Find in-progress work:**
   - Uncommitted changes related to tasks
   - Partially implemented features

3. **Update tasks.md automatically:**
   - Mark completed tasks as `[x]`
   - Add notes about in-progress work
   - Update Progress table
   - Add to Changelog

### Phase 4: Generate Status Report

Output a clear summary:

```
STATUS: {spec-slug}

Feature: {name from spec.md}
Phase: {DRAFT | BUILDING | VALIDATING | COMPLETE}
Last Activity: {date from git log or file modification}

PROGRESS
--------
Requirements: {X}/{Y} defined
Tasks: {completed}/{total} ({percent}%)
Tests: {passing}/{total}

COMPLETED TASKS
---------------
[x] T-001: Create subscription schema
[x] T-002: Add migration for plans table
    ^ Files: src/db/schema.ts, migrations/001_subscriptions.sql

IN PROGRESS
-----------
[ ] T-003: Create Stripe service wrapper
    ^ Modified: src/services/stripe.ts (uncommitted)
    ^ 45 lines added, 3 lines removed

UNCOMMITTED CHANGES
-------------------
M  src/services/stripe.ts
M  src/api/subscriptions.ts
A  src/__tests__/stripe.test.ts

RECENT COMMITS
--------------
abc1234 feat(stripe): add subscription schema
def5678 feat(stripe): create plans migration
ghi9012 test(stripe): add schema tests

NEXT STEPS
----------
1. Complete T-003 (Stripe service wrapper)
2. Commit current changes
3. Continue with T-004 (API endpoints)

TASKS.MD UPDATED
----------------
- Marked T-001 as complete (found schema.ts)
- Marked T-002 as complete (found migration)
- Added note to T-003: "In progress - stripe.ts modified"
```

---

## Task Detection Logic

### Detecting Completed Tasks

A task is likely complete if:
- Related test file exists AND passes
- Implementation file exists with substantial code
- Git history shows commit mentioning the task ID
- Related files haven't been modified recently (stable)

### Detecting In-Progress Tasks

A task is likely in progress if:
- Related files are modified but uncommitted
- Related files committed recently but no tests yet
- Partial implementation detected

### File-to-Task Matching

Match files to tasks by:
- Task description keywords → file names
- Task ID in commit messages
- File paths mentioned in task notes
- Common patterns (e.g., "Create X service" → `x.service.ts`)

---

## Output Examples

### Early Stage (Planning)
```
STATUS: 2025-11-29-stripe-integration

Feature: Stripe Subscription Integration
Phase: DRAFT (planning)
Last Activity: 2 days ago

PROGRESS
--------
Requirements: 8/8 defined
Tasks: 0/7 (not started)
Tests: N/A

NEXT STEPS
----------
1. Run /forge-spec to start implementation
2. Forger will create task breakdown
3. Enforcer will write tests first (TDD)
```

### Mid-Build
```
STATUS: 2025-11-29-stripe-integration

Feature: Stripe Subscription Integration
Phase: BUILDING
Last Activity: 3 hours ago

PROGRESS
--------
Requirements: 8/8 defined
Tasks: 3/7 (43%)
Tests: 15/45 passing

COMPLETED TASKS
---------------
[x] T-001: Create subscription schema
[x] T-002: Add migration for plans table
[x] T-003: Create Stripe service wrapper

IN PROGRESS
-----------
[ ] T-004: Implement subscription endpoints
    ^ Modified: src/api/subscriptions.ts (uncommitted)

UNCOMMITTED CHANGES
-------------------
M  src/api/subscriptions.ts
M  src/services/stripe.ts
A  src/__tests__/subscriptions.test.ts

NEXT STEPS
----------
1. Complete T-004 implementation
2. Run tests: npm test
3. Commit when tests pass
4. Continue with T-005 (Frontend)
```

### Validation Stage
```
STATUS: 2025-11-29-stripe-integration

Feature: Stripe Subscription Integration
Phase: VALIDATING
Last Activity: 1 hour ago

PROGRESS
--------
Requirements: 8/8 fulfilled
Tasks: 7/7 (100%)
Tests: 45/45 passing

VALIDATION STATUS
-----------------
[x] Unit tests: 45/45
[x] E2E tests: 12/12
[x] Lint: passed
[ ] Security scan: pending
[ ] Code review: pending

NEXT STEPS
----------
1. Complete validation: /audit-spec @slug
2. Review handoff.md when ready
3. Commit: /seal-spec @slug
```

---

## Handling Edge Cases

### No tasks.md Yet
```
STATUS: 2025-11-29-stripe-integration

Feature: Stripe Subscription Integration
Phase: DRAFT (spec complete, not built)

tasks.md not found - implementation hasn't started.

NEXT STEPS
----------
Run /forge-spec @2025-11-29-stripe-integration to begin.
```

### Uncommitted Work Not Matching Any Task
```
UNCOMMITTED CHANGES (untracked)
-------------------------------
M  src/utils/helpers.ts
M  README.md

These files don't match any task in tasks.md.
Consider: Are these related to the spec or separate work?
```

### Stale Spec (No Recent Activity)
```
STATUS: 2025-11-29-stripe-integration

Feature: Stripe Subscription Integration
Phase: BUILDING (stale)
Last Activity: 14 days ago

WARNING: No activity for 2 weeks.
- 3 tasks were in progress
- Uncommitted changes may be outdated

RECOMMENDATION
--------------
1. Review uncommitted changes
2. Check if dependencies have changed
3. Run tests to verify current state
4. Consider: /update-spec if requirements changed
```
