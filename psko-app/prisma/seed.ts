/**
 * Seed script: upserts all persona records from the JSON library (currently 18)
 * into the `personas` table so that Session.personaId FK constraints resolve.
 *
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const libraryDir = path.join(__dirname, '../src/lib/personas/library')
  const files = fs.readdirSync(libraryDir).filter((f) => f.endsWith('.json'))

  console.log(`Seeding ${files.length} personas...`)

  for (const file of files) {
    const raw = fs.readFileSync(path.join(libraryDir, file), 'utf8')
    const p = JSON.parse(raw)

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

    console.log(`  ✓ ${p.name} (${p.id})`)
  }

  // Educator demo account
  const educator = await prisma.user.upsert({
    where: { email: 'educator@demo.psko.app' },
    update: { role: 'EDUCATOR' },
    create: {
      email: 'educator@demo.psko.app',
      role: 'EDUCATOR',
    },
  })
  console.log(`  ✓ Educator demo account: ${educator.email} (${educator.id})`)

  // Sample cohort owned by the educator (idempotent via stable join code)
  const cohort = await prisma.cohort.upsert({
    where: { joinCode: 'DEMO01' },
    update: {
      name: 'Demo Cohort',
      instructorId: educator.id,
    },
    create: {
      name: 'Demo Cohort',
      instructorId: educator.id,
      joinCode: 'DEMO01',
    },
  })
  console.log(`  ✓ Demo cohort: ${cohort.name} (join code: ${cohort.joinCode})`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
