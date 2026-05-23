# Roadmap: PSKO

## Phase 1 — Foundation (MVP) ✅ Complete

**Goal:** A working simulation loop with one therapeutic approach and a small persona library.

- [x] Project setup: Next.js + TypeScript + Tailwind + Supabase
- [x] User auth (sign up / sign in)
- [x] Persona engine: structured cognitive model (core beliefs, automatic thoughts, emotional state, disorder profile)
- [x] Simulation chat interface (student ↔ AI patient)
- [x] CBT approach guidance panel (suggested questions, technique prompts)
- [x] Basic session feedback (AI supervisor summary after session ends)
- [x] 5 initial personas covering: depression, anxiety, relationship issues, grief, workplace burnout
- [x] Deploy to Vercel — https://psko-app.vercel.app
- [x] **Dual-role simulation modes** — student-as-client (PSKO plays psychologist) and student-as-therapist (PSKO plays patient); per-mode feedback (emotional debrief vs. CTS-R competency report)

**Exit criteria:** A student can start a session, conduct a simulated intake interview, and receive feedback. ✅ Met.

---

## Phase 2 — Clinical Intelligence Engine ✅ Complete

**Goal:** Academically grounded clinical training — intake, case formulation, and real-time protocol guidance.

### 2A — Infrastructure ✅
- [x] **Next.js upgrade** — 14.2.35 has 0 CVEs (patched in 14.2.x series)
- [x] **E2E test suite** — Playwright: 4 scenarios + axe-core a11y + seed helper

### 2B — Clinical Intelligence Engine ✅ (`spec: 2026-05-16-clinical-intelligence-engine`)
- [x] **Clinical Framework Library** — CBT/Psychodynamic/ACT/DBT/Humanistic with full protocol phases
- [x] **Pre-session intake questionnaire** — PHQ-9+GAD-7 inspired; Claude formulation + approach recommendation
- [x] **Dynamic session guidance panel** — Phase-aware; server-authoritative with illegal-jump rejection
- [x] **Phase 2 Hardening** — HybridFrameworkViewer, CI pipeline, API docs, coverage thresholds

### 2C — Persona Expansion [Next]
- [ ] Expand persona library to 20+ profiles (trauma, OCD, personality disorders, psychosis, addiction)
- [ ] SCID-5 enrichment of all personas (symptom onset timeline, functional impairment, trauma flags)

---

## Phase 3 — Educator Features & Scale

**Goal:** Institutional adoption by psychology programs.

- [ ] Educator dashboard (assign personas, track student progress, set learning objectives)
- [ ] Cohort management (classes, groups)
- [ ] Standardized assessment reports (competency scores over time)
- [ ] Custom persona builder (educators create their own cases)
- [ ] LMS integration (Canvas, Moodle)

---

## Phase 4 — Multimodal Simulation

**Goal:** Voice and video simulation for maximum realism.

- [ ] **Voice interface** — Web Speech API (STT) + ElevenLabs/OpenAI TTS; student speaks, AI patient responds with synthesized voice
- [ ] **Live video avatar** — Realistic AI therapist/patient avatar via D-ID or HeyGen API; lip-synced to TTS audio (requires voice interface first)
- [ ] **Emotion recognition** — Webcam-based facial expression analysis (face-api.js or Azure Face API) during video sessions; AI adapts next response to detected emotional state (requires video first; explicit consent required)

## Phase 5 — Mobile & Expansion

**Goal:** Reach and scale.

- [ ] React Native mobile app (iOS & Android)
- [ ] Crisis simulation module (suicidal ideation, acute distress — with special safety guardrails)
- [ ] Multi-language support (Turkish as primary second language)
- [ ] API for third-party LMS integration (Canvas, Moodle)
- [ ] Peer comparison and leaderboards (optional, opt-in)

---

## Deferred (Post-MVP)

- Real-time AI supervision during session (not just post-session)
- Multi-student collaborative sessions (two students, one patient)
