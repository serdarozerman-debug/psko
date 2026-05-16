# Spec Shaping

> **When to invoke:** When shaping a new specification from a feature request.
> **Invoked by:** `/catalyze-spec` command.
> **Orchestrator:** Catalyst agent.

## Purpose

Orchestrate the full spec-shaping workflow: requirements gathering, research, design validation, and spec compilation.

## Skills Referenced

- `brainstorming` — Oracle uses during requirement gathering
- `agent-delegation` — Orchestrator follows delegation rules

## Output Location

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           # Scribe owns
├── research.md       # Scout, Seer, Oracle append to
├── handoff.md        # Living document, updated throughout
└── assets/           # Images, diagrams, mockups
```

**All outputs go to the spec folder. Do NOT allow agents to create files elsewhere.**

In agent prompts, include exact file paths:
- "Append findings to `.catalyst/specs/{slug}/research.md`"
- "Create spec.md at `.catalyst/specs/{slug}/spec.md`"

## Parallel Execution

```
WRONG:  oracle → seer → scout → surveyor (one by one)
RIGHT:  oracle → [seer + scout + surveyor] (parallel research)
```

| Independent (Parallelize) | Dependent (Sequential) |
|---------------------------|------------------------|
| Seer + Scout + Surveyor | Oracle → All (need requirements first) |
| All research agents | Research → Scribe (compile after) |

## Workflow

### Phase 0: Roadmap Impact Assessment

1. Read `.catalyst/main/roadmap.md` if present
2. Analyze request scope:
   - **Small**: Minor feature, bug fix → proceed directly
   - **Large**: Major feature, architectural change → update roadmap first
3. Update roadmap if large request impacts it

### Phase 1: Initialize Spec Folder

Create the spec structure:
```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md
├── research.md
├── handoff.md
└── assets/
```

### Phase 2: Requirements Gathering (Oracle)

Spawn Oracle agent:
```
"Gather requirements for [feature]. Hand off findings to Scribe for spec.md creation at:
.catalyst/specs/{YYYY-MM-DD-slug}/spec.md"
```

Oracle will use the `brainstorming` skill:
1. Ask questions one at a time
2. Present multiple choice with recommendations
3. Maximum 3 rounds of 3 questions
4. Hand off synthesized requirements

### Phase 3: Research (Seer + Scout) — PARALLEL

Spawn in parallel:
```
Seer: "Analyze codebase for [feature]. Append findings to:
.catalyst/specs/{slug}/research.md under '## Codebase Analysis'"

Scout: "Research best practices for [feature]. Append findings to:
.catalyst/specs/{slug}/research.md under '## External Research'"
```

### Phase 4: UI Research (Surveyor) — If Applicable

Spawn Surveyor:
```
"Research UI patterns for [feature]. Save references to:
.catalyst/specs/{slug}/assets/"
```

### Phase 5: Design Validation (Orchestrator — Direct)

**Before compiling the final spec, validate the proposed design with the user.**

This phase is handled directly (no agent spawn):

1. Synthesize findings from Oracle, Seer, Scout, Surveyor
2. Present the proposed design in sections (200-300 words each):
   - Architecture overview
   - Key components and data flow
   - Technical approach (based on research)
   - Edge cases and error handling
3. After each section, ask: "Does this look right so far?"
4. If pushback: adjust and re-present that section
5. If approved: proceed to Scribe compilation

**Why:** Catches misunderstandings before they become a full spec document.

### Phase 6: Compile Specification (Scribe)

Spawn Scribe:
```
"Compile specification from gathered research and VALIDATED design. Create spec.md at:
.catalyst/specs/{slug}/spec.md"
```

### Spec Template

```markdown
# {Feature Name}

> Status: DRAFT

## Overview
[Brief description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [ ] REQ-001: Description

### Non-Functional
- [ ] PERF-001: Response time < 200ms
- [ ] SEC-001: Data encrypted at rest

## Acceptance Criteria
1. [Verifiable criterion]

## Technical Approach
[Based on research findings]

## Out of Scope
- [Explicitly excluded items]

## Open Questions
- [Any remaining unknowns]
```

## Output

```
Spec shaped successfully!

Created: .catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md      <- Requirements documented
├── research.md  <- Research findings
├── handoff.md   <- Living document
└── assets/      <- UI references (if any)

REMINDER: /forge-spec follows strict TDD
  1. Tests written FIRST (Enforcer)
  2. Tests must FAIL (red phase)
  3. Then implement (Builders)
  4. Tests must PASS (green phase)

Next steps:
- /challenge-spec @YYYY-MM-DD-{slug} (optional) to interrogate every branch before tests are written
- /forge-spec @YYYY-MM-DD-{slug} to start TDD build
```

**IMPORTANT: Do NOT suggest `/seal-spec` after spec shaping.** `/seal-spec` is only for committing a fully built and validated implementation — it is the FINAL step, not a plan-approval step. The correct flow is: `/catalyze-spec` → *(optional)* `/challenge-spec` → `/forge-spec` → `/audit-spec` → `/seal-spec`.
