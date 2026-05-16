# Research: Simulation MVP

## Codebase Analysis

**Workspace type:** Greenfield — no existing source code.

Existing files:
- `package.json` (bare, only `catalyst-os` dependency)
- `.catalyst/` — foundation docs
- `.claude/` — agent + skill definitions
- `AGENTS.md`, `CLAUDE.md`

No prior architectural decisions to respect. Full freedom on stack implementation.

---

## External Research

### AI Patient Simulation Precedents

**PATIENT-Ψ (CMU, 2024)**
- Framework: cognitive model (core beliefs → intermediate beliefs → automatic thoughts → emotions → behaviors) injected into LLM
- 106 human-reviewed cognitive models across diverse clinical presentations
- 6 conversational styles: plain, upset, verbose, reserved, tangent, pleasing
- Key finding: LLM + cognitive model significantly outperforms plain GPT-4 for clinical realism
- Key finding: students rate it more beneficial than peer role-play
- Source: arxiv.org/abs/2405.19660

**CBT Trainer (UCL CORE, 2026)**
- First AI platform to provide real-time feedback against published competence frameworks (CTS-R)
- 59 trainee participants; mean SUS usability score 82.2/100 (excellent)
- Strongest improvements: assessment skills (96.7%), information gathering (66.7%)
- Competency domains used: agenda setting, feedback, collaboration, pacing, interpersonal effectiveness, eliciting cognitions, guided discovery, technique use
- Source: mededu.jmir.org/2026/1/e84091

**SIMmersion PeopleSim (substance use CBT)**
- RCT (N=65 graduate students); simulation group showed significantly better CBT skills vs manual
- Skill improvements: CBT concept understanding (p=.001), explaining CBT (p=.007), agenda setting (p=.03)
- Personas have randomized personalities and relationship states that evolve with student behavior
- Source: simmersion.com/trainingcbt

**Virtual Standardized Patient (PMHNP program)**
- 6 modules across 5 therapy types (CBT, CPT, DBT x2)
- Skills improved in 66.7% of modules, confidence in 66.7%
- Knowledge improved in 50% — suggests simulation better for skills than factual knowledge
- Source: sciencedirect.com (Clinical Simulation in Nursing, 2025)

### Competency Framework: CTS-R (Cognitive Therapy Scale-Revised)

The CTS-R is the international standard for CBT therapist accreditation. 12 competency domains, scored 0–6:
1. Agenda Setting & Adherence
2. Feedback
3. Collaboration
4. Pacing & Efficient Use of Time
5. Interpersonal Effectiveness
6. Eliciting Appropriate Emotional Expression
7. Eliciting Key Cognitions
8. Guided Discovery
9. Conceptual Integration
10. Application of Change Methods
11. Homework Setting
12. Adherence to Protocol

For MVP, we evaluate domains 1–9 (core interaction skills). Domains 10–12 require multi-session context.

### Therapeutic Approach Key Techniques

**CBT:**
- Socratic questioning ("What evidence do you have for that belief?")
- Thought records / ABC model
- Agenda setting at session start
- Identifying automatic thoughts, core beliefs
- Behavioral experiments

**Psychodynamic:**
- Free association encouragement
- Defense mechanism identification (rationalization, projection, denial)
- Transference observations
- Childhood pattern linking
- Affect exploration ("How did that make you feel as a child?")

**Humanistic / Person-Centered:**
- Unconditional positive regard
- Empathic reflection ("It sounds like you're feeling...")
- Avoiding advice; facilitating self-discovery
- Congruence (therapist transparency)
- Present-moment focus

**ACT (Acceptance & Commitment Therapy):**
- Psychological flexibility assessment
- Defusion techniques ("I notice I'm having the thought that...")
- Values clarification
- Committed action toward values
- Present-moment awareness / mindfulness

**DBT (Dialectical Behavior Therapy):**
- Dialectical stance (validation + change simultaneously)
- Distress tolerance (TIPP, ACCEPTS)
- Emotion regulation (identifying, naming, reducing vulnerability)
- Interpersonal effectiveness (DEAR MAN, GIVE, FAST)
- Chain analysis of problem behaviors

### Prompt Engineering for Clinical Personas

Key findings from research:
1. **Structured cognitive model > prose description** — JSON/structured data for core beliefs produces more consistent in-character responses
2. **Explicit anti-jargon rules** — Without these, LLMs use clinical terminology that breaks realism
3. **Conversational style as behavioral rules** — Not just a label; describe specific behaviors ("Answer questions minimally. Rarely volunteer information.")
4. **Approach context injected per session** — Same persona behaves differently depending on what therapeutic approach the student signals they're using
5. **Supervisor is a separate call** — Mixing evaluation into the patient agent degrades persona fidelity

### Next.js + Anthropic Streaming Pattern

```typescript
// API route (server)
export async function POST(req: Request) {
  const stream = await anthropic.messages.stream({ ... })
  return new Response(stream.toReadableStream())
}

// Client
const res = await fetch('/api/session/message', { method: 'POST', body })
const reader = res.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // append decoded chunk to UI
}
```

### Supabase + Prisma Pattern

Prisma connects to Supabase's Postgres via the pooler connection string. Supabase Auth middleware in Next.js reads the JWT cookie and exposes `session.user` in server components. RLS policies enforce data isolation at the DB level even if application logic has bugs.
