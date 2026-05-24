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

## Role-Mode Branching Convention

Sessions carry a `roleMode` field (`THERAPIST` | `CLIENT`) that drives both AI behaviour and feedback generation.

- System prompt selection: `roleMode === 'CLIENT'` → `buildTherapistPrompt(persona)` else `buildPatientPrompt(persona, approach)`
- Feedback selection: `roleMode === 'CLIENT'` → `ClientDebrief` else `SupervisorFeedback`
- `Message.role` is always `student` (human) or `patient` (AI) — structural identifiers only
- The AI's character (psychologist vs patient persona) is inferred from `Session.roleMode`, not from `Message.role`
- New modes must add a branch in `patient-agent.ts` and `supervisor-agent.ts`; they do NOT require new API routes

## Educator / Auth Conventions

- Route auth guards: call `requireEducator(supabase, prisma)` inside a try/catch; map auth errors with `mapAuthError(err)` (returns NextResponse or null)
- All `/api/educator/*` routes must call `requireEducator` — never rely solely on middleware
- `getRoleFromJwt(jwt)` reads `app_metadata.role` from Supabase JWT; returns `UserRole` enum or `STUDENT` as default
- Supabase custom access token hook (`prisma/sql/access_token_hook.sql`) must be enabled in Supabase dashboard → Database → Functions after every `db reset`

## Join Code Conventions

- Join codes use a 32-char alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes 0/O/1/I/l to avoid visual ambiguity)
- Length: 6 characters; generated via `crypto.randomBytes` + rejection sampling (no modulo bias)
- Codes stored uppercase; `/api/join/[code]` normalises input with `.toUpperCase()` before lookup

## Deep-Link JWT Conventions

- Deep-link tokens: HS256, 7-day expiry, signed with `DEEPLINK_JWT_SECRET` env var (throws on missing — no fallback)
- Payload: `{ assignmentId: string, cohortId: string }`
- Mint: `mintDeepLinkToken(payload)` — Verify: `verifyDeepLinkToken(token)` (returns null on any failure)

## CSV Export Conventions

- Always write UTF-8 BOM (`﻿`) at start of CSV for Excel compatibility
- Use `Content-Disposition: attachment; filename="..."` response header

## Testing Conventions

- Unit tests for: prompt builders, persona schema validation, approach configs
- Integration tests for: API routes (with mocked Claude responses)
- E2E tests for: full simulation flow (Playwright)
- Test files co-located: `patient-agent.test.ts` next to `patient-agent.ts`
- No testing of UI snapshots — prefer behavior tests
- **Test runner:** `node --require tsx/cjs --test src/**/*.test.ts` (node:test + tsx/cjs)
  — vitest and jest hang on this codebase due to an esbuild IPC deadlock (macOS arm64, Node 20)

## Ethical Conventions

- Personas do NOT include explicit suicidal ideation in MVP (Phase 4 only, with guardrails)
- All personas are fictional composites — never re-created from real cases
- Student data is private by default — no sharing without explicit opt-in
- The system never implies the student's response was clinically harmful
- Feedback is constructive and educational, never punitive
