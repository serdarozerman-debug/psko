# /sync-project

Sync all spec statuses with reality. Scans active specs, detects completed work, updates tasks.md, and archives finished specs.

> **Use when:** You forgot to `/audit-spec` and `/seal-spec` for one or more specs, or want to catch up on housekeeping.

## Usage

```
/sync-project                    # Sync all active specs
/sync-project "focus on auth"    # Sync with specific focus
```

## Pre-computed Context

```bash
# List all active specs
echo "=== ACTIVE SPECS ===" && ls -d .catalyst/specs/*/ 2>/dev/null || echo "No active specs"
echo "=== COMPLETED SPECS ===" && ls -d .catalyst/specs/completed/*/ 2>/dev/null || echo "No completed specs"
echo "=== GIT STATUS ===" && git status --short
echo "=== RECENT COMMITS ===" && git log --oneline -15
```

---

**Invoke skill:** `project-sync`

**Process skills used:** `verification-before-completion`
