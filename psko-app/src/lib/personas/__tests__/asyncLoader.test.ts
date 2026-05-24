/**
 * RED-phase tests for async getPersonaById in src/lib/personas/index.ts
 *
 * Current state: getPersonaById is SYNCHRONOUS and does not accept a prisma arg.
 * Target state:  getPersonaById is ASYNC with signature:
 *   async function getPersonaById(id: string, prisma?: PrismaClient): Promise<PersonaData | undefined>
 *
 * Tests 1-2 will pass (sync functions are awaitable), but they verify correct
 * behavior is preserved after refactoring.
 *
 * Tests 3-4 MUST FAIL in RED state because the current implementation ignores
 * the prisma argument and never queries the database. These tests verify that
 * the refactored implementation falls through to DB lookup when no file-library
 * match is found.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPersonaById } from '../index'

// ── test 1: library persona found without DB ──────────────────────────────────

test('test_getPersonaById_existingLibraryPersona_returnsWithoutDbCall', async () => {
  // 'aylin-panic-beginner' is a real file in src/lib/personas/library/
  // It must be returned directly from the file-based library, no DB needed.
  const persona = await getPersonaById('aylin-panic-beginner')

  assert.ok(persona !== undefined, 'Expected a persona to be returned')
  assert.equal(persona.id, 'aylin-panic-beginner')
  assert.equal(typeof persona.name, 'string')
  assert.ok(persona.name.length > 0)
})

// ── test 2: unknown id with no prisma → undefined ─────────────────────────────

test('test_getPersonaById_unknownId_withNoPrisma_returnsUndefined', async () => {
  // No file-library match, no prisma passed — should return undefined
  const persona = await getPersonaById('nonexistent-id')

  assert.equal(
    persona,
    undefined,
    'Expected undefined for an ID not in the library when no prisma is provided'
  )
})

// ── test 3: unknown id with mock prisma → queries DB ─────────────────────────
// RED: current implementation ignores prisma arg — this test MUST FAIL

test('test_getPersonaById_unknownId_withMockPrisma_queriesDb', async () => {
  const dbPersona = {
    id: 'db-persona-id',
    name: 'DB Persona',
    age: 30,
    presentingProblem: 'Test problem',
    backstory: 'Test backstory',
    difficultyLevel: 'beginner',
    conversationalStyle: 'verbose',
    recommendedApproaches: ['cbt'],
    disorderProfile: ['Test Disorder'],
    cognitiveModel: {
      coreBeliefs: [],
      intermediateBeliefs: [],
      automaticThoughts: [],
      emotionalState: { primary: 'anxious', intensity: 3, secondary: 'sad' },
      triggers: [],
      defenses: [],
      values: [],
      scid5: {
        onsetAge: 28,
        durationMonths: 6,
        functionalImpairment: { social: 3, occupational: 3, other: 2 },
        priorTreatment: false,
        traumaFlags: [],
      },
    },
  }

  // Mock PrismaClient with the minimum surface getPersonaById needs
  const mockPrisma = {
    persona: {
      findUnique: async (_args: unknown) => dbPersona,
    },
  }

  // Cast to unknown first to avoid full PrismaClient type requirement in tests
  const persona = await getPersonaById(
    'db-persona-id',
    mockPrisma as unknown as Parameters<typeof getPersonaById>[1]
  )

  assert.ok(
    persona !== undefined,
    'Expected persona from DB when id not in file library'
  )
  assert.equal(persona.id, 'db-persona-id')
  assert.equal(persona.name, 'DB Persona')
})

// ── test 4: unknown id + mock prisma returning null → undefined ───────────────
// RED: current implementation ignores prisma arg — this test MUST FAIL

test('test_getPersonaById_unknownId_withMockPrisma_dbReturnsNull_returnsUndefined', async () => {
  const mockPrisma = {
    persona: {
      findUnique: async (_args: unknown) => null,
    },
  }

  const persona = await getPersonaById(
    'db-persona-id',
    mockPrisma as unknown as Parameters<typeof getPersonaById>[1]
  )

  assert.equal(
    persona,
    undefined,
    'Expected undefined when both library and DB return nothing'
  )
})
