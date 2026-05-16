# Agent Delegation Anti-Patterns

> Load this reference when: orchestrating agents, reviewing agent output, or tempted to do work yourself as an orchestrator.
> Referenced by: Forge-Master, Catalyst, Arbiter (all orchestrator agents).

## Overview

Orchestrators coordinate. They do NOT implement. When an orchestrator writes code, writes tests, or makes implementation decisions, the separation of concerns collapses and quality drops.

**Core principle:** Orchestrators spawn agents. Agents do work. Never cross the boundary.

## The Iron Laws

```
1. NEVER write code as an orchestrator
2. NEVER trust agent reports without verification
3. NEVER let agents spin — escalate after 3 failures
4. NEVER skip review between phases
```

---

## Anti-Pattern 1: Orchestrator Does the Work

**The violation:**
```
Forge-Master sees a small bug during integration.
Instead of spawning Smith, Forge-Master fixes it directly.
"It's just one line, faster to do it myself."
```

**Why this is wrong:**
- Breaks separation of concerns
- No TDD cycle (orchestrator doesn't write tests)
- No scope tracking (change isn't in tasks.md)
- Sets precedent for "just this once"

**The fix:**
```
Forge-Master spawns Smith with specific instructions:
"Fix [bug]. Scope: [file]. Run tests after."

Even for one-line fixes.
```

### Gate Function

```
BEFORE using Edit/Write tool on any code file (.py/.ts/.js/.tsx/.jsx):
  Ask: "Am I an orchestrator?"

  IF yes:
    STOP — spawn the appropriate agent instead
    Even for "just one line"
    Even if "it's faster"
```

---

## Anti-Pattern 2: Trusting Agent Self-Reports

**The violation:**
```
Smith reports: "Task complete, all tests pass."
Forge-Master marks task as Done in tasks.md.
Later: tests actually fail. Smith hallucinated the output.
```

**Why this is wrong:**
- Agents can misreport (hallucinate, optimize for completion)
- "Tests pass" without evidence is a claim, not a fact
- Propagating unverified claims breaks the entire pipeline

**The fix:**
```
Smith reports: "Task complete, all tests pass."

Forge-Master:
1. Checks VCS diff — do expected files exist?
2. Runs test command — do tests actually pass?
3. ONLY THEN marks task as Done
```

See also: `.claude/skills/verification-before-completion/SKILL.md`

---

## Anti-Pattern 3: Letting Agents Spin

**The violation:**
```
Smith fails to make tests pass.
Forge-Master: "Try again."
Smith fails again.
Forge-Master: "Try a different approach."
Smith fails a third time.
Forge-Master: "Try harder."
```

**Why this is wrong:**
- Each retry burns tokens and context
- Same agent with same context makes same mistakes
- After 3 failures, the problem is likely architectural, not implementation

**The fix:**
```
Attempt 1 fails → Provide more specific guidance
Attempt 2 fails → Spawn FRESH agent with different context
Attempt 3 fails → STOP. Report to user. Question the approach.

Never attempt #4 without human input.
```

### Escalation Protocol

```
on_agent_failure(attempt_count):
  if attempt_count == 1:
    Provide clearer instructions, more context
    Re-spawn same agent type

  if attempt_count == 2:
    Spawn FRESH agent with:
    - Different framing of the problem
    - Error output from previous attempts
    - Explicit instruction to try alternative approach

  if attempt_count >= 3:
    STOP all execution
    Report to user:
    - What was attempted (all 3 approaches)
    - What failed each time
    - Your assessment of root cause
    - Ask: restructure approach, or investigate together?
```

---

## Anti-Pattern 4: Skipping Phase Gates

**The violation:**
```
Enforcer writes tests. Some fail for wrong reasons.
Forge-Master: "We'll fix those during implementation."
Proceeds to spawn builders.
```

**Why this is wrong:**
- Tests that fail for wrong reasons don't validate implementation
- Builders may "fix" tests instead of implementing features
- Gate exists to catch exactly this problem

**The fix:**
```
GATE RULE: Every test must fail for the RIGHT reason.

If tests fail because of:
  - Import errors → fix imports, re-run
  - Syntax errors → fix syntax, re-run
  - Wrong assertion → Enforcer rewrites test

If tests pass immediately:
  - Test is testing existing behavior → rewrite test

ONLY proceed to implementation when ALL tests fail because
the feature is not yet implemented.
```

---

## Anti-Pattern 5: Vague Agent Prompts

**The violation:**
```
Forge-Master spawns Smith:
"Implement the authentication feature."
```

**Why this is wrong:**
- No scope boundaries (agent may touch anything)
- No acceptance criteria (how does agent know when done?)
- No test references (which tests should pass?)
- Agent makes its own decisions about architecture

**The fix:**
```
Forge-Master spawns Smith:
"Implement task api-auth.

SCOPE (exclusive write): src/api/auth/**, tests/api/auth/**
READS (no modify): src/types/**, src/utils/**

Requirements from tasks.md:
- POST /api/auth/login returns JWT token
- POST /api/auth/register creates user
- GET /api/auth/me returns current user

Tests to make pass: tests/api/auth/login.test.ts, tests/api/auth/register.test.ts

Run tests after implementation. Report: files changed, test results, any concerns."
```

### Prompt Checklist

```
Every agent prompt MUST include:
- [ ] Specific task ID from tasks.md
- [ ] Scope boundaries (write + read-only)
- [ ] Requirements or acceptance criteria
- [ ] Test file references
- [ ] Expected output format
```

---

## Anti-Pattern 6: Parallel Agents Without Scope Isolation

**The violation:**
```
Forge-Master spawns smith-1 and smith-2.
Both modify src/utils/helpers.ts.
Git merge conflict. Lost work.
```

**Why this is wrong:**
- Parallel agents MUST have non-overlapping write scopes
- Shared files must be read-only for parallel agents
- Conflicts are expensive to resolve and may introduce bugs

**The fix:**
```
BEFORE spawning parallel agents:
1. List all files each agent needs to write
2. Check for overlaps
3. If overlap: restructure into sequential tasks
4. If clean: proceed with scope boundaries in prompts

Shared files (types, utils) are READS ONLY for parallel agents.
If a parallel agent needs to modify a shared file: STOP, make it sequential.
```

---

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Orchestrator writes code | Spawn agent, even for one line |
| Trust agent self-report | Verify with VCS diff + run tests |
| Let agents spin (3+ failures) | Escalate to user |
| Skip phase gates | Every gate must pass before proceeding |
| Vague agent prompts | Include scope, requirements, tests, output format |
| Parallel without scope isolation | Check for overlaps before spawning |

## Red Flags

- Orchestrator using Edit/Write on code files
- Marking tasks "Done" without running verification
- Agent on attempt #3+ for the same issue
- Proceeding to next phase with failing gates
- Agent prompts without scope boundaries
- Two agents writing to the same file path

## The Bottom Line

**Orchestrate, don't implement. Verify, don't trust. Escalate, don't spin.**
