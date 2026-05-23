/**
 * Unit tests for src/lib/cohorts/joinCode.ts
 *
 * Runner: node:test (matched by vitest / ts-node, NOT Jest)
 * File does NOT use jest globals — uses node:test + node:assert.
 *
 * RED phase: joinCode.ts does not exist yet.
 * All tests should fail with MODULE_NOT_FOUND.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// This import WILL fail until smith-2 creates the file.
import { generateJoinCode, isValidJoinCodeChar } from '../joinCode'

// Alphabet: A-H J-N P-Z 2-9  (excludes 0, O, 1, I, l)
// Written as a regex character class for the "only allowed chars" test.
const ALLOWED_CHAR_PATTERN = /^[A-HJ-NP-Z2-9]+$/

describe('generateJoinCode', () => {
  it('test_generateJoinCode_returnsStringOfLength6', () => {
    // Arrange — no setup needed; function is pure
    // Act
    const code = generateJoinCode()
    // Assert
    assert.strictEqual(typeof code, 'string')
    assert.strictEqual(code.length, 6)
  })

  it('test_generateJoinCode_onlyContainsAllowedChars', () => {
    // Arrange — generate a sample to inspect
    // Act
    const code = generateJoinCode()
    // Assert — no ambiguous characters (0, O, 1, I, l)
    assert.match(code, ALLOWED_CHAR_PATTERN)
  })

  it('test_generateJoinCode_calledTwice_likelyDifferent', () => {
    // Arrange — 32^6 ≈ 1 billion unique codes; collision probability negligible
    // Act
    const codeA = generateJoinCode()
    const codeB = generateJoinCode()
    // Assert — probabilistic: if this ever fails, the PRNG is broken
    assert.notStrictEqual(codeA, codeB)
  })
})

describe('isValidJoinCodeChar', () => {
  it('test_isValidJoinCodeChar_withAllowedChar_returnsTrue', () => {
    // Arrange — 'A' is in the allowed alphabet
    // Act
    const result = isValidJoinCodeChar('A')
    // Assert
    assert.strictEqual(result, true)
  })

  it('test_isValidJoinCodeChar_withForbiddenChar_returnsFalse', () => {
    // Arrange — 'O' (letter oh), '0' (zero), '1' (one) are all excluded
    // Act & Assert — each forbidden character must return false
    assert.strictEqual(isValidJoinCodeChar('O'), false, "'O' (letter oh) must be excluded")
    assert.strictEqual(isValidJoinCodeChar('0'), false, "'0' (zero) must be excluded")
    assert.strictEqual(isValidJoinCodeChar('1'), false, "'1' (one) must be excluded")
  })
})
