# /forge-spec-worktree

Implement a specification using **strict TDD** in an isolated git worktree.

Use this instead of `/forge-spec` when you need worktree isolation — e.g., working on a second spec while another is in progress, or wanting a clean working directory.

> **Lifecycle position:** `/catalyze-spec` → **`/forge-spec-worktree`** → `/audit-spec` → `/seal-spec`

## Usage

```
/forge-spec-worktree @2025-11-29-stripe-integration
```

---

**Invoke skill:** `build-orchestration` with `--worktree`

**Orchestrator:** Forge-Master (delegates to Forger, Enforcer, Smith, Shaper, Alchemist)

**Process skills used:** `test-driven-development`, `agent-delegation`, `verification-before-completion`, `systematic-debugging`
