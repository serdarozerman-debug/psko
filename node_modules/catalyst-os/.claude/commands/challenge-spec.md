# /challenge-spec

Stress-test a shaped spec by interviewing the user across every branch of the design tree.

> **Lifecycle position:** `/catalyze-spec` → **`/challenge-spec`** *(optional)* → `/forge-spec` → `/audit-spec` → `/seal-spec`
>
> **Optional gate.** Use when a spec has real design surface area and you want every branch resolved before tests are written. Skip it for trivial specs.

## Usage

```
/challenge-spec @2026-05-13-stripe-integration
```

## Pre-computed Context

```bash
# Spec state for challenge
echo "=== SPEC FILES ===" && ls .catalyst/specs/*$ARGUMENTS*/ 2>/dev/null || echo "No spec found for: $ARGUMENTS"
echo "=== SPEC STATUS ===" && head -20 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== OPEN QUESTIONS ===" && grep -A 20 "## Open Questions" .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No Open Questions section"
echo "=== TASKS EXIST? ===" && ls .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null && echo "WARNING: tasks.md exists — use /update-spec instead" || echo "No tasks.md (expected)"
```

---

**Invoke skill:** `spec-challenge`

**Orchestrator:** Main thread (direct interview). Spawn Seer if a question becomes a codebase research task.

**Process skills used:** `brainstorming` (form, not 9-question cap), `agent-delegation`
