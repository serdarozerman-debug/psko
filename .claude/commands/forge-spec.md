# /forge-spec

Implement a specification using **strict TDD**.

> **Lifecycle position:** `/catalyze-spec` → **`/forge-spec`** → `/audit-spec` → `/seal-spec`

## Usage

```
/forge-spec @2025-11-29-stripe-integration
```

## Pre-computed Context

```bash
# Detect spec and branch state
echo "=== BRANCH ===" && git branch --show-current
echo "=== STATUS ===" && git status --short
echo "=== SPEC FILES ===" && ls .catalyst/specs/*$ARGUMENTS*/ 2>/dev/null || echo "No spec found for: $ARGUMENTS"
echo "=== SPEC FRONTMATTER ===" && head -30 .catalyst/specs/*$ARGUMENTS*/spec.md 2>/dev/null || echo "No spec.md"
echo "=== TASKS EXIST? ===" && head -5 .catalyst/specs/*$ARGUMENTS*/tasks.md 2>/dev/null || echo "No tasks.md yet (fresh build)"
echo "=== PROJECT CONFIG ===" && cat .catalyst/main/project-config.yaml 2>/dev/null || echo "No project config"
```

---

**Invoke skill:** `build-orchestration`

**Orchestrator:** Forge-Master (delegates to Forger, Enforcer, Smith, Shaper, Alchemist)

**Process skills used:** `test-driven-development`, `agent-delegation`, `verification-before-completion`, `systematic-debugging`
