# PSKO Deployment Runbook

> Audience: ops / lead engineer pushing PSKO to staging or production.

## 1. Pre-deploy checklist

- [ ] `npm test` — all unit tests green
- [ ] `npm run test:coverage` — coverage thresholds met (lines > 85%, branches > 80%)
- [ ] `npm run test:e2e` — Playwright suite green against staging
- [ ] `npm run lint` — no errors
- [ ] `CHANGELOG.md` updated with the new version entry
- [ ] OpenAPI regenerated: `npx tsx scripts/generate-openapi.ts`

## 2. Environment variables (Vercel project settings)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (pooled) |
| `DIRECT_URL` | Direct (non-pooled) URL for Prisma migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose |
| `ANTHROPIC_API_KEY` | Claude API key |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (`https://psko.app`) |

## 3. Database migration

```bash
cd psko-app
npx prisma migrate deploy --schema prisma/schema.prisma
npm run seed   # idempotent — re-seeds personas if missing
```

## 4. Deploy

```bash
# Push to the production branch; Vercel auto-deploys
git checkout main
git pull --ff-only
git push origin main
```

For a manual deploy:

```bash
vercel --prod
```

## 5. Smoke tests (post-deploy)

- [ ] `GET https://psko.app/` returns 200
- [ ] `GET https://psko.app/api/health` returns `{ ok: true }`
- [ ] Sign in with the QA fixture account
- [ ] Start a session, exchange one message, end the session
- [ ] `GET https://psko.app/api/docs` loads Swagger UI when authenticated
- [ ] Check Vercel logs for unhandled errors in the last 10 minutes

## 6. Rollback

If a deploy regresses production:

1. In Vercel dashboard → Deployments → previous green deploy → "Promote to Production".
2. If the regression was a DB migration:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
   then redeploy the previous app version.
3. Post-mortem entry in `docs/releases/CHANGELOG.md` under an `[Unreleased]` heading.

## 7. Monitoring

- Vercel Analytics — request volume and edge latency
- Supabase dashboard — DB connections, slow queries
- Sentry (if enabled) — exception rate
- Watch for `[phase] blocked transition` warnings — a sustained increase
  indicates client tampering or a phase-engine regression.
