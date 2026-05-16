# Smoke Test: Dual-Role Simulation Flows

> Date: 2026-05-16
> Environment: https://psko-app.vercel.app
> Branch: feat/2026-05-16-simulation-mvp (pending merge to development → main)

## Status

**PARTIAL PASS** — Pre-merge checks passed. Post-merge smoke test required after PR #1 is merged and production redeployed.

---

## Pre-Merge Checks (Automated, HTTP level)

### Public Routes

| Route | Expected | Result |
|-------|----------|--------|
| `GET /` | 200 HTML | ✅ HTTP/2 200 text/html |
| `GET /login` | 200 HTML | ✅ HTTP/2 200 text/html |
| `GET /register` | 200 HTML | ✅ HTTP/2 200 text/html |
| `GET /nonexistent` | 404 | ✅ HTTP/2 404 |

### Auth Guards (Unauthenticated)

| Route / Endpoint | Expected | Result |
|------------------|----------|--------|
| `GET /dashboard` | 307 → /login | ✅ HTTP/2 307 location: /login |
| `GET /session/:id` | 307 → /login | ✅ HTTP/2 307 location: /login |
| `POST /api/session/start` | 401 Unauthorized | ✅ `{"error":"Unauthorized"}` |
| `POST /api/session/message` | 401 Unauthorized | ✅ `{"error":"Unauthorized"}` |
| `POST /api/session/end` | 401 Unauthorized | ✅ `{"error":"Unauthorized"}` |

### Deployment Version Note

The current production deployment does not yet include the dual-role changes — it reflects the pre-PR MVP baseline. The `roleMode` field, `RoleModeSelector` UI, `therapist-prompt`, `debrief-prompt`, and `ClientDebrief` feedback are all in the PR branch (`feat/2026-05-16-simulation-mvp`) and will go live after merge.

---

## Post-Merge Checklist (Manual, run after PR #1 is merged and Vercel redeploys)

Run these steps against https://psko-app.vercel.app with a test account.

### Setup
- [ ] Sign in (or register) at `/login`
- [ ] Confirm redirect to `/dashboard`

### Therapist Mode (🩺)
- [ ] Click **Start Session** on any persona card
- [ ] **Choose Your Role** modal appears with two options
- [ ] Select **🩺 Therapist Mode**
- [ ] Session opens — patient persona sends opening message (presenting problem style)
- [ ] Session header shows "🩺 Therapist Mode" badge
- [ ] Guidance hints panel is visible on the right
- [ ] Send 3+ messages — AI responds as patient in character
- [ ] Click **End Session** — loading state: "Generating feedback..."
- [ ] Feedback page shows "Session Feedback" title
- [ ] CTS-R competency score bars render (9 domains)
- [ ] Overall score /100 displayed
- [ ] Return to `/dashboard` — session appears in history with "🩺 Therapist" badge

### Client Mode (🎭)
- [ ] Click **Start Session** on any persona card
- [ ] **Choose Your Role** modal appears
- [ ] Select **🎭 Client Mode**
- [ ] Session opens — AI therapist sends warm opening (welcome + agenda-setting style)
- [ ] Session header shows "🎭 Client Mode" badge (purple)
- [ ] Guidance hints panel is **hidden** (correct — student is the client)
- [ ] Input placeholder reads "Share what's on your mind as the client..."
- [ ] AI messages show "Psychologist" label above bubble
- [ ] Send 3+ messages — AI responds as skilled psychologist
- [ ] Click **End Session** — loading state: "Generating feedback..."
- [ ] Feedback page shows "Session Debrief" title
- [ ] Emotional experience sections render: Your Experience, Therapeutic Approach Used, What Felt Helpful, Reflection Prompts
- [ ] No CTS-R score bars (correct — debrief not competency report)
- [ ] Return to `/dashboard` — session appears in history with "🎭 Client" badge

### Backwards Compatibility
- [ ] Any pre-existing sessions (from before the migration) show in history with "🩺 Therapist" badge (default roleMode)
- [ ] Clicking a pre-existing session shows the original CTS-R feedback report unchanged

---

## How to Deploy

After PR #1 is approved:

```bash
# On GitHub: Merge PR #1 → development
# Vercel auto-deploys development → staging preview
# If staging passes: promote to production, or merge development → main
```

Vercel project: `serdars-projects-f333f69f/psko-app`
