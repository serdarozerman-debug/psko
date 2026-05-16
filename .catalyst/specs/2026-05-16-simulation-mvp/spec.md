---
spec: 2026-05-16-simulation-mvp
status: validating
domain: core

provides:
  - Next.js 14 web application scaffold
  - Supabase auth (email/password)
  - Prisma schema (users, personas, sessions, messages)
  - Persona library (5 personas, JSON cognitive models)
  - Therapeutic approach modules (CBT, psychodynamic, humanistic, ACT, DBT)
  - Claude patient agent (streaming)
  - Claude supervisor agent (post-session feedback)
  - API routes: /api/session/start, /api/session/message, /api/session/end
  - UI: persona selector, simulation chat, guidance panel, feedback report, dashboard
  - Deployed to Vercel

requires: []

affects:
  - All future specs (this is the foundation)

patterns_established: []
key_files: []
key_decisions:
  - Claude API over GPT-4o for persona fidelity
  - Next.js App Router (server components + API routes)
  - Supabase for auth + DB (managed, free tier)
  - Prisma as ORM
  - Cognitive model injected as structured JSON in system prompt
  - Supervisor agent is a separate Claude call post-session
---

# Simulation MVP

> Status: VALIDATING

## Overview

Build the complete PSKO MVP: a web application where psychology students practice clinical interviews with AI-powered patient personas, receive real-time guidance on therapeutic technique, and get structured competency feedback after each session.

## User Stories

- As a student, I want to select a patient persona and therapeutic approach so that I can practice a targeted clinical skill
- As a student, I want to chat with a realistic AI patient so that I experience authentic clinical dialogue
- As a student, I want to see suggested questions and technique hints during a session so that I'm guided without being told exactly what to say
- As a student, I want to receive structured feedback after my session so that I can identify where I performed well and where to improve
- As a student, I want to see my session history so that I can track my progress over time
- As a student, I want to log in securely so that my practice data is private

## Requirements

### Functional

- [ ] REQ-001: Users can register and log in via email/password (Supabase Auth)
- [ ] REQ-002: Authenticated users can browse a persona library (name, age, presenting problem, difficulty, recommended approaches)
- [ ] REQ-003: Users can select a persona + therapeutic approach and start a simulation session
- [ ] REQ-004: The AI patient responds in real-time (streaming) consistent with its cognitive model and conversational style
- [ ] REQ-005: A guidance panel shows approach-specific hints and suggested questions (not sent to Claude)
- [ ] REQ-006: Users can end a session at any time
- [ ] REQ-007: On session end, a supervisor agent analyzes the transcript and returns structured CTS-R feedback
- [ ] REQ-008: Feedback report shows: overall score, competency breakdown (9 domains), strengths, areas for improvement, key session moments
- [ ] REQ-009: Dashboard shows list of completed sessions with persona, approach, score, and date
- [ ] REQ-010: Session length capped at 60 turns (patient messages) to control API cost

### Non-Functional

- [ ] PERF-001: Patient response streaming begins within 1s of student message submission
- [ ] PERF-002: Supervisor feedback delivered within 15s of session end
- [ ] SEC-001: Anthropic API key never exposed to client — all Claude calls server-side only
- [ ] SEC-002: Supabase RLS ensures users can only read their own sessions and messages
- [ ] ACC-001: Responsive layout works on desktop and tablet (iPad)

## Acceptance Criteria

1. A student can register, log in, select a persona, conduct a full simulation chat, end the session, and view a feedback report — without any errors
2. The AI patient maintains its cognitive model and conversational style throughout the session (no character breaks, no clinical jargon)
3. The guidance panel shows at least 3 relevant hints for the selected therapeutic approach
4. The feedback report scores all 9 CTS-R competency domains with a comment for each
5. Session history on dashboard shows all past sessions for the logged-in user
6. All Claude API calls are made from Next.js API routes (never from the browser)

## Technical Approach

### Persona Cognitive Model → System Prompt

Each persona is a JSON file. At session start, the JSON is serialized into a structured system prompt for Claude. The prompt includes: identity, cognitive model (core beliefs, automatic thoughts, emotional state), conversational style rules, disorder context, and approach-specific behavioral instructions.

### Streaming Patient Responses

`POST /api/session/message` pipes a `ReadableStream` from the Anthropic SDK directly to the browser using Next.js streaming response. The client uses the Fetch API with `response.body.getReader()` to display tokens as they arrive.

### Supervisor Agent

`POST /api/session/end` retrieves the full transcript from DB, calls Claude with a supervisor system prompt and the transcript, and requests a structured JSON response scored against 9 CTS-R domains. This call is non-streaming.

### Database Schema (Prisma)

```
User         — id, email, created_at
Persona      — id, name, age, difficulty, cognitive_model (JSON), ...
Session      — id, user_id, persona_id, approach, started_at, ended_at, turn_count, feedback (JSON)
Message      — id, session_id, role (student|patient), content, created_at
```

### Auth Flow

Supabase Auth with email/password. JWT stored in httpOnly cookie. Next.js middleware protects `/dashboard` and `/session` routes. Server components read the session from cookie.

## Out of Scope

- OAuth (Google, GitHub) — Phase 2
- Psychodynamic / ACT / DBT approach guidance panels (MVP ships CBT guidance only; other approaches available but guidance panel shows generic hints)
- Custom persona builder
- Mobile app
- Crisis simulation (suicidal ideation)
- Educator dashboard

## Open Questions

- Supabase project needs to be created and `.env.local` populated before DB work begins
- Anthropic API key required in `.env.local`
- Vercel project setup for deployment (post-MVP)
