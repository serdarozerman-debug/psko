# Handoff: Simulation MVP

> Status: IN_PROGRESS

## TL;DR

Building the PSKO MVP from scratch: a Next.js 14 web app where psychology students practice clinical interviews with AI-powered patient personas (Claude API), receive real-time guidance, and get structured CTS-R competency feedback after each session. Stack: Next.js + TypeScript + Tailwind + Supabase + Prisma + Anthropic SDK.

## What's Being Built

- Full Next.js 14 (App Router) project scaffold
- Supabase auth + Prisma ORM for user/session/message persistence
- 5 patient personas (cognitive model JSON files)
- 5 therapeutic approach modules (CBT, Psychodynamic, Humanistic, ACT, DBT)
- Claude patient agent (streaming) + supervisor agent (post-session feedback)
- 3 API routes: `/api/session/start`, `/api/session/message`, `/api/session/end`
- UI: auth pages, persona selector, simulation chat with guidance panel, feedback report, dashboard

## Key Decisions

**Claude over GPT-4o:** Superior persona consistency in multi-turn roleplay; better clinical nuance; less likely to break character.

**Cognitive model as structured JSON in system prompt:** Research (PATIENT-Ψ, UCL CBT Trainer) shows structured data > prose for in-character fidelity.

**Supervisor is a separate Claude call:** Mixing evaluation logic into the patient agent degrades both fidelity and evaluation quality.

**Next.js API routes for all Claude calls:** API key security — never exposed to browser.

**Supabase RLS:** Data isolation enforced at DB level, not just application level.

## How to Test

1. `pnpm dev` — start dev server
2. Register a new account at `/register`
3. Browse persona library at `/dashboard`
4. Select a persona + approach, click "Start Session"
5. Chat with the AI patient for several turns
6. Click "End Session"
7. View feedback report — should show 9 CTS-R scores

## What's Next

- `/challenge-spec @2026-05-16-simulation-mvp` — optional pre-build review
- `/forge-spec @2026-05-16-simulation-mvp` — TDD build begins

## Gotchas

- **Env vars required before any run:** `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`
- **Supabase project must be created first** — get connection strings from Supabase dashboard
- **Prisma + Supabase:** Use the pooler connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL` (needed for migrations)
- **node_modules is large** — `.gitignore` must include `node_modules/` and `.next/`
