/**
 * E2E seed helper — provisions a deterministic test user and persona records
 * so that Playwright specs run against a stable, predictable database state.
 *
 * Usage (in a spec's beforeAll / test.beforeAll):
 *
 *   import { seedE2EFixtures } from './helpers/seed'
 *   test.beforeAll(async () => { await seedE2EFixtures() })
 *
 * The helper is idempotent: safe to call multiple times per test run.
 * It reads E2E_USER_EMAIL / E2E_USER_PASSWORD from env (with safe defaults).
 *
 * Requires:
 *   DATABASE_URL env var (Prisma direct connection)
 *   SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (for auth user creation)
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e-student@psko.local'
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'e2e-password-secure-1'

export async function seedE2EFixtures(): Promise<{ userId: string }> {
  const prisma = new PrismaClient()

  try {
    // ── 1. Ensure personas exist (reuse prisma/seed logic) ─────────────────
    const libraryDir = path.resolve(__dirname, '../../../src/lib/personas/library')
    if (fs.existsSync(libraryDir)) {
      const files = fs.readdirSync(libraryDir).filter((f) => f.endsWith('.json'))
      for (const file of files) {
        const p = JSON.parse(fs.readFileSync(path.join(libraryDir, file), 'utf8'))
        await prisma.persona.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            age: p.age,
            presentingProblem: p.presentingProblem,
            backstory: p.backstory,
            difficultyLevel: p.difficultyLevel,
            conversationalStyle: p.conversationalStyle,
            recommendedApproaches: p.recommendedApproaches,
            cognitiveModel: p.cognitiveModel,
            disorderProfile: p.disorderProfile,
          },
          create: {
            id: p.id,
            name: p.name,
            age: p.age,
            presentingProblem: p.presentingProblem,
            backstory: p.backstory,
            difficultyLevel: p.difficultyLevel,
            conversationalStyle: p.conversationalStyle,
            recommendedApproaches: p.recommendedApproaches,
            cognitiveModel: p.cognitiveModel,
            disorderProfile: p.disorderProfile,
          },
        })
      }
    }

    // ── 2. Create E2E auth user via Supabase Admin API ─────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'seedE2EFixtures: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Try to create; ignore "already registered" error
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
      email_confirm: true,
    })

    let userId: string

    if (createErr && createErr.message.toLowerCase().includes('already registered')) {
      // User exists — look up their id
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list?.users.find((u) => u.email === E2E_USER_EMAIL)
      if (!existing) throw new Error(`seedE2EFixtures: could not find existing user ${E2E_USER_EMAIL}`)
      userId = existing.id
    } else if (createErr) {
      throw createErr
    } else {
      userId = created.user.id
    }

    // ── 3. Ensure User row exists in Prisma (auth.users → public.users sync) ─
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: E2E_USER_EMAIL },
      create: { id: userId, email: E2E_USER_EMAIL },
    })

    return { userId }
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Tear down: delete sessions created by the E2E user during a test run.
 * Call in afterAll if you want a clean slate between full test suite runs.
 */
export async function cleanE2ESessions(userId: string): Promise<void> {
  const prisma = new PrismaClient()
  try {
    await prisma.session.deleteMany({ where: { userId } })
  } finally {
    await prisma.$disconnect()
  }
}
