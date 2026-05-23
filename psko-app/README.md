# PSKO

[Changelog](./docs/releases/CHANGELOG.md) · [Türkçe](./docs/releases/CHANGELOG.tr.md) · [Deployment](./docs/deployment.md)

PSKO is an AI-powered clinical psychology simulation trainer for psychology students. It provides:

- realistic client personas driven by cognitive models
- multiple therapeutic lenses (CBT, psychodynamic, humanistic, ACT, DBT)
- guided prompts during sessions
- structured post-session feedback

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Prisma
- Anthropic Claude API
- Vercel

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local environment files:

```bash
cp .env.example .env.local
cp .env.local .env
```

3. Fill in:

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

4. Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start the app:

```bash
npm run dev
```

## Production Deployment

- Production URL: `https://psko-app.vercel.app`
- Vercel platform: `serdars-projects-f333f69f/psko-app`

### Deployment Notes

- Prisma was pinned to `5.22.0` for Node 20 compatibility
- Production build runs `prisma generate` before `next build`
- Environment variables are configured in Vercel production settings
- Local `.env` files are ignored and must never be committed

## Smoke Test Results

Final post-deployment smoke tests were run against the live production site.

### Public Routes

- `GET /` → `200 OK`
- `GET /login` → `200 OK`
- `GET /register` → `200 OK`

### Auth Protection

- `GET /dashboard` unauthenticated → redirected to `/login`
- `GET /session/fake-session-id` unauthenticated → redirected to `/login`

### Protected API Behavior

- `GET /api/personas` unauthenticated → `401 Unauthorized`
- `POST /api/session/start` unauthenticated → `401 Unauthorized`
- `POST /api/session/end` unauthenticated → `401 Unauthorized`

### Metadata Verification

Verified on the live site:

- `title` → `PSKO | Clinical Psychology Simulation Trainer`
- `description` → `PSKO helps psychology students practice clinical interviewing through AI-powered therapy simulations, guided prompts, and structured feedback.`
- `og:title` → `PSKO | Clinical Psychology Simulation Trainer`

## Current Status

Working in production:

- landing page
- login and register pages
- auth guards on protected routes
- protected API authorization behavior
- deployment and metadata

Not yet smoke tested with an authenticated end-to-end session:

- signed-in dashboard flow
- starting a real therapy simulation
- live streaming patient responses
- post-session feedback generation with a real user session
