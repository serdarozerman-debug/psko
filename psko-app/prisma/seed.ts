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

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
