# Verification Before Completion

> Load this reference when: about to claim work is complete, fixed, or passing. Before committing, creating PRs, or reporting task status.
> Referenced by: ALL agents. This standard is universal.

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in THIS response, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, not cached)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = the claim is unverified.
```

## What Verification Looks Like

**Tests:**
```
CORRECT:  [Run test command] [See: 34/34 pass] "All tests pass"
WRONG:    "Should pass now" / "Looks correct" / "Tests are passing"
```

**Build:**
```
CORRECT:  [Run build command] [See: exit 0] "Build succeeds"
WRONG:    "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
CORRECT:  Re-read spec → Create checklist → Verify each → Report gaps or completion
WRONG:    "Tests pass, therefore task is complete"
```

**Regression tests (TDD Red-Green):**
```
CORRECT:  Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
WRONG:    "I've written a regression test" (without red-green verification)
```

**Agent delegation:**
```
CORRECT:  Agent reports success → Check VCS diff → Verify changes exist → Report actual state
WRONG:    Trust agent report at face value
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output showing 0 failures | Previous run, "should pass" |
| "Linter clean" | Linter output showing 0 errors | Partial check, extrapolation |
| "Build succeeds" | Build command exit 0 | Linter passing, logs look good |
| "Bug fixed" | Test original symptom: passes | Code changed, assumed fixed |
| "Regression test works" | Red-green cycle verified | Test passes once |
| "Agent completed task" | VCS diff shows changes | Agent reports "success" |
| "All requirements met" | Line-by-line spec checklist | Tests passing |

## Red Flags — STOP

If you catch yourself:
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Done!")
- About to commit/push without verification
- Trusting agent success reports without checking
- Relying on partial verification ("linter passed = build works")
- Thinking "just this once"
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence is not evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter is not the compiler |
| "Agent said success" | Verify independently |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |
| "I already tested this earlier" | Earlier is not now. Run it again. |

## For Orchestrators (Forge-Master, Catalyst, Arbiter)

Orchestrators have an additional responsibility: **verify agent claims before propagating them.**

```
Agent reports "task complete, tests pass":

1. Check: Did the agent actually run tests? (look for test output in report)
2. Check: Does VCS diff show the expected changes?
3. Run: Execute the test command yourself to verify
4. ONLY THEN: Mark the task as complete in tasks.md
```

**Never update tasks.md Progress to "Done" based solely on an agent's self-report.**

## For Builder Agents (Smith, Shaper, Alchemist)

Before reporting completion to the orchestrator:

```
1. Run the specific tests for your scope
2. Verify ALL pass (not just the ones you wrote)
3. Check: Did you implement everything in the task description?
4. Check: Did you add anything NOT in the task description?
5. Report: actual test output, files changed, any concerns
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- Committing, PR creation, task completion
- Moving to the next task
- Reporting status to orchestrator or user

**This is non-negotiable.**

Run the command. Read the output. THEN claim the result.
