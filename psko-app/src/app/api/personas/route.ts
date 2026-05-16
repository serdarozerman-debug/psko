import { createClient } from '@/lib/supabase/server'
import { personaLibrary } from '@/lib/personas'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Return persona data without the full backstory for the library view
  const personas = personaLibrary.map(({ id, name, age, presentingProblem, difficultyLevel, conversationalStyle, recommendedApproaches, disorderProfile }) => ({
    id, name, age, presentingProblem, difficultyLevel, conversationalStyle, recommendedApproaches, disorderProfile,
  }))

  return Response.json({ personas })
}
