# Agent Delegation

> **When to invoke:** When orchestrating agents, reviewing agent output, or tempted to do work yourself as an orchestrator.
> **Used by:** Forge-Master, Catalyst, Arbiter (all orchestrator agents).

## Purpose

Orchestrators coordinate. They do NOT implement. This skill defines the rules for effective delegation, verification, and escalation.

## The Iron Laws

```
1. NEVER write code as an orchestrator
2. NEVER trust agent reports without verification
3. NEVER let agents spin — escalate after 3 failures
4. NEVER skip review between phases
```

## Orchestrator Behavioral Rules

```
BEFORE writing ANY code or test:
  → STOP
  → Ask yourself: "Should a specialized agent do this?"
  → If YES: Use Task tool with appropriate subagent_type
  → If NO: You're probably wrong. Use the Task tool.

You may ONLY:
  ✓ Read files to understand context
  ✓ Use Task tool to spawn agents
  ✓ Run test commands to verify gates
  ✓ Report status to user

You may NEVER:
  ✗ Write code (use smith or shaper)
  ✗ Write tests (use enforcer)
  ✗ Create task breakdowns (use forger)
  ✗ Write database schemas (use alchemist)
  ✗ Update spec documentation (use scribe)

IF YOU ARE ABOUT TO USE Edit/Write TOOL ON A CODE FILE → STOP → SPAWN AN AGENT
```

## Prompt Checklist

Every agent prompt MUST include:

```
- [ ] Specific task ID from tasks.md
- [ ] Scope boundaries (write + read-only)
- [ ] Requirements or acceptance criteria
- [ ] Test file references
- [ ] Expected output format
```

### Good Prompt Example

```
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

### Bad Prompt Example

```
"Implement the authentication feature."
→ No scope, no criteria, no test references, agent makes own decisions
```

## Verification After Agent Completion

```
Agent reports "task complete, tests pass":

1. Check: Did the agent include actual test output in its report?
2. Check: Does VCS diff show the expected file changes?
3. Run: Execute the test command for that scope yourself
4. ONLY THEN: Mark the task as Done in tasks.md
```

**NEVER mark a task as Done based solely on an agent's self-report.**

## Parallel Execution Rules

When spawning multiple agents in parallel:

```
BEFORE spawning parallel agents:
1. List all files each agent needs to write
2. Check for overlaps
3. If overlap: restructure into sequential tasks
4. If clean: proceed with scope boundaries in prompts

Shared files (types, utils) are READS ONLY for parallel agents.
If a parallel agent needs to modify a shared file: STOP, make it sequential.
```

**Spawn ALL ready agents in ONE message** for maximum parallelism.

## Escalation Protocol

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

NEVER attempt #4 without human input.
```

## Phase Gates

Every gate must pass before proceeding to the next phase:

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

## Failure Handling

### Single Task Failure
```
- Mark task as FAILED in tasks.md
- Continue other parallel branches
- Report failure to user
- Do NOT proceed to integration
```

### Scope Violation
```
- STOP that agent immediately
- Revert changes outside scope
- Report violation
- Re-run task with stricter prompt
```

### Dependency Deadlock
```
- STOP all execution
- Report to user
- Request Forger to restructure DAG
```

## Anti-Patterns Quick Reference

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
