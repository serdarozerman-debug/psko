# Test-Driven Development

> **When to invoke:** Before writing ANY implementation code. When implementing features, fixing bugs, or modifying behavior.
> **Used by:** Enforcer agent (primary), all builder agents (Smith, Shaper, Alchemist) during implementation.

## Purpose

Ensure correctness through strict Red-Green-Refactor cycles. Tests define behavior BEFORE code exists.

## The Iron Laws

```
1. NEVER write implementation before a failing test
2. NEVER ship tests that passed immediately (without red phase)
3. NEVER test mock behavior — test real code
4. NEVER add test-only methods to production classes
5. A test you didn't see fail proves nothing
```

## The TDD Cycle

```
1. Write failing test    → WATCH it FAIL (Red)
2. Write minimal code    → WATCH it PASS (Green)
3. Refactor              → KEEP it PASSING
4. THEN claim complete

Skip any step = the test proves nothing.
```

## Red Phase Verification

Every test MUST be seen failing before implementation begins.

```
CORRECT:
  Write test → Run → See "FAIL: expected X but got undefined" → Proceed to implement

WRONG:
  Write test → Write code → Run → See "PASS" → Claim TDD compliant
```

**Why the red phase matters:**
- A test that never failed might be testing the wrong thing
- A test that never failed might pass for the wrong reason
- A test that never failed gives false confidence

## Red-Green Verification for Regression Tests

```
Write test → Run (PASS) → Revert the fix → Run (MUST FAIL) → Restore fix → Run (PASS)

If the test doesn't fail when the fix is reverted, the test is worthless.
```

## Test Structure

```
1. Arrange: Set up test data and mocks
2. Act: Execute the code under test
3. Assert: Verify the expected outcome
```

## Coverage Areas

- **Happy Path**: Normal expected behavior
- **Edge Cases**: Boundary conditions, empty inputs
- **Error Cases**: Invalid inputs, failures
- **Integration**: Component interactions

## Naming Convention

```
test_[unit]_[scenario]_[expected_result]
```

Example: `test_login_with_invalid_password_returns_401`

## Gate Function for Mocks

```
BEFORE mocking any method:
  STOP — don't mock yet.

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at a LOWER level (the actual slow/external operation)
    NOT the high-level method the test depends on

  IF unsure:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without reading the dependency chain
```

## Gate Function for Test Completion

```
BEFORE claiming "tests are written":

  1. Did I WATCH each test fail? (red phase)
  2. Do tests fail for the RIGHT reason? (missing feature, not import errors)
  3. Are any tests passing immediately? → DELETE and rewrite

  IF any test passes before implementation:
    STOP — it's testing existing behavior, not new behavior
    Rewrite to test the actual new functionality
```

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Keep code as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start fresh with TDD. |
| "Test is hard to write = skip it" | Hard to test = hard to use. Simplify the interface. |
| "Existing code has no tests" | You're improving it. Add tests for what you touch. |
| "Manual test is faster" | Manual doesn't prove edge cases. You'll re-test every change. |

## For Detailed Anti-Patterns

See `testing-anti-patterns.md` in this skill directory for comprehensive examples:
- Anti-Pattern 1: Testing Mock Behavior
- Anti-Pattern 2: Test-Only Methods in Production
- Anti-Pattern 3: Mocking Without Understanding
- Anti-Pattern 4: Incomplete Mocks
- Anti-Pattern 5: Tests That Passed Immediately
- Anti-Pattern 6: Over-Complex Mocks
