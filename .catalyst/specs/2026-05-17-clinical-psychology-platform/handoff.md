# Handoff: Clinical Psychology Platform — Phase 2

> Living document — updated as implementation progresses.
> 
> **Status:** Ready for `/forge-spec`
> 
> **Entry Point:** Follow `tasks.md` strictly. Each task (T-001 through T-028) is independently submittable.

---

## Quick Start for Builders

### Before You Code

1. **Read the spec:** `spec.md` (20 min) — high-level design
2. **Read the research:** `research.md` (15 min) — academic grounding, codebase analysis
3. **Read the tasks:** `tasks.md` (10 min) — granular implementation steps
4. **Pick your first task:** Start with `T-001` (TypeScript types) if fresh start; otherwise pick a independent task

### Key Files You'll Touch

**New files to create:**
```
src/lib/clinical/
├── frameworks/
│   ├── cbt.ts
│   ├── psychodynamic.ts
│   ├── act.ts
│   ├── dbt.ts
│   └── humanistic.ts
├── intake/
│   ├── questions.ts
│   └── analyzer.ts
└── phase-engine/
    ├── detect.ts
    └── schema.ts

src/app/api/
├── intake/
│   └── analyze/route.ts
└── session/
    └── [id]/phase/route.ts

src/components/
├── IntakeFlow.tsx
├── CaseFormulationReview.tsx
└── SessionGuidancePanel.tsx

prisma/
├── schema.prisma (update)
└── migrations/[new]_add_clinical_phase_support.sql
```

**Modified files:**
```
src/types/index.ts (extend interfaces)
src/lib/approaches/*.ts (add phases)
src/app/api/session/start/route.ts (inject case context)
src/app/api/session/message/route.ts (phase detection)
```

### Dependencies Between Tasks

**Critical Path (must do in order):**
1. T-001 → T-002 → T-003 (Schema setup)
2. T-004 through T-008 (Frameworks, can do in parallel)
3. T-009 (Extend ApproachConfig once frameworks done)
4. T-010 through T-014 (Intake, can parallelize)
5. T-015, T-016, T-018 (Session integration)
6. T-019 (Guidance panel depends on API routes)

**Nice-to-have (low priority, can do anytime):**
- T-020 (Hybrid framework viewer)
- T-026 (DB seed data, only if storing phases in DB)

**Testing & QA (do after features done):**
- T-021 through T-024
- T-027, T-028 (Deployment)

---

## Common Pitfalls & Solutions

### Pitfall 1: Turn-Count Phase Detection Too Simple

**Problem:** Session turns 0–3 are phase 0, but maybe your session is shorter or longer.

**Solution:** Use `triggerTurnMin` from ProtocolPhase definition, not hardcoded numbers. Each approach defines its own thresholds in `frameworks/*.ts`. Reference those in `phase-engine/detect.ts`.

### Pitfall 2: Case Formulation Injection Breaks System Prompt

**Problem:** Injecting case context makes Claude system prompt too long (token limit).

**Solution:** Keep case context brief: 3–4 bullet points, ~100 tokens max. Example:

```
CASE CONTEXT:
- Primary concern: anxiety + avoidance
- PHQ-9: 8 (mild depression), GAD-7: 15 (moderate anxiety)
- Functional impairment: moderate (work, some relationships)
- Student approach: CBT
```

### Pitfall 3: Intake Optional vs. Mandatory Confusion

**Problem:** Does student HAVE to fill intake?

**Solution:** Intake is **optional but encouraged**. Session can start without intake. Check `intakeResponseId` in route — if null, use default system prompt (no case context). UI should have "Skip intake" button.

### Pitfall 4: Turkish Language Half-Implemented

**Problem:** Some guidance shows in Turkish, some in English.

**Solution:** All phase names, techniques, watchpoints must have Turkish translations in the framework definitions. Use `i18n` library or simple `{ en: "...", tr: "..." }` objects. Default to Turkish for AI responses (system prompt: "Respond in Turkish unless user specifies English").

### Pitfall 5: Guidance Panel Doesn't Update Mid-Session

**Problem:** Phase shows correctly at session start, but doesn't change when phase should advance.

**Solution:** Component must poll `/api/session/[id]/phase` every 5 turns (or call endpoint in message response handler). Don't cache phase in component state without refetching. Use `useEffect` with interval or call in message submission handler.

### Pitfall 6: Persona Opening Message Doesn't Reference Case Formulation

**Problem:** AI patient just ignores the case context.

**Solution:** Include in session start prompt:

```
CASE CONTEXT (for your internal reference):
[formulation]

Your opening statement should subtly acknowledge this clinical context.
For example: "I've been feeling really anxious lately, especially at work. 
It's gotten so bad that I'm avoiding meetings, which is affecting my job."
```

---

## Testing Checklist Before Merging

### Unit Tests

- [ ] Phase detection: each approach's turn thresholds tested
- [ ] Case formulation analyzer: Claude mock tested (success + error cases)
- [ ] Intake form validation: submit with/without data
- [ ] API routes: request/response shape validated

### Integration Tests

- [ ] Intake → Case Formulation → Session start flow (end-to-end)
- [ ] Session with intake vs. without intake (both work)
- [ ] Phase advances at correct turn counts
- [ ] Guidance panel updates correctly
- [ ] Feedback summary includes case formulation

### Manual Tests (QA)

- [ ] Fill intake on mobile (responsive form)
- [ ] Try keyboard-only navigation (IntakeFlow, buttons)
- [ ] Test with Turkish language enabled
- [ ] Verify no console errors (F12 dev tools)
- [ ] Performance: Lighthouse score ≥ 85
- [ ] Accessibility: screen reader test (basic)

---

## Code Style & Standards

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig.json)
- No `any` types (use `unknown` with type guards)
- Interfaces for all data structures
- JSDoc comments on public functions

### React Components

- Functional components (hooks, no class components)
- Props interface named `{ComponentName}Props`
- Export named + default if shared
- Tailwind CSS for styling (no CSS modules unless necessary)

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `index.ts` or `*.types.ts`
- Routes: `route.ts` (Next.js convention)

### API Routes

- Use `route.ts` (not `handler.ts`)
- Validate input at top of function
- Return typed responses: `{ success: boolean, data?: ..., error?: ... }`
- Timeout errors with descriptive messages

---

## Questions & Escalations

### Q: Can I add new features beyond spec.md?

**A:** No. Stick to spec.md. If you discover something missing, note it in `handoff.md` (update this file) and mark as "Future Enhancement". Phase 2 must stay scoped.

### Q: What if Claude API fails during intake analysis?

**A:** Fall back to rule-based recommendation based on PHQ-9 + GAD-7 scores only. Example:

```typescript
function getFallbackRecommendations(phq9: number, gad7: number): string[] {
  if (phq9 >= 15 && gad7 >= 10) return ['cbt', 'dbt']
  if (gad7 >= 15) return ['cbt', 'act']
  if (phq9 >= 15) return ['cbt', 'psychodynamic']
  return ['cbt', 'humanistic'] // Safe default
}
```

### Q: Should I store old IntakeResponse records?

**A:** Yes. Keep them. Students might want to review their intake later. One IntakeResponse per session (unique FK to Session).

### Q: How long should a session be before we transition to final phase?

**A:** Typical session: 15–25 turns. Phase 4 (Consolidation/Integration) should start around turn 15. Don't force it; use `transitionSignal` content cues.

### Q: Can educators customize protocol phases?

**A:** No, not in Phase 2. Frameworks are locked (code-based). Phase 3 will add educator customization. For now, educators can override student's approach choice after intake review.

### Q: What about non-binary gender presentations in personas?

**A:** Include them. Personas should reflect diversity. Update persona data if needed. Cognitive models don't assume gender.

---

## Future Enhancements (Post-Phase 2)

Mark these as "out of scope" in comments; save for Phase 2.5 or Phase 3:

- [ ] Content-aware phase detection (async Claude call every 5 turns) — currently turn-count only
- [ ] Educator-customizable protocol phases (Phase 3)
- [ ] Pre-session intake history (reuse intakes with same/different personas)
- [ ] Symptom severity trending (compare PHQ-9 scores across sessions)
- [ ] Live AI supervision (therapist + AI feedback in real time) — currently post-session only
- [ ] Voice interface (Phase 4)
- [ ] Avatar / video simulation (Phase 4)

---

## Deployment Checklist

### Pre-Staging

- [ ] All tests pass (unit + integration)
- [ ] Linter & formatter pass
- [ ] TypeScript strict mode passes
- [ ] No console errors in dev build
- [ ] No security warnings (`npm audit`)
- [ ] Prisma migrations tested locally
- [ ] Database schema matches migrations

### Staging

- [ ] Deploy to Vercel staging environment
- [ ] Smoke test: intake → session → feedback flow
- [ ] Performance check: Lighthouse ≥ 85
- [ ] Accessibility check: WCAG 2.1 AA
- [ ] Turkish translations render correctly
- [ ] No 500 errors in logs

### Production

- [ ] Staging QA sign-off
- [ ] Release notes prepared
- [ ] Rollback plan documented
- [ ] Monitor error logs for 24h post-deploy
- [ ] Gather user feedback (any issues reported?)

---

## Contact & Escalation

**For spec questions:** Refer to `spec.md` and `research.md`.

**For implementation questions:** Check `tasks.md` acceptance criteria.

**For bugs found during implementation:** Log in Git issue, reference the task number (e.g., "#T-012: IntakeFlow form validation fails on mobile").

**For blockers:** Escalate with context:
- What task are you on? (T-###)
- What's the blocker?
- What have you tried?
- What do you need unblocked?

---

## Version History

| Date | Author | Change |
|------|--------|--------|
| 2026-05-17 | Spec Shaper | Initial handoff, Phase 2 spec complete |
| | | All 28 tasks defined, dependency graph clear |
| | | Ready for `/forge-spec` implementation |

---

**Next Step:** Run `/forge-spec @2026-05-17-clinical-psychology-platform` to begin TDD implementation.
