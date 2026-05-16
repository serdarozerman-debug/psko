# Spec Update

> **When to invoke:** When updating an existing specification with new requirements, scope changes, or clarifications.
> **Invoked by:** `/update-spec` command.

## Purpose

Update spec documentation (requirements, tasks, research) without continuing to build.

## Skills Referenced

- `brainstorming` — Oracle uses if requirements need discussion
- `agent-delegation` — Orchestrator rules for spawning agents

## Update Types

| Type | Description | Agents |
|------|-------------|--------|
| **Expand** | Add new requirements | Oracle → Scribe → Forger |
| **Shrink** | Remove requirements | Scribe → Forger |
| **Clarify** | Refine existing requirements | Oracle → Scribe |
| **Research** | Add new technical findings | Scout/Seer → Scribe |
| **Replan** | Restructure tasks | Forger |

## Workflow

### Phase 1: Assess Current State

1. Read spec.md, tasks.md, research.md
2. Determine spec phase: DRAFT, IN_PROGRESS, or COMPLETE
3. Classify the update type

**If COMPLETE:** Cannot update — suggest new spec or reopen.

### Phase 2: Gather Requirements (If Expanding/Clarifying)

Spawn Oracle if requirements need discussion.

### Phase 3: Update Documentation (Scribe)

Spawn Scribe to update spec.md:
- Add/remove/modify requirements
- Update Changelog section
- Keep Status as IN_PROGRESS if implementation started

### Phase 4: Research (If Needed)

Spawn Scout/Seer in parallel if update needs research.

### Phase 5: Update Tasks (Forger)

Spawn Forger if implementation has started:
- Add new tasks for expanded scope
- Mark removed scope tasks as CANCELLED (not deleted)
- Preserve completed task history

## Handling Different Phases

### DRAFT
Full flexibility. No task impact. Simple update.

### IN_PROGRESS
Check completed tasks. New requirements → new tasks. Removed → CANCELLED (not deleted).

### COMPLETE
```
Cannot update completed spec.
Options:
1. Create follow-up spec: /catalyze-spec "enhance {feature}"
2. Reopen spec (manual status change)
```

## Output

```
Spec updated!

Change: {description}
Updated files: {list}
Impact: {new/removed requirements and tasks}

Next: Continue with /forge-spec
```
