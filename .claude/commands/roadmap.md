# /roadmap

Create or update the project roadmap with spec-grouped entries and actionable next commands.

## Usage

```
/roadmap              # Create new or update existing
/roadmap "Q1 focus"   # Update with specific direction
```

## Workflow

1. **Read** `.catalyst/main/mission.md` for context
2. **Read existing** `.catalyst/main/roadmap.md` if present
3. **Scan specs** in `.catalyst/specs/` to determine current state of each spec
4. **Analyze** codebase for current feature state
5. **Ask** about priorities and timeline:
   - What's most important right now?
   - What's blocking progress?
   - What's the target timeline?
6. **Resolve commands** for each spec entry (see Command Resolution below)
7. **Create/Update** the roadmap using the template at `.catalyst/main/temp/temp-roadmap.md`

## Command Resolution

The canonical spec workflow is: `/catalyze-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`

For each spec entry in the roadmap, determine the next action based on its state:

| Spec State | How to Detect | Next Command |
|------------|---------------|--------------|
| Not yet created | Only exists in roadmap, no spec folder | `!/catalyze-spec "{seed prompt}"` |
| DRAFT | `spec.md` exists, no `tasks.md` | `!/forge-spec @{slug}` or `!/forge-spec-worktree @{slug}` |
| IN_PROGRESS | `tasks.md` exists, build ongoing | `!/audit-spec @{slug}` |
| VALIDATING | `validation.md` exists | `!/seal-spec @{slug}` |
| COMPLETE | `handoff.md` exists with sealed status | No command (show checkmark) |

> **Worktree tip:** Use `!/forge-spec-worktree` when another spec is already in progress on the current branch, or when file scopes might collide between concurrent specs.

### Detection Logic

For each spec entry, check `.catalyst/specs/{slug}/`:

```
IF no folder exists for this entry:
  → Status: Planned | Command: !/catalyze-spec "{seed prompt}"

ELSE IF spec.md exists BUT tasks.md does NOT:
  → Status: DRAFT | Command: !/forge-spec @{slug} (or !/forge-spec-worktree @{slug})

ELSE IF tasks.md exists BUT validation.md does NOT:
  → Status: IN_PROGRESS | Command: !/audit-spec @{slug}

ELSE IF validation.md exists BUT not sealed:
  → Status: VALIDATING | Command: !/seal-spec @{slug}

ELSE (sealed):
  → Status: COMPLETE | Command: (none)
```

## Output Format

`.catalyst/main/roadmap.md` — uses the structure defined in `.catalyst/main/temp/temp-roadmap.md`

Specs are grouped within time-horizon sections:
- **Short-Term (1-3 months)** — immediate priorities
- **Medium-Term (3-6 months)** — next wave of work
- **Long-Term Vision (6+ months)** — strategic goals, not yet ready for specs
