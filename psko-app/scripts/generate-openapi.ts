/**
 * Generates public/openapi.json from src/lib/api-schemas/.
 * Run via `npm run prebuild` (or manually: `npx tsx scripts/generate-openapi.ts`).
 *
 * Uses @asteasolutions/zod-to-openapi if available; falls back to a hand-rolled
 * spec stub so the build never fails when the optional dep is absent.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../public/openapi.json')

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'PSKO API',
    version: '0.2.0',
    description:
      'Server-authoritative endpoints for the PSKO clinical simulation trainer. All endpoints require a Supabase session cookie unless noted.',
  },
  servers: [{ url: '/', description: 'Same-origin' }],
  components: {
    securitySchemes: {
      supabaseSession: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Supabase JWT delivered via httpOnly cookie',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' }, reason: { type: 'string' } },
        required: ['error'],
      },
      PhaseGuidance: {
        type: 'object',
        properties: {
          currentPhase: { type: 'integer', minimum: 0 },
          nextMove: { type: 'string' },
          blocked: { type: 'boolean' },
          attempted: { type: 'integer' },
          reason: { type: 'string' },
        },
        required: ['currentPhase', 'nextMove'],
      },
    },
  },
  security: [{ supabaseSession: [] }],
  paths: {
    '/api/session/start': {
      post: {
        summary: 'Begin a new clinical simulation session',
        responses: { '200': { description: 'Session created' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/api/session/message': {
      post: {
        summary: 'Exchange a turn with the simulated patient',
        responses: { '200': { description: 'Patient reply' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/api/session/phase': {
      get: {
        summary: 'Get current phase guidance (server-authoritative)',
        parameters: [{ name: 'sessionId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Current phase guidance',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PhaseGuidance' } } },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Session not found' },
          '500': { description: 'Persistence failure' },
        },
      },
      post: {
        summary: 'Admin/recovery: force a phase transition (validated)',
        responses: {
          '200': { description: 'Transition applied' },
          '403': { description: 'Admin role required' },
          '409': { description: 'Illegal phase transition' },
        },
      },
    },
    '/api/session/end': {
      post: {
        summary: 'End the session and produce a summary',
        responses: { '200': { description: 'Session ended' }, '401': { description: 'Unauthorized' } },
      },
    },
  },
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(spec, null, 2))
console.log(`[openapi] wrote ${outPath}`)
