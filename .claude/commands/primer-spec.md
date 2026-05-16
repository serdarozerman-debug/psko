# /primer-spec

Quickly load spec context into a fresh conversation.

## Pre-computed Context

```bash
# Git state
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== RECENT COMMITS ===" && git log --oneline -5

# Spec files
echo "=== TASKS.MD ===" && cat .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null || echo "No tasks.md for: $ARGUMENTS"
echo "=== SPEC FRONTMATTER ===" && head -30 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== RESEARCH ===" && head -30 .catalyst/specs/*$ARGUMENTS*/research.md 2>/dev/null || echo "No research.md"
```

---

## Purpose

When you start a new conversation (context was full), use this command to:
- Restore awareness of the spec's current state
- Understand what's done and what's pending
- Know which branch you're on
- Continue work without re-explaining everything

**This is NOT an orchestration command.** Read files directly and output a summary.

---

## Usage

```
/primer-spec @2025-11-29-stripe-integration
```

---

## What To Do

### Step 1: Use Pre-computed Context

The bash blocks above already loaded tasks.md, spec frontmatter, research, and git state. Use this data directly — do NOT re-read these files unless you need more detail beyond what was loaded.

### Step 2: Read Full Files Only If Needed

If the pre-computed context was truncated, read the full file:

```
1. tasks.md     → What's done? What's pending? What's in progress?
2. spec.md      → What is this feature? Requirements?
3. research.md  → (if exists) Any key technical decisions?
```

### Step 3: Output Brief Summary

Output a **concise** summary (aim for ~20-30 lines max):

```
## Spec Primer: {Feature Name}

**Branch:** feat/{slug}
**Status:** {phase - e.g., "Building", "Testing", "Validating"}

### What It Does
{1-2 sentences from spec.md overview}

### Progress
| Done | In Progress | Pending |
|------|-------------|---------|
| 3    | 1           | 2       |

**Completed:**
- ✓ {task-1}
- ✓ {task-2}

**In Progress:**
- → {task-3}

**Pending:**
- ○ {task-4}
- ○ {task-5}

### Current Focus
{What was being worked on based on tasks.md status}

### Git State
- Branch: feat/{slug}
- Last commit: {commit message}
- Uncommitted changes: {yes/no}

---
Ready to continue. What would you like to work on?
```

---

## Rules

1. **Be brief** - This is a primer, not a full report
2. **Read directly** - Do NOT spawn agents, just read files
3. **Focus on actionable state** - What's done, what's next
4. **Preserve context** - Keep output short to leave room for actual work

---

## Example Output

```
## Spec Primer: Stripe Integration

**Branch:** feat/2025-11-29-stripe-integration
**Status:** Building (Phase 5 - Parallel Implementation)

### What It Does
Integrate Stripe for subscription billing with monthly/annual plans and usage-based pricing.

### Progress
| Done | In Progress | Pending |
|------|-------------|---------|
| 4    | 2           | 1       |

**Completed:**
- ✓ db-schema: Subscription tables
- ✓ api-types: Shared TypeScript types
- ✓ api-auth: Authentication endpoints
- ✓ iter-001: Annual billing discount

**In Progress:**
- → api-billing: Billing service (tests passing)
- → ui-pricing: Pricing page components

**Pending:**
- ○ integration: E2E tests

### Current Focus
Working on api-billing and ui-pricing in parallel.
Annual billing iteration (iter-001) was added and completed.

### Git State
- Branch: feat/2025-11-29-stripe-integration
- Last commit: feat(billing): add annual billing with 20% discount
- Uncommitted changes: no

---
Ready to continue. What would you like to work on?
```

---

## When to Use

| Situation | Command |
|-----------|---------|
| Context full, need to continue building | `/primer-spec` |
| Need full validation | `/audit-spec` |
| Check status without loading context | `/status-spec` |

---

## Tips

- Run this FIRST in a new conversation before doing any work
- After primer, continue with `/forge-spec`
- If tasks.md doesn't exist, the spec hasn't been built yet - run `/forge-spec`
