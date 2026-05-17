# Clinical Psychology Platform — Phase 2 Specification Index

**Spec ID:** `2026-05-17-clinical-psychology-platform`  
**Status:** DRAFT → Ready for `/forge-spec`  
**Created:** 2026-05-17  
**Language Support:** English + Turkish (all AI responses default Turkish)  

---

## Document Map

### Start Here: README.md
Quick overview, vision, key features, success metrics. Read first (5 min).

### Core Specification: spec.md
**High-level design & requirements** (20 min read)

What's being built:
- 3 interconnected systems: intake, case formulation, protocol phases
- 28 tasks, 100 story points, 8-week implementation estimate

Key sections:
- User Stories (6 stories covering student & educator perspectives)
- Functional & Non-Functional Requirements (12 REQs each)
- Technical Approach (detailed architecture, API changes, component design)
- Acceptance Criteria (8 verifiable criteria)
- Out of Scope (what's NOT included)
- Open Questions (5 key design decisions to make)

**Deliverables from spec:**
- 6 new TypeScript interfaces (ProtocolPhase, CaseFormulation, IntakeResponse, PhaseGuidance, extended ApproachConfig)
- 1 new Prisma model (IntakeResponse) + schema extensions
- 3 new API routes (/intake/analyze, /session/[id]/phase, /session/[id]/advance-phase optional)
- 3 new React components (IntakeFlow, CaseFormulationReview, refactored SessionGuidancePanel)
- 5 new framework modules (CBT, PDT, ACT, DBT, Humanistic)

### Deep Research: research.md
**Academic grounding & codebase analysis** (25 min read)

Part A: Codebase Analysis
- Current architecture (Session, Persona, ApproachConfig models)
- Integration points (where Phase 2 plugs in)
- Backward compatibility strategy

Part B: Clinical Framework Analysis (5 approaches)
- CBT (Beck's 5-phase model)
- Psychodynamic (Luborsky CCRT)
- ACT (Hayes 6 core processes)
- DBT (Linehan 4 stages)
- Humanistic (Rogers 3-phase empathy)

Each approach:
- Theoretical foundation (1–2 paragraphs)
- 4–6 protocol phases with objectives, techniques, watchpoints
- Case conceptualization template
- Approach recommendation triggers
- Academic source citations

Part C: Intake Questionnaire Design
- PHQ-9 (9 items for depression screening)
- GAD-7 (7 items for anxiety screening)
- Open-ended questions (3 items)
- Scoring thresholds
- Claude-based approach recommendation algorithm (not rule-based)

Part D: Phase Detection Strategy
- Turn-count baseline (simple, performant)
- Content-aware detection option (async Claude call every 5 turns, optional)

Part E: Codebase Integration Path
- File structure (new + modified files)
- Backward compatibility approach
- No breaking changes

Part F: Academic References
- 5 primary sources (all peer-reviewed, published 1961–2020)
- Educational integration principles

### Implementation Tasks: tasks.md
**Granular task breakdown & execution plan** (30 min read)

28 tasks organized into phases:

1. **Foundation (T-001 to T-003)** — Schema & Types
   - Extend TypeScript interfaces
   - Add Prisma schema (IntakeResponse model, extend Session)
   - Generate migration

2. **Clinical Frameworks (T-004 to T-009)** — Protocol Definitions
   - Define CBT phases (T-004)
   - Define PDT phases (T-005)
   - Define ACT processes (T-006)
   - Define DBT stages (T-007)
   - Define Humanistic phases (T-008)
   - Update ApproachConfig in all 5 approaches (T-009)

3. **Intake System (T-010 to T-014)** — Questions & Analysis
   - Create intake question bank (T-010)
   - Create analyzer function (T-011)
   - Create IntakeFlow component (T-012)
   - Create CaseFormulationReview component (T-013)
   - Create API route /intake/analyze (T-014)

4. **Session Integration (T-015 to T-020)** — Routes & Frontend
   - Update session/start route (T-015)
   - Create /session/[id]/phase route (T-016)
   - Create phase detection service (T-017)
   - Integrate phase detection in message route (T-018)
   - Create SessionGuidancePanel component (T-019)
   - Create HybridFrameworkViewer component (T-020)

5. **Testing (T-021 to T-024)** — Quality Assurance
   - E2E test: intake → session → feedback (T-021)
   - Unit test: phase detection (T-022)
   - Unit test: case formulation analyzer (T-023)
   - Accessibility & i18n audit (T-024)

6. **Deployment (T-025 to T-028)** — Documentation & Release
   - Update documentation (T-025)
   - Database seed data (T-026)
   - Deploy to staging & QA (T-027)
   - Merge to main & release notes (T-028)

**Each task includes:**
- Story point estimate (3–8pt)
- Acceptance criteria (4–8 checkboxes)
- Dependencies (clear prerequisite tasks)
- Author guidance

**Estimation:** ~100 story points total = 13–16 weeks at 8pt/week velocity

**Critical path:** T-001 → T-002 → T-003 → T-009 → T-014 → T-015 → T-019

### Implementation Guide: handoff.md
**Operational guide for builders** (15 min read)

Before you code:
- Read spec (20 min) → research (15 min) → tasks (10 min)
- Pick your first task (start with T-001 if fresh; otherwise pick independent task)

Key sections:
- Quick start for builders
- File map (new + modified files)
- Task dependencies graph
- Common pitfalls & solutions (6 pitfalls, each with solution)
- Testing checklist (unit + integration + QA manual tests)
- Code style & standards (TypeScript, React, file naming, API patterns)
- FAQ & escalation path
- Future enhancements (post-Phase 2)
- Deployment checklist

**Most valuable section:** "Common Pitfalls" — addresses likely bugs before they happen.

---

## How to Use This Spec

### For Product Managers / Educators
1. Read `README.md` (5 min)
2. Read `spec.md` User Stories + Acceptance Criteria (10 min)
3. Skim `research.md` Part B (clinical frameworks, 5 min)
4. Confirm requirements align with vision, sign off

### For Architects / Tech Leads
1. Read entire `spec.md` (20 min)
2. Read `research.md` Part A (codebase analysis, 5 min)
3. Review `tasks.md` dependency graph (5 min)
4. Identify critical path, allocate engineers

### For Engineers (Builders)
1. **Before coding:** Read `README.md` + `spec.md` + `research.md` + `tasks.md` (60 min total)
2. **Pick a task:** Start with T-001 or an independent task
3. **During coding:** Keep `handoff.md` open for common pitfalls, testing checklist
4. **Before merging:** Check task acceptance criteria + testing checklist
5. **Code review:** Peer review, TypeScript strict mode, linter pass, tests pass

### For QA / Testers
1. Read `README.md` (5 min)
2. Read `tasks.md` acceptance criteria for your task (5 min)
3. Read `handoff.md` testing checklist (10 min)
4. Execute test scenarios, log bugs with task reference (e.g., "#T-012: IntakeFlow fails on mobile")

### For Project Manager
1. Print `tasks.md` dependency graph
2. Create Jira/Linear tickets from T-001 through T-028
3. Use story point estimates for sprint planning
4. Track progress against critical path
5. Reference `handoff.md` escalation path for blockers

---

## Key Decision Points in This Spec

**1. Intake: Optional or Mandatory?**
- **Decision:** Optional but strongly encouraged
- **Why:** Preserves backward compatibility; users can skip intake and go straight to session

**2. Phase Detection: Turn-Count Only or Content-Aware?**
- **Decision:** Turn-count baseline (default); content-aware as optional enhancement
- **Why:** Simple, performant, no extra API calls. Content-aware can be added post-MVP if needed

**3. Case Formulation: Rule-Based or Claude-Generated?**
- **Decision:** Claude-generated (with rule-based fallback if Claude fails)
- **Why:** Respects clinical complexity; students learn that clinical synthesis isn't formulaic. Fallback ensures uptime.

**4. Turkish Language: UI Translations or AI Response Default?**
- **Decision:** Both. All UI strings translated + AI responses default to Turkish (system prompt)
- **Why:** Phase 1 established Turkish as default language; Phase 2 honors that throughout

**5. Hybrid Framework Viewer: During Session or Post-Session?**
- **Decision:** Pre-session (dashboard, before picking approach)
- **Why:** Helps students understand approach fit BEFORE committing to approach

**6. Persona Enrichment: Full SCID-5 or Simplified Clinical Anchors?**
- **Decision:** Simplified (SCID-5 aligned but not full interview)
- **Why:** Training tool, not diagnostic instrument. Focus on onset timeline, functional impairment, trauma flags

---

## Success Criteria (Phase 2 Complete)

All of these must be TRUE before Phase 2 is done:

✅ Students can complete intake in 3–4 minutes  
✅ Case formulation returned in <5 seconds (Claude call timeout)  
✅ Session guidance panel displays current phase + recommended next move  
✅ Phase advances every 5 turns (turn-count based)  
✅ 4–6 phase transitions visible during typical 25-turn session  
✅ Feedback summary references case formulation ("In Phase 2, you missed...")  
✅ Intake is optional (users can skip and go straight to session)  
✅ Backward compatible (existing sessions work without intake)  
✅ Turkish language fully supported (UI, AI responses, guidance)  
✅ All frameworks peer-reviewed, source cited  
✅ Zero accessibility violations (WCAG 2.1 AA)  
✅ Lighthouse score ≥ 85 (performance, accessibility, best practices)  

---

## Next Steps

### Immediate (Today)
1. ✅ Read this INDEX.md (you're here)
2. Review README.md as executive summary
3. Confirm spec aligns with your understanding of Phase 2

### Short Term (This Week)
1. Assign engineers to tasks
2. Create tickets in project management tool
3. Start T-001 (TypeScript types) — foundation for everything else

### Medium Term (Weeks 1–8)
1. Follow task breakdown in `tasks.md`
2. Maintain dependency graph discipline (don't start task until prerequisites done)
3. Refer to `handoff.md` for common pitfalls, testing checklist
4. Weekly progress sync against critical path

### Quality Gates Before Shipping
1. All 28 tasks complete (green checkmarks in tasking tool)
2. E2E test passes (T-021)
3. Accessibility audit passes (T-024)
4. Staging QA sign-off (T-027)
5. Release notes published (T-028)

---

## Document Statistics

| Document | Pages | Words | Read Time | Focus |
|----------|-------|-------|-----------|-------|
| README.md | 5 | 1,200 | 5 min | Quick overview, vision |
| spec.md | 24 | 7,500 | 20 min | Requirements, design |
| research.md | 30 | 9,000 | 25 min | Academic, codebase analysis |
| tasks.md | 25 | 8,500 | 30 min | Implementation, task breakdown |
| handoff.md | 10 | 3,000 | 15 min | Builder guide, pitfalls |
| **TOTAL** | **94** | **29,200** | **95 min** | Complete spec |

---

## Contact & Support

**For spec clarifications:** Refer to the appropriate document:
- "What are the requirements?" → `spec.md`
- "Why was this decision made?" → `research.md` or `spec.md` Open Questions
- "How do I implement task T-###?" → `tasks.md` + `handoff.md`

**For implementation blockers:**
- Check `handoff.md` "Common Pitfalls" first
- Escalate with: task number, what you're trying to do, what you tried, what's blocking you

**For bugs/issues:**
- Log with task reference (e.g., "#T-012: IntakeFlow validation fails on Safari")
- Include: what you expected, what happened, steps to reproduce

---

**This specification is COMPLETE and READY for `/forge-spec` implementation.**

All requirements documented. All tasks defined with dependencies. All academic sources cited. Turkish language support fully planned. Implementation path clear.

Proceed to `/forge-spec @2026-05-17-clinical-psychology-platform` to begin TDD Phase 2 build.
