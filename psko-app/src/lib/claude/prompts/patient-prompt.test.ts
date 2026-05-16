import { describe, it, expect } from 'vitest'
import { buildPatientPrompt } from './patient-prompt'
import { getPersonaById, personaLibrary } from '@/lib/personas'

describe('buildPatientPrompt', () => {
  it('includes the persona name in the prompt', () => {
    const persona = getPersonaById('ayse-depression-beginner')!
    const prompt = buildPatientPrompt(persona, 'cbt')
    expect(prompt).toContain('Ayşe')
  })

  it('includes the presenting problem', () => {
    const persona = getPersonaById('mert-anxiety-intermediate')!
    const prompt = buildPatientPrompt(persona, 'act')
    expect(prompt).toContain(persona.presentingProblem)
  })

  it('includes the approach-specific instructions', () => {
    const persona = getPersonaById('zeynep-grief-beginner')!
    const prompt = buildPatientPrompt(persona, 'humanistic')
    expect(prompt).toContain('Person-Centered')
  })

  it('never exposes the term "cognitive distortions" (anti-jargon check)', () => {
    const persona = getPersonaById('ayse-depression-beginner')!
    const prompt = buildPatientPrompt(persona, 'cbt')
    // The rule against jargon should be present
    expect(prompt).toContain('clinical terminology')
  })

  it('includes core beliefs', () => {
    const persona = getPersonaById('selin-relationship-advanced')!
    const prompt = buildPatientPrompt(persona, 'psychodynamic')
    expect(prompt).toContain('I am fundamentally unlovable')
  })
})

describe('personaLibrary', () => {
  it('has 5 personas', () => {
    expect(personaLibrary).toHaveLength(5)
  })

  it('each persona has required fields', () => {
    for (const persona of personaLibrary) {
      expect(persona.id).toBeTruthy()
      expect(persona.name).toBeTruthy()
      expect(persona.cognitiveModel.coreBeliefs.length).toBeGreaterThan(0)
      expect(persona.cognitiveModel.automaticThoughts.length).toBeGreaterThan(0)
      expect(['beginner', 'intermediate', 'advanced']).toContain(persona.difficultyLevel)
      expect(['plain', 'upset', 'reserved', 'verbose', 'pleasing', 'tangent']).toContain(persona.conversationalStyle)
    }
  })

  it('each persona has at least one recommended approach', () => {
    for (const persona of personaLibrary) {
      expect(persona.recommendedApproaches.length).toBeGreaterThan(0)
    }
  })
})
