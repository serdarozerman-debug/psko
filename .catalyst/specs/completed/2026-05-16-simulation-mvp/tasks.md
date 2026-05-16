# Tasks: Simulation MVP

## Build DAG

### Phase 1: Foundation
| ID | Agent | Scope | Depends On |
|----|-------|-------|------------|
| project-setup | forger | `psko-app/**` | - |
| schema-foundation | alchemist | `psko-app/prisma/**` | project-setup |
| contracts | smith | `psko-app/src/types/**`, `psko-app/src/lib/approaches/**`, `psko-app/src/lib/personas/**` | schema-foundation |

### Phase 2: Core Application
| ID | Agent | Scope | Reads | Depends On |
|----|-------|-------|-------|------------|
| auth-flow | smith | `psko-app/src/lib/supabase/**`, `psko-app/src/middleware.ts`, `psko-app/src/app/(auth)/**` | `psko-app/prisma/**` | schema-foundation |
| ai-agents | smith | `psko-app/src/lib/claude/**` | `psko-app/src/types/**`, `psko-app/src/lib/personas/**`, `psko-app/src/lib/approaches/**` | contracts |
| api-routes | smith | `psko-app/src/app/api/**` | `psko-app/src/lib/db/**`, `psko-app/src/lib/claude/**` | auth-flow, ai-agents |
| ui-simulation | shaper | `psko-app/src/components/**`, `psko-app/src/app/session/**`, `psko-app/src/app/dashboard/**` | `psko-app/src/types/**`, `psko-app/src/app/api/**` | auth-flow, api-routes |

### Phase 3: Deployment and Documentation
| ID | Agent | Scope | Reads | Depends On |
|----|-------|-------|-------|------------|
| landing-metadata | shaper | `psko-app/src/app/page.tsx`, `psko-app/src/app/layout.tsx` | `psko-app/src/app/**` | ui-simulation |
| validation-tests | enforcer | `psko-app/src/lib/claude/prompts/patient-prompt.test.ts`, `psko-app/vitest.config.ts` | `psko-app/src/lib/**` | api-routes |
| deploy-hardening | inquisitor | `psko-app/package.json`, `psko-app/.gitignore`, `psko-app/prisma/migrations/**` | `psko-app/prisma/**` | validation-tests |
| documentation | scribe | `psko-app/README.md` | `.catalyst/specs/2026-05-16-simulation-mvp/**` | deploy-hardening |

## Progress

| Task | Status | Tests | Commit | Notes |
|------|--------|-------|--------|-------|
| project-setup | ✓ Done | n/a | 1e051a7 | Next.js 14 app scaffolded |
| schema-foundation | ✓ Done | prisma generate + migration applied | 1e051a7 / 9e017ee | Prisma schema and migration created |
| contracts | ✓ Done | unit tests pass | 1e051a7 | Types, personas, and approach modules added |
| auth-flow | ✓ Done | smoke tested unauth redirects | 1e051a7 | Supabase auth pages and middleware in place |
| ai-agents | ✓ Done | unit tests pass | 1e051a7 | Claude patient/supervisor agents implemented |
| api-routes | ✓ Done | smoke tested unauth 401 behavior | 1e051a7 | Start/message/end/personas routes implemented |
| ui-simulation | ✓ Done | route smoke tests pass | 1e051a7 | Dashboard, session UI, feedback UI built |
| landing-metadata | ✓ Done | production verified | 95dd33e / 0afb638 | Landing page and metadata updated |
| validation-tests | ✓ Done | 8/8 passing | 1e051a7 | Vitest added for prompt/persona coverage |
| deploy-hardening | ✓ Done | production deploy passes | 9e017ee | Prisma/Vercel compatibility fixes applied |
| documentation | ✓ Done | README updated | a6923eb | Deploy and smoke test notes documented |

## Current Session

**Phase:** Validation
**Active:** audit-spec backfill
**Working on:** Preparing validation artifacts so the spec can progress through the Catalyst OS lifecycle
**Next:** Run final validation checks and write `validation.md`

## Decisions

- **Supabase + Prisma** for managed auth and database persistence in the MVP
- **Claude API** for persona fidelity and post-session feedback generation
- **Next.js App Router** to keep UI, routes, and server logic in one deployable app
- **Prisma 5.22.0** to remain compatible with the Node 20 environment used here and on Vercel
- **Vercel build script includes `prisma generate`** to avoid stale Prisma client issues in cached builds
