import type { PersonaData } from '@/types'
import ayse from './library/ayse-depression-beginner.json'
import mert from './library/mert-anxiety-intermediate.json'
import zeynep from './library/zeynep-grief-beginner.json'
import can from './library/can-burnout-intermediate.json'
import selin from './library/selin-relationship-advanced.json'

export const personaLibrary: PersonaData[] = [
  ayse as PersonaData,
  mert as PersonaData,
  zeynep as PersonaData,
  can as PersonaData,
  selin as PersonaData,
]

export function getPersonaById(id: string): PersonaData | undefined {
  return personaLibrary.find((p) => p.id === id)
}
