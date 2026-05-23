import { randomBytes } from 'node:crypto'

/**
 * Crockford-style alphabet — 32 chars, excludes ambiguous 0/O/1/I/l.
 * Length 6 → 32^6 ≈ 1.07B unique codes, matches schema VarChar(6).
 */
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const JOIN_CODE_LENGTH = 6

const ALPHABET_LEN = JOIN_CODE_ALPHABET.length

/**
 * Generate a 6-char cohort join code using cryptographically strong randomness.
 *
 * Uses rejection sampling to keep the distribution uniform: bytes whose value
 * is in the largest multiple of ALPHABET_LEN below 256 are accepted; the rest
 * are discarded and re-sampled.
 */
export function generateJoinCode(): string {
  const max = 256 - (256 % ALPHABET_LEN) // largest unbiased threshold
  let out = ''
  while (out.length < JOIN_CODE_LENGTH) {
    const buf = randomBytes(JOIN_CODE_LENGTH * 2) // oversample to absorb rejections
    for (let i = 0; i < buf.length && out.length < JOIN_CODE_LENGTH; i++) {
      const b = buf[i]
      if (b < max) {
        out += JOIN_CODE_ALPHABET[b % ALPHABET_LEN]
      }
    }
  }
  return out
}

/** True if `ch` is a single character in the allowed join-code alphabet. */
export function isValidJoinCodeChar(ch: string): boolean {
  return ch.length === 1 && JOIN_CODE_ALPHABET.includes(ch)
}
