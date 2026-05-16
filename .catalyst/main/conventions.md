# Conventions: PSKO

## File & Folder Naming

- React components: `PascalCase.tsx` (e.g., `ChatInterface.tsx`)
- Utilities, hooks, lib: `camelCase.ts` (e.g., `patientAgent.ts`, `useSession.ts`)
- API route handlers: `route.ts` (Next.js App Router convention)
- Persona JSON files: `kebab-case.json` (e.g., `sarah-depression-beginner.json`)
- Therapeutic approach modules: `kebab-case.ts` (e.g., `cbt.ts`, `act.ts`)

## TypeScript Conventions

- Prefer `interface` over `type` for domain objects (Persona, Session, Message)
- Use `type` for unions and primitives (TherapeuticApproach, ConversationalStyle)
- All API request/response bodies validated with Zod schemas
- No `any` — use `unknown` and narrow explicitly
- Exported types live in `src/types/` or co-located with their module

## Component Conventions

- Server Components by default (Next.js App Router)
- Add `'use client'` only when interactivity requires it (chat input, streaming)
- Props interfaces defined inline above the component
- No default exports for utilities — named exports only
- Default exports only for page components (Next.js requirement)

## API Route Conventions

```typescript
// Standard API route shape
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = SessionStartSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // ... handler logic
}
```

- Always validate input with Zod before processing
- Return `Response.json()` with appropriate status codes
- Streaming responses use `ReadableStream` / `TransformStream`
- API keys never leave the server — all Claude calls in API routes

## Claude API Conventions

- Use `stream: true` for patient simulation responses (perceived responsiveness)
- Set `max_tokens` explicitly for all calls
- System prompts are pure functions: `buildPatientPrompt(persona, approach) → string`
- Supervisor calls are non-streaming (full JSON response expected)
- Prompt builders in `src/lib/claude/prompts/` — one file per agent type

## Database Conventions

- All DB access through Prisma client (`src/lib/db/prisma.ts`)
- Never raw SQL except for complex analytics queries
- Row-Level Security (RLS) enabled on all Supabase tables
- `created_at` and `updated_at` on every table (auto-managed)
- Soft deletes for sessions (`deleted_at` nullable timestamp)

## Persona Library Conventions

- Each persona is a JSON file in `src/lib/personas/library/`
- Filename format: `{first-name}-{primary-disorder}-{difficulty}.json`
- All personas use fictional names and composite backstories — never based on real individuals
- Difficulty levels: `beginner` (cooperative, clear presentation), `intermediate` (some resistance), `advanced` (complex comorbidity, defensiveness)
- Clinical accuracy reviewed against DSM-5 criteria before inclusion

## Therapeutic Approach Modules

Each approach module (`src/lib/approaches/{approach}.ts`) exports:

```typescript
export interface ApproachConfig {
  name: string
  description: string
  systemPromptInstructions: string  // Injected into patient agent
  guidanceHints: string[]           // Shown to student in UI panel
  supervisorCriteria: string[]      // Evaluated in feedback
  suggestedQuestions: string[]      // Initial question bank for students
}
```

## Testing Conventions

- Unit tests for: prompt builders, persona schema validation, approach configs
- Integration tests for: API routes (with mocked Claude responses)
- E2E tests for: full simulation flow (Playwright)
- Test files co-located: `patient-agent.test.ts` next to `patient-agent.ts`
- No testing of UI snapshots — prefer behavior tests

## Ethical Conventions

- Personas do NOT include explicit suicidal ideation in MVP (Phase 4 only, with guardrails)
- All personas are fictional composites — never re-created from real cases
- Student data is private by default — no sharing without explicit opt-in
- The system never implies the student's response was clinically harmful
- Feedback is constructive and educational, never punitive
