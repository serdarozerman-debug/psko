# Testing Anti-Patterns

> Load this reference when: writing or changing tests, adding mocks, or tempted to add test-only methods to production code.
> Referenced by: Enforcer agent, all builder agents during TDD cycles.

## Overview

Tests must verify real behavior, not mock behavior. Mocks isolate dependencies; they are not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

**Following strict TDD prevents most of these anti-patterns.**

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding the dependency chain
4. NEVER ship tests that passed immediately (without red phase)
```

---

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```typescript
// BAD: Testing that the mock exists, not that the component works
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why this is wrong:**
- You're verifying the mock works, not the component
- Test passes when mock is present, fails when removed
- Tells you nothing about real behavior

**The fix:**
```typescript
// GOOD: Test real component behavior
test('renders sidebar with navigation links', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock — test Page's behavior WITH sidebar present
```

### Gate Function

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real behavior or just mock existence?"

  IF testing mock existence:
    STOP — delete the assertion or unmock the component

  Test real behavior instead.
```

---

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```typescript
// BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
  }
}

// In tests
afterEach(() => session.destroy());
```

**Why this is wrong:**
- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns

**The fix:**
```typescript
// GOOD: Test utilities handle test cleanup
// Session has no destroy() — it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

### Gate Function

```
BEFORE adding any method to a production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP — put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP — wrong class for this method
```

---

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```typescript
// BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw — but won't!
});
```

**Why this is wrong:**
- Mocked method had a side effect the test depended on
- Over-mocking "to be safe" breaks actual behavior
- Test passes for the wrong reason

**The fix:**
```typescript
// GOOD: Mock at the correct level — just the slow/external part
test('detects duplicate server', () => {
  vi.mock('MCPServerManager'); // Only mock slow server startup

  await addServer(config);  // Config written (side effect preserved)
  await addServer(config);  // Duplicate detected
});
```

### Gate Function

```
BEFORE mocking any method:
  STOP — don't mock yet.

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at a lower level (the actual slow/external operation)
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

---

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```typescript
// BAD: Partial mock — only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**Why this is wrong:**
- Partial mocks hide structural assumptions
- Downstream code may depend on fields you didn't include
- Tests pass but integration fails — false confidence

**The fix:**
```typescript
// GOOD: Mirror the real API structure completely
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // All fields the real API returns
};
```

### Gate Function

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  1. Examine actual API response from docs/types/examples
  2. Include ALL fields the system might consume downstream
  3. Verify mock matches real response schema completely

  If uncertain: include all documented fields.
```

---

## Anti-Pattern 5: Tests That Passed Immediately

**The violation:**
```
1. Write implementation code
2. Write tests after
3. Tests pass immediately
4. Claim "TDD compliant"
```

**Why this is wrong:**
- A test that never failed proves nothing
- You don't know if it tests the right thing
- You don't know if it would catch a regression
- It tests "what the code does" not "what it should do"

**The fix:**
```
TDD cycle (the only valid order):
1. Write failing test    → watch it FAIL
2. Write minimal code    → watch it PASS
3. Refactor              → keep it PASSING
4. THEN claim complete
```

### Red-Green Verification for Regression Tests

```
Write test → Run (PASS) → Revert the fix → Run (MUST FAIL) → Restore fix → Run (PASS)

If the test doesn't fail when the fix is reverted, the test is worthless.
```

---

## Anti-Pattern 6: Over-Complex Mocks

**Warning signs:**
- Mock setup is longer than test logic
- Mocking everything to make the test pass
- Mocks missing methods real components have
- Test breaks when mock changes, not when code changes

**The question to ask:** "Do we need to be using a mock here?"

**Consider:** Integration tests with real components are often simpler than complex mocks and give more confidence.

---

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Incomplete mocks | Mirror real API completely |
| Tests passed immediately | TDD — test must fail first |
| Over-complex mocks | Consider integration tests |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of the test
- Test fails when you remove mock (not when code breaks)
- Can't explain why the mock is needed
- Mocking "just to be safe"
- Test passed on first run without a red phase

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

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If you find yourself testing mock behavior, you've gone wrong. Fix: test real behavior, or question why you're mocking at all.
