/**
 * Persona loader — dynamic directory scan of `./library/*.json`.
 *
 * Replaces the previous hand-maintained static import list. Each JSON file is
 * parsed via `PersonaDataSchema` (Zod) so malformed personas throw loudly at
 * startup with the offending file path and Zod issue, rather than producing a
 * silently broken patient prompt downstream.
 *
 * spec: 2026-05-23-persona-expansion (FR-2, FR-6)
 */

import fs from 'node:fs'
import path from 'node:path'
import type { PersonaData } from '@/types'
import { PersonaDataSchema } from './schema'

const LIBRARY_DIR = path.join(__dirname, 'library')

function loadPersonaLibrary(): PersonaData[] {
  const entries = fs
    .readdirSync(LIBRARY_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort() // deterministic order for tests, snapshots, and seed idempotency

  const personas: PersonaData[] = []
  for (const file of entries) {
    const fullPath = path.join(LIBRARY_DIR, file)
    const raw = fs.readFileSync(fullPath, 'utf-8')

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (err) {
      throw new Error(
        `[persona-loader] Failed to JSON.parse ${fullPath}: ${(err as Error).message}`,
      )
    }

    const result = PersonaDataSchema.safeParse(json)
    if (!result.success) {
      const firstIssue = result.error.issues[0]
      const issuePath = firstIssue?.path.join('.') ?? '<root>'
      const issueMsg = firstIssue?.message ?? 'unknown validation error'
      throw new Error(
        `[persona-loader] Validation failed for ${fullPath} at "${issuePath}": ${issueMsg}`,
      )
    }
    // result.data is PersonaDataParsed (Zod inferred). PersonaData is the
    // hand-written interface in types/index.ts. They are structurally identical
    // except for the priorTreatment migration window (boolean vs string|boolean).
    // The cast is intentional until the type and JSON files are reconciled.
    // See the comment in schema.ts for the follow-up task.
    personas.push(result.data as unknown as PersonaData)
  }

  return personas
}

export const personaLibrary: PersonaData[] = loadPersonaLibrary()

export function getPersonaLibrary(): PersonaData[] {
  return personaLibrary
}

export function getPersonaById(id: string): PersonaData | undefined {
  return personaLibrary.find((p) => p.id === id)
}
