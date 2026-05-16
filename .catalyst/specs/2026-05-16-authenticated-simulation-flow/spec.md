---
spec: 2026-05-16-authenticated-simulation-flow
status: in-progress
domain: simulation

provides:
  - Dual-role simulation modes: student-as-client and student-as-therapist
  - Mode selection UI on the dashboard before each session
  - Adaptive AI behaviour: PSKO acts as psychologist in client mode and as client in therapist mode
  - Per-mode feedback: emotional experience summary for client mode; competency-based report for therapist mode
  - Verified authenticated end-to-end session flow for both modes

requires:
  - spec: 2026-05-16-simulation-mvp
    needed: Existing auth, persona engine, Claude API pipeline, session persistence

affects:
  - Dashboard session-launch UX
  - Session chat behaviour and system prompt selection
  - Feedback report structure and content
  - Prisma session schema (roleMode field)

patterns_established:
  - role-mode branching pattern for multi-persona AI interactions
key_files: []
key_decisions:
  - Two distinct role modes are first-class session attributes, not a post-MVP add-on
  - PSKO system prompt differs fundamentally between modes; same persona can be reused in both
  - Feedback generation is mode-aware: emotional debrief vs. competency scoring
---

# Dual-Role Simulation Flows

> Status: IN-PROGRESS

## Overview

Expand PSKO beyond a single learning mode. Psychology students will choose their role before each session:

- **Client Mode** — The student acts as the patient/client. PSKO plays the psychologist, guides the conversation, uses therapeutic techniques, and ends the session with an emotional experience debrief for the student.
- **Therapist Mode** — The student acts as the psychologist. PSKO plays a patient persona, presents a clinical scenario, responds authentically to student interventions, and ends the session with a competency-based feedback report (CTS-R style).

Both modes run on the same authenticated session infrastructure. The MVP persona library is reused in both; what changes is the system prompt logic and the feedback generation.

## User Stories

- As a psychology student, I want to choose whether I will act as the client or the therapist before I start a session so that I can practise both sides of therapy
- As a student in client mode, I want PSKO to act as a supportive, skilled psychologist so that I experience what a therapeutic session feels like from the inside
- As a student in client mode, I want an emotional experience debrief at the end so that I can reflect on what the session triggered in me
- As a student in therapist mode, I want PSKO to portray a realistic patient so that I can practise conducting an actual interview and applying techniques
- As a student in therapist mode, I want competency-based feedback at the end so that I know which clinical skills I demonstrated and where I need to improve
- As a returning student, I want my dashboard history to show which mode each past session used so that I can track progress across both learning directions

## Requirements

### Functional

- [ ] REQ-001: Dashboard must present a role-mode selector (Client / Therapist) before launching a session
- [ ] REQ-002: Session record must store a `roleMode` field (`CLIENT` | `THERAPIST`) set at creation time
- [ ] REQ-003: Session start API must select the correct system prompt based on `roleMode`
  - `CLIENT` mode: PSKO behaves as a psychologist conducting a session with the student as patient
  - `THERAPIST` mode: PSKO behaves as a patient/client responding to the student's interventions
- [ ] REQ-004: The first AI message in `CLIENT` mode must be a therapist-style opening (warm greeting, agenda setting)
- [ ] REQ-005: The first AI message in `THERAPIST` mode must be a patient-style opening (brief presenting problem, emotional cue)
- [ ] REQ-006: Ending a session must generate mode-appropriate feedback
  - `CLIENT` mode: emotional experience debrief (what the student may have felt, what was helpful)
  - `THERAPIST` mode: competency scoring (empathy, technique use, structure, collaboration per CTS-R)
- [ ] REQ-007: Dashboard session history must display the role mode badge alongside each past session
- [ ] REQ-008: Error states in both modes must surface actionable UI feedback instead of silent failure

### Non-Functional

- [ ] REL-001: Both modes must complete a full session successfully in production
- [ ] OBS-001: AI failures in either mode must be diagnosable from logs or explicit error responses
- [ ] UX-001: Role-mode selection must be clear, low-friction, and not require documentation to understand

## Acceptance Criteria

1. An authenticated student can select Client mode, receive a therapist-style opening from PSKO, exchange messages, end the session, and see an emotional debrief
2. An authenticated student can select Therapist mode, receive a patient-style opening from PSKO, exchange messages, end the session, and see a CTS-R competency report
3. Both completed sessions appear in dashboard history with their role mode clearly labelled
4. Protected routes and APIs continue to reject unauthenticated access
5. A documented smoke-test checklist covers both modes for future production validation

## Technical Approach

### Schema Change

Add `roleMode` enum (`CLIENT`, `THERAPIST`) to the `Session` model in `prisma/schema.prisma`. Default: `THERAPIST` (preserves backward compatibility with existing sessions).

### System Prompt Branching

- Extract a `buildSystemPrompt(persona, roleMode)` function in `src/lib/prompts/`
- `THERAPIST` mode: existing patient-persona prompt (unchanged)
- `CLIENT` mode: new psychologist-persona prompt that references the same persona's disorder profile as the treatment focus

### Feedback Branching

- Extract a `buildFeedbackPrompt(transcript, roleMode)` function
- `THERAPIST` mode: existing CTS-R competency scoring prompt (unchanged)
- `CLIENT` mode: new emotional debrief prompt asking Claude to reflect on what the student-as-client experienced

### UI Changes

- Add `RoleModeSelector` component to `src/components/simulation/`
- Dashboard persona card → clicking opens mode selector before navigating to session
- Session history card shows role mode badge

### Implementation Areas

- `psko-app/prisma/schema.prisma` — add `RoleMode` enum and `roleMode` field to `Session`
- `psko-app/src/lib/prompts/` — new module for prompt builders
- `psko-app/src/app/api/session/start/route.ts` — pass `roleMode` through
- `psko-app/src/app/api/session/end/route.ts` — use `roleMode` for feedback prompt selection
- `psko-app/src/app/dashboard/page.tsx` — add mode selection step
- `psko-app/src/components/simulation/RoleModeSelector.tsx` — new component
- `psko-app/src/components/simulation/FeedbackReport.tsx` — render debrief vs. competency report

## Out of Scope

- New therapeutic approaches (Phase 2)
- Educator dashboard
- Mobile app
- Persona authoring tools
- Real-time supervision during session

## Open Questions

- Should client-mode feedback also include a short psychoeducation note (e.g. what technique the AI psychologist used)?
- Should a student be able to switch mode mid-session or only at session start?
- Should the persona library surface different metadata depending on mode (e.g. hide clinical notes in client mode)?
