# Research: Dual-Role Simulation Flows

## Context

The MVP shipped with a single learning mode: the student acts as therapist and PSKO portrays a patient. User feedback established that PSKO must also support the inverse: the student as patient/client, with PSKO playing a skilled psychologist. This is educationally significant — experiencing therapy from the inside builds empathy and self-awareness in trainee therapists.

## Current Architecture

The existing simulation pipeline is:

1. `POST /api/session/start` — creates a `Session` row, generates an initial AI patient message using a system prompt built from the selected persona
2. `POST /api/session/message` — appends a student turn, calls Claude with full transcript, returns AI patient response
3. `POST /api/session/end` — calls Claude with full transcript + CTS-R scoring prompt, stores feedback JSON
4. Session page renders chat or `FeedbackReport` depending on `endedAt`

**Key finding:** The existing system prompt logic and feedback prompt are hard-coded for a single direction (student = therapist, PSKO = patient). There is no `roleMode` concept in the schema or API.

## Required Changes

### 1. Prisma Schema

Add a `RoleMode` enum and a `roleMode` field to the `Session` model:

```prisma
enum RoleMode {
  THERAPIST  // student is the therapist (default, existing behaviour)
  CLIENT     // student is the client/patient
}

model Session {
  // ... existing fields ...
  roleMode  RoleMode  @default(THERAPIST)
}
```

Default `THERAPIST` keeps existing sessions forward-compatible.

### 2. System Prompt Branching

**THERAPIST mode** (existing, unchanged): PSKO plays the patient persona — presents the disorder profile, responds emotionally, simulates authentic patient behaviour.

**CLIENT mode** (new): PSKO plays a competent psychologist. The same persona's disorder profile becomes the _treatment focus_, not the speaker's identity. The AI opens warmly, sets an agenda, uses CBT/empathic techniques, and responds to whatever the student (in patient role) says.

A new `src/lib/prompts/` module should export `buildSystemPrompt(persona, roleMode)` and `buildFeedbackPrompt(transcript, roleMode)`.

### 3. Feedback Branching

**THERAPIST mode** (existing): CTS-R competency scoring — empathy, structure, technique use, collaboration.

**CLIENT mode** (new): Emotional experience debrief — what the student as patient may have felt, what felt helpful or unhelpful, normalising observations, and optionally a brief note on the therapeutic technique used by the AI therapist.

### 4. Dashboard UX

Currently, clicking a persona card immediately starts a session. A `RoleModeSelector` modal or inline selector must be inserted before session creation, letting the student pick their role. This is a mandatory gate — the `roleMode` must be known before `POST /api/session/start`.

### 5. Session History

The dashboard history list must show a role badge (e.g. "🎭 Client" / "🩺 Therapist") per session so students can track their practice across both modes.

## Risk Areas

### Prompt Quality

The CLIENT mode psychologist prompt needs careful authoring. PSKO must:
- Not break character (not suddenly evaluate the student)
- Use real therapeutic techniques appropriate to the persona's presentation
- End gracefully when the student decides to close the session

### Backward Compatibility

Existing sessions in the DB have no `roleMode`. The Prisma migration must default them to `THERAPIST` cleanly.

### Feedback Report Rendering

`FeedbackReport` currently assumes CTS-R structure. It must conditionally render the debrief format when `roleMode === 'CLIENT'`.

## Production Smoke Test Plan

After implementation, validate both modes in production:

1. Sign in with test account
2. Select a persona → choose **Therapist** mode → complete session → verify CTS-R feedback renders
3. Select a persona → choose **Client** mode → complete session → verify emotional debrief renders
4. Confirm both sessions appear in dashboard history with correct role badges
5. Confirm unauthenticated access to session APIs still returns 401
