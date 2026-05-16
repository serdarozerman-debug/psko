# Handoff: Dual-Role Simulation Flows

> Status: IN-PROGRESS

## TL;DR

This iteration adds dual-role learning to PSKO. Students now choose their role at session start:

- **Client mode** — Student is the patient; PSKO acts as a skilled psychologist. Ends with an emotional experience debrief.
- **Therapist mode** — Student is the therapist; PSKO acts as a patient persona. Ends with a CTS-R competency report (existing behaviour, preserved).

## What This Iteration Covers

- `RoleMode` enum added to the Prisma `Session` schema
- `buildSystemPrompt(persona, roleMode)` and `buildFeedbackPrompt(transcript, roleMode)` extracted to `src/lib/prompts/`
- `RoleModeSelector` component inserted between persona card selection and session creation
- Session start and end APIs updated to pass and use `roleMode`
- `FeedbackReport` component updated to render either debrief or competency report
- Dashboard history shows role mode badge per session
- Both modes smoke-tested in production

## Key Decisions

- `roleMode` defaults to `THERAPIST` — all existing sessions and forward-compatible migrations are unaffected
- The same five MVP personas are reused in both modes; no new persona data is required
- Feedback format is branched purely at the prompt level; stored as JSON in the same `feedback` column

## Next Lifecycle Step

Run `/forge-spec @2026-05-16-authenticated-simulation-flow` to build and validate the dual-role simulation flows.
