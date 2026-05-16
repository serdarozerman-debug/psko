# Tech Stack: PSKO

## Frontend

| Technology | Version | Rationale |
|------------|---------|-----------|
| Next.js | 14 (App Router) | Full-stack React framework; SSR + API routes in one project |
| TypeScript | 5.x | Type safety for complex domain objects (persona, session, competency) |
| Tailwind CSS | 3.x | Rapid UI development; consistent design tokens |
| shadcn/ui | latest | Accessible, unstyled component primitives built on Radix |
| Zustand | 4.x | Lightweight client state (active session, persona selection) |

## Backend / API

| Technology | Version | Rationale |
|------------|---------|-----------|
| Next.js API Routes | — | Co-located with frontend; no separate server needed for MVP |
| Anthropic Claude API | claude-opus-4 | Best-in-class persona coherence, multi-turn dialogue, clinical nuance |
| @anthropic-ai/sdk | latest | Official TypeScript SDK; streaming support |
| Zod | 3.x | Runtime schema validation for persona configs and API payloads |

## Database & Auth

| Technology | Version | Rationale |
|------------|---------|-----------|
| Supabase | — | Postgres + Auth + Realtime in one hosted service; generous free tier |
| Prisma | 5.x | Type-safe ORM; schema-first migrations |
| Supabase Auth | — | Email/password + OAuth; JWT-based |

## AI Simulation Engine

The simulation engine is the core of PSKO. Architecture:

```
Persona Cognitive Model (JSON)
  └── Injected as system prompt into Claude
        └── Conversational styles (plain, upset, reserved, verbose, pleasing, tangent)
              └── Real-time student ↔ patient dialogue
                    └── Post-session: supervisor agent analyzes transcript → feedback
```

**Prompt layers:**
1. **System prompt:** Persona cognitive model (core beliefs, automatic thoughts, disorder profile, conversational style, therapeutic context)
2. **Therapeutic approach context:** Injected per session (CBT schema, psychodynamic lens, ACT matrix, etc.)
3. **Supervisor agent:** Separate Claude call analyzing full transcript against CTS-R competency domains

## Infrastructure

| Technology | Rationale |
|------------|-----------|
| Vercel | Zero-config Next.js deployment; edge functions for streaming |
| Supabase (hosted) | Managed Postgres; no DevOps overhead for MVP |
| GitHub Actions | CI/CD; lint + typecheck + test on PR |

## Development Tools

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Code style consistency |
| Vitest | Unit tests for persona engine and prompt builders |
| Playwright | E2E tests for simulation flow |
| pnpm | Fast, disk-efficient package manager |

## Key Design Decisions

**Why Claude over GPT-4o?**
Claude demonstrates superior persona consistency in multi-turn roleplay, better handles emotionally nuanced clinical language, and has larger context windows for long therapy sessions. Critically for this domain, Claude is less likely to break character inappropriately.

**Why Supabase over raw Postgres?**
MVP speed. Built-in auth, row-level security, and a generous free tier remove infrastructure overhead at the cost of some flexibility — acceptable for this stage.

**Why Next.js App Router over separate backend?**
Single deployment unit simplifies DevOps. API routes handle Claude API calls server-side (keeping API keys secure). When scale demands it, the API layer can be extracted.
