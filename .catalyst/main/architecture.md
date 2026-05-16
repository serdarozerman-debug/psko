# Architecture: PSKO

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                    │
│                                                             │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐  │
│  │  Persona    │   │  Simulation Chat │   │  Feedback   │  │
│  │  Selector   │──▶│  Interface       │──▶│  Dashboard  │  │
│  └─────────────┘   └──────────────────┘   └─────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────┐
│                    Next.js API Routes                       │
│                                                             │
│  POST /api/session/start      — creates session, loads      │
│                                  persona + approach context │
│  POST /api/session/message    — streams patient response    │
│  POST /api/session/end        — triggers supervisor agent   │
│  GET  /api/personas           — returns persona library     │
└──────────┬───────────────────────────────┬──────────────────┘
           │                              │
┌──────────▼──────────┐      ┌────────────▼────────────────────┐
│   Anthropic Claude  │      │          Supabase               │
│                     │      │                                 │
│  Patient Agent:     │      │  users          sessions        │
│  - Persona system   │      │  personas       messages        │
│    prompt           │      │  competency     transcripts     │
│  - Approach context │      │  scores                        │
│  - Streaming turns  │      │                                 │
│                     │      │  Auth (JWT + RLS)               │
│  Supervisor Agent:  │      └─────────────────────────────────┘
│  - Full transcript  │
│  - CTS-R scoring    │
│  - Feedback report  │
└─────────────────────┘
```

## Core Domain Model

### Persona (Cognitive Model)

```typescript
interface Persona {
  id: string
  name: string                    // Fictional name
  age: number
  presenting_problem: string      // What they say at intake
  disorder_profile: string[]      // DSM-5 diagnoses (for context, not disclosed to student)
  core_beliefs: string[]          // "I am worthless", "The world is dangerous"
  intermediate_beliefs: string[]  // Rules and assumptions
  automatic_thoughts: string[]    // Situational cognitions
  emotional_state: EmotionalState
  conversational_style: ConversationalStyle
  therapeutic_approach_hints: TherapeuticApproachHints
  backstory: string               // Rich personal history
  triggers: string[]              // Topics that intensify emotional response
  defenses: string[]              // For psychodynamic (rationalization, projection, etc.)
  values: string[]                // For ACT (what matters to them)
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
}

type ConversationalStyle =
  | 'plain'       // Matter-of-fact
  | 'upset'       // Emotionally activated
  | 'reserved'    // Minimal disclosure
  | 'verbose'     // Over-shares tangentially
  | 'pleasing'    // Tries to give "right" answers
  | 'tangent'     // Drifts off topic

type EmotionalState = {
  primary: string      // e.g., "anxious"
  intensity: 1 | 2 | 3 | 4 | 5
  secondary?: string   // e.g., "ashamed"
}
```

### Session

```typescript
interface Session {
  id: string
  user_id: string
  persona_id: string
  therapeutic_approach: TherapeuticApproach
  role_mode: 'THERAPIST' | 'CLIENT'  // THERAPIST = student plays therapist; CLIENT = student plays patient
  messages: Message[]
  started_at: Date
  ended_at?: Date
  feedback?: SupervisorFeedback | ClientDebrief
}

type TherapeuticApproach =
  | 'cbt'
  | 'psychodynamic'
  | 'humanistic'
  | 'act'
  | 'dbt'

interface SupervisorFeedback {
  overall_score: number           // 0-100 (THERAPIST mode only)
  competency_scores: CompetencyScore[]
  strengths: string[]
  areas_for_improvement: string[]
  key_moments: SessionMoment[]    // Annotated transcript moments
  suggested_readings: string[]
}

interface ClientDebrief {
  type: 'client-debrief'          // Discriminant for union narrowing
  experience_summary: string
  helpful_moments: string[]
  challenging_moments: string[]
  emotional_themes: string[]
  technique_used: string
  reflection_prompts: string[]
}

interface CompetencyScore {
  domain: string    // "Agenda Setting" | "Empathy" | "Technique Use" | ...
  score: number     // 1-6 (CTS-R scale)
  comment: string
}
```

## Key Flows

### 1. Start Simulation Session

```
User selects persona + therapeutic approach + role mode
  → POST /api/session/start { personaId, therapeuticApproach, roleMode }
  → Build system prompt based on roleMode:
       THERAPIST: [Persona cognitive model] + [Approach instructions] (patient persona)
       CLIENT:    [Psychologist persona prompt] + [Presenting problem as treatment focus]
  → Create session record in Supabase (stores roleMode)
  → Return session_id + opening AI statement
```

### 2. Simulation Turn

```
Student types message
  → POST /api/session/message { session_id, content }
  → Append to transcript
  → Stream Claude response (patient persona)
  → Optionally: inject guidance hint in UI (not sent to Claude)
  → Save message pair to DB
```

### 3. End Session & Feedback

```
Student ends session
  → POST /api/session/end { session_id }
  → Retrieve full transcript + session.roleMode
  → Call Claude feedback agent (mode-dependent):
       THERAPIST: Supervisor Agent → CTS-R competency scoring (SupervisorFeedback JSON)
       CLIENT:    Debrief Agent   → Emotional experience debrief (ClientDebrief JSON)
  → Parse structured feedback JSON
  → Save to DB, return to student
```

## Prompt Architecture

### Patient Persona Prompt
```
You are {name}, a {age}-year-old person seeking psychological support.

COGNITIVE MODEL:
- Core beliefs: {core_beliefs}
- Automatic thoughts: {automatic_thoughts}
- Emotional state: {emotional_state} (intensity: {intensity}/5)
- Presenting problem: {presenting_problem}

CONVERSATIONAL STYLE: {style_description}

BEHAVIORAL RULES:
- Stay in character at all times
- Do NOT use clinical jargon
- React emotionally consistent with your cognitive model
- Do NOT make the therapist's job easy — be realistic
- Never break character to explain your psychology

CURRENT APPROACH CONTEXT (therapist is using {approach}):
{approach_specific_instructions}
```

### Supervisor Agent Prompt
```
You are an experienced clinical psychology supervisor evaluating a trainee's session.

THERAPEUTIC APPROACH USED: {approach}
PATIENT PERSONA: {persona_summary}

Evaluate the following transcript against these CTS-R competency domains:
1. Agenda Setting & Adherence
2. Feedback (checking understanding)
3. Collaboration
4. Pacing & Efficient Use of Time
5. Interpersonal Effectiveness
6. Eliciting Appropriate Emotional Expression
7. Eliciting Key Cognitions
8. Guided Discovery
9. Technique Use

TRANSCRIPT:
{transcript}

Return structured JSON feedback.
```

## File Structure (Planned)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── session/
│   │   ├── [id]/
│   │   └── new/
│   └── api/
│       ├── session/
│       │   ├── start/
│       │   ├── message/
│       │   └── end/
│       └── personas/
├── lib/
│   ├── claude/
│   │   ├── patient-agent.ts
│   │   └── supervisor-agent.ts
│   ├── personas/
│   │   ├── schema.ts
│   │   └── library/
│   ├── approaches/
│   │   ├── cbt.ts
│   │   ├── psychodynamic.ts
│   │   ├── humanistic.ts
│   │   ├── act.ts
│   │   └── dbt.ts
│   └── db/
│       └── prisma.ts
├── components/
│   ├── simulation/
│   │   ├── ChatInterface.tsx
│   │   ├── GuidancePanel.tsx
│   │   └── PersonaCard.tsx
│   └── feedback/
│       ├── FeedbackReport.tsx
│       └── CompetencyChart.tsx
└── prisma/
    └── schema.prisma
```
