/**
 * Central registry of Zod schemas used at API boundaries.
 * Schemas are tagged for OpenAPI generation via scripts/generate-openapi.ts.
 */
import { z } from 'zod'

export const TherapeuticApproachSchema = z.enum(['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt'])
export type TherapeuticApproachIn = z.infer<typeof TherapeuticApproachSchema>

// ─── /api/session/phase ────────────────────────────────────────────────────

export const PhaseGetQuerySchema = z.object({
  sessionId: z.string().min(1),
})

export const PhaseGuidanceSchema = z.object({
  currentPhase: z.number().int().min(0),
  phase: z
    .object({
      index: z.number().int(),
      name: z.string(),
      objective: z.string(),
      techniques: z.array(z.string()),
      watchFor: z.array(z.string()),
      triggerTurnMin: z.number().int(),
    })
    .nullable(),
  nextPhase: z.unknown().nullable(),
  nextMove: z.string(),
  blocked: z.boolean().optional(),
  attempted: z.number().int().optional(),
  reason: z.string().optional(),
})

export const PhasePostBodySchema = z.object({
  sessionId: z.string().min(1),
  toPhase: z.number().int().min(0),
})

export const PhasePostResponseSchema = z.object({
  sessionId: z.string(),
  currentPhase: z.number().int(),
})

// ─── /api/session/start ────────────────────────────────────────────────────

export const SessionStartBodySchema = z.object({
  personaId: z.string().min(1),
  therapeuticApproach: TherapeuticApproachSchema,
  roleMode: z.enum(['THERAPIST', 'CLIENT']),
})

export const SessionStartResponseSchema = z.object({
  sessionId: z.string(),
  currentPhase: z.number().int(),
})

// ─── /api/session/message ──────────────────────────────────────────────────

export const SessionMessageBodySchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1).max(4000),
})

export const SessionMessageResponseSchema = z.object({
  reply: z.string(),
  turnCount: z.number().int(),
})

// ─── /api/session/end ──────────────────────────────────────────────────────

export const SessionEndBodySchema = z.object({
  sessionId: z.string().min(1),
})

export const SessionEndResponseSchema = z.object({
  sessionId: z.string(),
  endedAt: z.string(),
  summaryUrl: z.string().optional(),
})

// ─── Common error ──────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  error: z.string(),
  reason: z.string().optional(),
})

export const API_SCHEMAS = {
  PhaseGetQuerySchema,
  PhaseGuidanceSchema,
  PhasePostBodySchema,
  PhasePostResponseSchema,
  SessionStartBodySchema,
  SessionStartResponseSchema,
  SessionMessageBodySchema,
  SessionMessageResponseSchema,
  SessionEndBodySchema,
  SessionEndResponseSchema,
  ErrorResponseSchema,
}
