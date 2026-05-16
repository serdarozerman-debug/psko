# /archive-spec

Archive a spec without git ceremony. Marks as COMPLETE, moves to completed folder, and checks for library patterns.

> **Use when:** You want to close out a spec without branch management or push suggestions.
> **For full ceremony:** Use `/seal-spec` instead.
>
> **Flow:** `/catalyze-spec` → `/forge-spec` → `/audit-spec` → **`/archive-spec`** (lightweight) or **`/seal-spec`** (full)

## Usage

```
/archive-spec @2025-11-29-stripe-integration
/archive-spec @2025-11-29-stripe-integration "closing out"
```

## Pre-computed Context

```bash
# Spec state for archival
echo "=== SPEC FILES ===" && ls .catalyst/specs/*$ARGUMENTS*/ 2>/dev/null || echo "No spec found for: $ARGUMENTS"
echo "=== SPEC STATUS ===" && head -20 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== TASKS.MD ===" && cat .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null | head -40 || echo "No tasks.md"
```

---

**Invoke skill:** `spec-archival`

**Process skills used:** `verification-before-completion`
