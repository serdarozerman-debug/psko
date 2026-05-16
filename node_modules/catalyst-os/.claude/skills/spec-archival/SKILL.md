# Spec Archival

> **When to invoke:** When archiving a spec without git ceremony.
> **Invoked by:** `/archive-spec` command.

## Purpose

Lightweight spec completion: move to completed folder, check for library patterns, update status. No TDD verification, no git branch checks, no commit creation, no push suggestions.

> **For full ceremony with git management:** Use `/seal-spec` instead.
>
> **Flow:** `/catalyze-spec` → `/forge-spec` → `/audit-spec` → **`/archive-spec`** (you are here)

## Skills Referenced

- `verification-before-completion` — Verify spec folder exists before archiving

## Workflow

### Phase 1: Read Spec and Verify

1. Read spec.md to understand what's being archived
2. Read tasks.md to understand current progress (if exists)
3. Verify spec folder exists in `.catalyst/specs/`
   - IF NOT FOUND → STOP: "Spec not found: @{slug}"

4. Check spec readiness:
   - **DRAFT** (no tasks.md): Ask user — "This spec was never built. Archive a draft?"
   - **IN_PROGRESS** (tasks incomplete): Ask user — "Some tasks are incomplete. Archive anyway?"
   - **VALIDATING or later**: Proceed without confirmation

### Phase 2: Update tasks.md

1. Mark tasks that are actually done as complete (check git history, file existence, test results)
2. Leave incomplete tasks as-is — they stay open for visibility

### Phase 3: Library Extraction (Optional)

Auto-detect reusable patterns from spec name/content using keyword matching:

| Pattern Keywords | Suggested Library Item |
|-----------------|----------------------|
| stripe, payment | payment-integration.md |
| auth, oauth, login | authentication.md |
| upload, s3, storage | file-storage.md |
| websocket, realtime | real-time-communication.md |
| email, notification | notifications.md |
| search, elasticsearch | search-implementation.md |
| cache, redis | caching-strategy.md |
| queue, job, worker | background-jobs.md |

Ask user if spec should be added to pattern library. If yes, delegate to Scribe for extraction to `.catalyst/library/`.

### Phase 4: Archive

1. Move spec folder:
   ```
   .catalyst/specs/{slug}/ → .catalyst/specs/completed/{slug}/
   ```
2. Update spec.md frontmatter status to `complete`
3. Add completion date to frontmatter

## Output

```
Spec archived!

Spec: {slug}
Status: COMPLETE

Archived to: .catalyst/specs/completed/{slug}/

Library: {Added to .catalyst/library/X.md | Skipped}

Note: This was a lightweight archive (no git ceremony).
For full commit + branch management, use /seal-spec.
```
