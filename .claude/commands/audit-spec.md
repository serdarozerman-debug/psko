# /audit-spec

Run validation checks and code simplification on a completed implementation.

> **Lifecycle position:** `/catalyze-spec` → `/forge-spec` → **`/audit-spec`** → `/seal-spec`
>
> **Note:** This audits the CODE implementation (quality, security, tests) — not the spec document.

## Usage

```
/audit-spec @2025-11-29-stripe-integration
```

## Pre-computed Context

```bash
# Build state for validation
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== TASKS.MD PROGRESS ===" && grep -A 5 "## Progress" .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null || echo "No tasks.md"
echo "=== SPEC STATUS ===" && head -20 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== DIFF STAT VS BASE ===" && git diff --stat main...HEAD 2>/dev/null || echo "No diff from main"
echo "=== FILES CHANGED ===" && git diff --name-only main...HEAD 2>/dev/null || echo "No changes from main"
```

---

**Invoke skill:** `spec-validation`

**Orchestrator:** Arbiter (delegates to Enforcer, Sentinel, Inquisitor, Watcher)

**Process skills used:** `verification-before-completion`, `agent-delegation`, `test-driven-development`
