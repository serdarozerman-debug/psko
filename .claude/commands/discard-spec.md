# /discard-spec

Request changes to the implementation.

## Usage

```
/discard-spec @2025-11-29-stripe-integration "reason"
/discard-spec @2025-11-29-stripe-integration "UI doesn't match mockup"
/discard-spec @2025-11-29-stripe-integration "TDD not followed"
```

---

## TDD Violation Rejection

**If TDD was not followed, this is an automatic rejection reason:**

```
/discard-spec @spec-name "TDD not followed - tests written after code"
```

This routes directly back to `/forge-spec` with instructions to follow TDD.

---

## Workflow

### Phase 1: Document Rejection

Record rejection in `validation.md`:

```markdown
## Rejection Log

### Rejection #1
**Date:** YYYY-MM-DD
**Reason:** UI doesn't match mockup
**Status:** Pending fix

### Requested Changes
- [ ] Align button placement with Figma design
- [ ] Use correct color scheme
- [ ] Add missing loading states
```

### Phase 2: Route to Appropriate Agent

Based on rejection reason:

| Issue Type | Route To | Command |
|------------|----------|---------|
| **TDD not followed** | Enforcer -> Builders | `/forge-spec` (restart) |
| Missing tests | Enforcer | `/forge-spec` |
| Test failures | Enforcer + Builders | `/forge-spec` |
| UI/UX issues | Shaper | `/forge-spec` |
| API issues | Smith | `/forge-spec` |
| Quality issues | Inquisitor | `/audit-spec` |
| Security issues | Watcher | IMMEDIATE FIX |

### Phase 3: Update Status

Update `spec.md` status:
```markdown
> Status: CHANGES_REQUESTED
```

Update `tasks.md` with action items:
```markdown
## Action Items (from rejection)
- [ ] Review Figma designs
- [ ] Update PricingPage component
- [ ] Re-run validation
```

## Output

### Standard Rejection
```
Spec discarded - changes requested

Spec: 2025-11-29-stripe-integration
Reason: UI doesn't match mockup

Changes needed:
- [ ] Align button placement with Figma design
- [ ] Use correct color scheme
- [ ] Add missing loading states

Updated: .catalyst/specs/{slug}/validation.md

Next: Fix issues and run /forge-spec @2025-11-29-stripe-integration
      Then /audit-spec @2025-11-29-stripe-integration
```

### TDD Violation Rejection
```
Spec discarded - TDD VIOLATION

Spec: 2025-11-29-stripe-integration
Reason: TDD not followed - tests written after code

This is a critical process violation. TDD is mandatory.

Required process:
1. Enforcer writes ALL tests first
2. Verify all tests FAIL (red phase)
3. Builders implement features
4. Verify all tests PASS (green phase)

Next: Run /forge-spec @2025-11-29-stripe-integration
      Follow TDD process strictly.
```

## Tips

Be specific in rejection reasons:
- Bad: "Doesn't look right"
- Good: "Button should be blue (#3B82F6) not gray"

- Bad: "API is slow"
- Good: "GET /subscriptions takes 2s, should be <200ms"

- Bad: "Tests are wrong"
- Good: "Missing test for expired card scenario"
