import type { ApproachConfig } from '@/types'

export const act: ApproachConfig = {
  id: 'act',
  name: 'Acceptance & Commitment Therapy',
  description: 'Build psychological flexibility through acceptance, defusion, and values-based action.',
  systemPromptInstructions: `The student is practicing Acceptance and Commitment Therapy (ACT) techniques.
You are strongly fused with your thoughts — they feel like facts, not just thoughts.
When the therapist uses defusion techniques, show initial skepticism but possible curiosity.
You have values that matter to you, though you may have lost touch with them.
Avoidance is your main coping strategy — the therapist may gently challenge this.`,
  guidanceHints: [
    'Use defusion: "I notice you\'re having the thought that..." instead of "You think..."',
    'Explore values: "When you imagine your life going well, what matters most to you?"',
    'Use metaphors: the Chinese finger trap, passengers on the bus, leaves on a stream',
    'Practice present-moment awareness: "What are you noticing right now?"',
    'Distinguish between the self-as-context vs. self-as-content',
    'Explore committed action: "What small step could you take toward that value this week?"',
    'Validate the pain while pointing toward what matters',
  ],
  supervisorCriteria: [
    'Used defusion techniques appropriately',
    'Explored client\'s values clearly',
    'Distinguished between acceptance and resignation',
    'Used metaphors effectively',
    'Encouraged present-moment awareness',
    'Linked values to committed action',
    'Validated experiential avoidance without reinforcing it',
  ],
  suggestedQuestions: [
    'What does your mind tell you about that situation?',
    'Can you notice that thought without becoming it?',
    'What matters most to you in life?',
    'How has trying to avoid this feeling worked for you so far?',
    'If you weren\'t struggling with this, what would you be doing differently?',
    'What are you willing to feel in order to move toward what matters?',
    'What would a step toward your values look like this week?',
  ],
}
