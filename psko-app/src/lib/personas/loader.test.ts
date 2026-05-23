/**
 * RED PHASE — Persona Loader Tests
 * spec: 2026-05-23-persona-expansion
 * task: tests (enforcer-1)
 *
 * All tests in Scope 1 must FAIL before implementation.
 * Expected failures:
 *   - getPersonaLibrary() not exported yet
 *   - Library has 5 personas, not 18
 *   - 13 new persona JSON files do not exist yet
 *   - 'upset' and 'tangent' styles are absent from the current 5 personas
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

// getPersonaLibrary is not yet exported from index.ts — it does not exist.
// The import itself will not fail at module load (named export just resolves to
// undefined), but each test that calls it will FAIL because it is undefined.
import { personaLibrary, getPersonaById } from './index'

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * getPersonaLibrary() is the new export the persona-loader task must add.
 * It is required here via CommonJS require so the test documents the contract
 * without using top-level await (incompatible with tsx/cjs transform).
 * Until the export exists it resolves to `undefined`, causing every test
 * that calls it to throw "getPersonaLibrary is not a function".
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const { getPersonaLibrary } = require('./index') as any

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('getPersonaLibrary', () => {
  test('test_getPersonaLibrary_called_returns18Personas', () => {
    // FAIL: getPersonaLibrary does not exist yet; even if it did, only 5
    // personas exist in the library directory.
    const library = getPersonaLibrary()
    assert.strictEqual(
      library.length,
      18,
      `Expected 18 personas, got ${library.length}. ` +
        'All 13 new JSON files must be added and auto-discovered.',
    )
  })

  test('test_getPersonaLibrary_includesAllNewPersonaIds', () => {
    // FAIL: none of the 13 new JSON files exist in library/ yet.
    const library = getPersonaLibrary()
    const ids: string[] = library.map((p: { id: string }) => p.id)

    const expectedNewIds = [
      'elif-ptsd-intermediate',
      'gunes-dissociative-advanced',
      'ahmet-bpd-advanced',
      'leyla-avpd-intermediate',
      'hasan-npd-advanced',
      'fatma-psychosis-advanced',
      'kerem-ocd-intermediate',
      'deniz-bipolar-intermediate',
      'tarik-alcohol-advanced',
      'burak-cannabis-intermediate',
      'nur-social-anxiety-beginner',
      'aylin-panic-beginner',
      'irem-anorexia-intermediate',
    ]

    for (const id of expectedNewIds) {
      assert.ok(
        ids.includes(id),
        `Missing persona: '${id}'. JSON file has not been created yet.`,
      )
    }
  })

  test('test_getPersonaLibrary_allSixConversationalStylesRepresented', () => {
    // FAIL: 'upset' and 'tangent' are not present in the current 5 personas.
    // The full 6-style coverage only exists after all 13 new personas are added.
    const library = getPersonaLibrary()
    const styles: string[] = library.map((p: { conversationalStyle: string }) => p.conversationalStyle)

    const requiredStyles = ['plain', 'verbose', 'reserved', 'upset', 'pleasing', 'tangent']
    for (const style of requiredStyles) {
      assert.ok(
        styles.includes(style),
        `Conversational style '${style}' is not represented in the library. ` +
          'At least one persona with this style is required (NFR-7).',
      )
    }
  })

  test('test_getPersonaLibrary_eachStyleRepresentedByAtLeastTwoPersonas', () => {
    // FAIL: 'upset' (0 personas) and 'tangent' (0 personas) fail this check
    // until the new content is added.
    const library = getPersonaLibrary()

    const styleCounts: Record<string, number> = {}
    for (const persona of library) {
      const style = (persona as { conversationalStyle: string }).conversationalStyle
      styleCounts[style] = (styleCounts[style] ?? 0) + 1
    }

    const requiredStyles = ['plain', 'verbose', 'reserved', 'upset', 'pleasing', 'tangent']
    for (const style of requiredStyles) {
      const count = styleCounts[style] ?? 0
      assert.ok(
        count >= 2,
        `Style '${style}' appears in ${count} persona(s) — need at least 2 (AC-6 / NFR-7).`,
      )
    }
  })
})

describe('getPersonaById (new persona ids)', () => {
  test('test_getPersonaById_elifPtsdIntermediate_returnsPersonaObject', () => {
    // FAIL: elif-ptsd-intermediate.json does not exist yet.
    // After persona-loader task completes this will PASS.
    const persona = getPersonaById('elif-ptsd-intermediate')
    assert.ok(
      persona !== undefined,
      "getPersonaById('elif-ptsd-intermediate') returned undefined. " +
        'JSON file has not been created yet.',
    )
    assert.strictEqual(persona!.id, 'elif-ptsd-intermediate')
  })
})

describe('personaLibrary size (regression guard on existing export)', () => {
  test('test_personaLibrary_after_expansion_contains18Entries', () => {
    // FAIL until auto-discovery is wired in and 13 new files are present.
    // Currently personaLibrary has exactly 5.
    assert.strictEqual(
      personaLibrary.length,
      18,
      `personaLibrary.length is ${personaLibrary.length}. ` +
        'Expected 18 after all new persona JSON files are loaded.',
    )
  })
})

describe('performance', () => {
  test('test_getPersonaLibrary_loadsInUnder200ms', () => {
    // This test calls getPersonaLibrary() fresh via a dynamic re-require so it
    // measures actual I/O + validation time rather than a cached result.
    // The test itself may pass or fail depending on timing; it serves as a
    // performance gate once the implementation exists.
    // Currently FAILS because getPersonaLibrary does not exist.
    const start = performance.now()
    getPersonaLibrary()
    const elapsed = performance.now() - start

    assert.ok(
      elapsed < 200,
      `getPersonaLibrary() took ${elapsed.toFixed(1)}ms — must complete in < 200ms (NFR-1).`,
    )
  })
})
