# Concerns: PSKO

## Critical

### 1. Persona Fidelity vs. Hallucination
**Risk:** Claude may break character, use clinical terminology, or fabricate symptoms that contradict the cognitive model.
**Mitigation:**
- Strict system prompt rules (no jargon, stay in character)
- Cognitive model injected as structured data, not prose
- Post-session: supervisor agent flags character breaks in transcript
- Human review of new personas before library inclusion

### 2. Ethical Risk — Clinical Accuracy of Feedback
**Risk:** The AI supervisor may give incorrect or misleading feedback on clinical technique, which students could internalize as ground truth.
**Mitigation:**
- Supervisor feedback framed as "training tool guidance" not "clinical standard"
- Clear disclaimer on all feedback: "This is AI-generated educational feedback. Consult your clinical supervisor."
- Feedback grounded in CTS-R criteria (published, verifiable framework)
- ✅ **RESOLVED (Phase 3):** Educator annotation feature shipped — educators can override/annotate AI feedback via `AnnotationEditor` component and `PATCH /api/educator/sessions/[id]/annotation`

### 3. Misuse — Students Using Platform as Real Therapy
**Risk:** Students (or others) might engage with patient personas as if receiving real mental health support.
**Mitigation:**
- Clear onboarding: "This is a training tool for psychology students, not a therapy service"
- Patient personas explicitly begin sessions with "I'm here for a role-play exercise..."
- No crisis resources bypass — if "patient" expresses suicidal ideation (not in MVP), immediate safety message shown
- Terms of Service restrict use to educational purposes

## High Priority

### 4. API Cost Scaling
**Risk:** Claude API costs scale with usage; long sessions with many students could become expensive.
**Mitigation:**
- Session length limits (default: 30 minutes / ~60 turns)
- Prompt caching for static persona system prompts (Anthropic prompt caching)
- Rate limits per user account
- Usage dashboard for self-monitoring

### 5. Persona Library Clinical Validity
**Risk:** Poorly constructed personas may teach students incorrect patterns (e.g., unrealistically cooperative patients, stereotyped presentations).
**Mitigation:**
- Personas designed based on published cognitive model frameworks (Beck, 2020)
- Reference PATIENT-Ψ-CM dataset (106 clinically-reviewed cognitive models, CMU research)
- Difficulty levels prevent advanced presentations for beginners
- Future: clinical psychologist review board for persona library

### 6. Data Privacy (Student Session Transcripts)
**Risk:** Session transcripts contain sensitive simulated clinical content; student performance data is private.
**Mitigation:**
- Supabase RLS: users can only read their own sessions
- Transcripts stored encrypted at rest
- No transcript data used for model training
- KVKK (Turkish data protection law) and GDPR compliance required before international launch

## Medium Priority

### 7. Student Frustration with Realistic Personas
**Risk:** Advanced personas (reserved, upset, tangent styles) may frustrate beginners and reduce engagement.
**Mitigation:**
- Difficulty selector prominently displayed before session
- Beginner personas default to cooperative, clear presentations
- Guidance panel always visible with approach-specific hints
- "Hint" button available (costs no points, just reduces mastery score)

### 8. Approach Selection Without Context
**Risk:** Students may select an inappropriate therapeutic approach for a given persona, then blame the tool when the session goes poorly.
**Mitigation:**
- Persona cards show "Recommended approaches" (without being prescriptive)
- Post-session feedback explicitly addresses approach fit
- Tutorial mode shows correct approach for first 2 sessions

### 9. Mobile UX for Chat Interface
**Risk:** Clinical simulation requires nuanced, longer text input; mobile keyboard UX may be suboptimal.
**Mitigation:**
- MVP is web-only; mobile addressed in Phase 4
- Responsive design from the start (Tailwind)
- Test on iPad as secondary target in Phase 1

## Low Priority / Watch

- Internationalization (Turkish-language personas and UI) — Phase 3
- Accessibility (screen reader support for chat interface) — Phase 2
- Offline mode — not planned (Claude API requires connectivity)
- Multi-user sessions — Phase 4 consideration
