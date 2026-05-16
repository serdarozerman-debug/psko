# Project Sync

> **When to invoke:** When syncing spec statuses with reality across the project.
> **Invoked by:** `/sync-project` command.

## Purpose

Scan all active specs, detect which ones are actually complete, update their tasks.md, and move finished specs to the completed folder. This is a housekeeping command for catching up when `/audit-spec` and `/seal-spec` were skipped.

## Skills Referenced

- `verification-before-completion` — Verify actual state before marking complete

## Workflow

### Phase 1: Scan Active Specs

1. List all folders in `.catalyst/specs/` (excluding `completed/`)
2. For each spec, read:
   - `spec.md` — status and requirements
   - `tasks.md` — task progress (if exists)
   - `validation.md` — validation results (if exists)

### Phase 2: Detect Actual State

For each spec, determine real status by checking:

1. **Git history** — Are there commits referencing this spec?
2. **Test results** — Do tests pass for this spec's scope?
3. **File existence** — Are the expected implementation files present?
4. **tasks.md progress** — Are tasks marked complete?

Classify each spec:

| Detected State | Criteria |
|---------------|----------|
| **Stale/Abandoned** | No commits in 30+ days, incomplete tasks |
| **Complete (unarchived)** | All tasks done, tests pass, but still in active specs |
| **In Progress** | Some tasks done, recent activity |
| **Draft** | spec.md exists but no tasks.md or implementation |

### Phase 3: Present Findings

Show the user a summary:

```
PROJECT SYNC REPORT
===================

SPECS READY TO ARCHIVE (complete but not moved):
  ✅ 2026-01-11-user-auth — All 8 tasks done, tests passing
  ✅ 2026-02-15-stripe-integration — All 6 tasks done, tests passing

SPECS IN PROGRESS:
  🚧 2026-03-01-notifications — 4/7 tasks done
  🚧 2026-03-15-search — 2/5 tasks done

STALE SPECS (no activity in 30+ days):
  ⚠️  2026-01-05-legacy-migration — 0/3 tasks done, last commit 45 days ago

DRAFTS (not yet built):
  📋 2026-04-01-admin-dashboard — spec.md only, no tasks.md
```

Ask user: "Which specs should I archive?"

### Phase 4: Archive Confirmed Specs

For each spec the user confirms:

1. Update `tasks.md`:
   - Mark remaining in-progress tasks as complete (if work is done)
   - Add sync note:
     ```markdown
     ## Synced
     **Date:** YYYY-MM-DD
     **Method:** /sync-project (batch archive)
     ```

2. Update `spec.md` status to `complete`

3. Move to completed:
   ```
   .catalyst/specs/{slug}/ → .catalyst/specs/completed/{slug}/
   ```

4. Check for library extraction (same keyword matching as `/archive-spec`)

### Phase 5: Update Roadmap (Optional)

If `.catalyst/main/roadmap.md` exists:
1. Update status of archived specs to COMPLETE
2. Update command sections for completed specs

## Output

```
Project synced!

Archived: 2 specs
├── 2026-01-11-user-auth → .catalyst/specs/completed/
└── 2026-02-15-stripe-integration → .catalyst/specs/completed/

Skipped: 2 specs (still in progress)
├── 2026-03-01-notifications (4/7 tasks)
└── 2026-03-15-search (2/5 tasks)

Flagged: 1 stale spec
└── 2026-01-05-legacy-migration (no activity 45 days)

Library: Added authentication.md, payment-integration.md

Roadmap: Updated .catalyst/main/roadmap.md
```
