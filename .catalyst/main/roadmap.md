# Roadmap: PSKO

## Phase 1 — Foundation (MVP) [Current]

**Goal:** A working simulation loop with one therapeutic approach and a small persona library.

- [ ] Project setup: Next.js + TypeScript + Tailwind + Supabase
- [ ] User auth (sign up / sign in)
- [ ] Persona engine: structured cognitive model (core beliefs, automatic thoughts, emotional state, disorder profile)
- [ ] Simulation chat interface (student ↔ AI patient)
- [ ] CBT approach guidance panel (suggested questions, technique prompts)
- [ ] Basic session feedback (AI supervisor summary after session ends)
- [ ] 5 initial personas covering: depression, anxiety, relationship issues, grief, workplace burnout
- [ ] Deploy to Vercel

**Exit criteria:** A student can start a session, conduct a simulated intake interview, and receive feedback.

---

## Phase 2 — Multi-Approach & Feedback Depth

**Goal:** Cover all major therapeutic approaches; richer, competency-based feedback.

- [ ] Psychodynamic approach module (defense mechanisms, transference cues, childhood patterns)
- [ ] Humanistic/Person-Centered module (empathy ladder, unconditional positive regard prompts)
- [ ] ACT module (psychological flexibility, defusion, values clarification)
- [ ] DBT module (distress tolerance, emotion regulation, interpersonal effectiveness)
- [ ] Competency scoring system (based on CTS-R domains: agenda setting, collaboration, empathy, technique use)
- [ ] Session history and progress dashboard
- [ ] Expand persona library to 20+ profiles (trauma, OCD, personality disorders, psychosis, addiction)

---

## Phase 3 — Educator Features & Scale

**Goal:** Institutional adoption by psychology programs.

- [ ] Educator dashboard (assign personas, track student progress, set learning objectives)
- [ ] Cohort management (classes, groups)
- [ ] Standardized assessment reports (competency scores over time)
- [ ] Custom persona builder (educators create their own cases)
- [ ] LMS integration (Canvas, Moodle)
- [ ] Multi-language support (Turkish as second language after English)

---

## Phase 4 — Mobile & Advanced Features

**Goal:** Expand reach; add advanced simulation capabilities.

- [ ] React Native mobile app (iOS & Android)
- [ ] Voice-based simulation (speech-to-text interaction)
- [ ] Crisis simulation module (suicidal ideation, acute distress — with special safety guardrails)
- [ ] Peer comparison and leaderboards (optional, opt-in)
- [ ] API for third-party integration

---

## Deferred (Post-MVP)

- Real-time AI supervision during session (not just post-session)
- Multi-student collaborative sessions (two students, one patient)
- Biometric feedback integration (anxiety detection via webcam)
