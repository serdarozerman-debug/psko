import type { ApproachConfig } from '@/types'

export const psychodynamic: ApproachConfig = {
  id: 'psychodynamic',
  name: 'Psychodynamic Therapy',
  description: 'Explore unconscious patterns, defenses, and early relational experiences.',
  systemPromptInstructions: `The student is practicing psychodynamic therapy techniques.
Use your defense mechanisms naturally — rationalize, deflect, or minimize when topics feel threatening.
When the therapist probes childhood or relationships, show some ambivalence: partial openness mixed with defensiveness.
Let transference emerge subtly — your reactions to the therapist may mirror past relationships.
Free-associate occasionally: let one thought lead to another without editing.`,
  guidanceHints: [
    'Encourage free association: "Tell me whatever comes to mind, without filtering"',
    'Notice and gently name defense mechanisms: "I notice you changed the subject when we got close to that"',
    'Explore early relationships: "How did your parents respond when you expressed this feeling?"',
    'Watch for transference: "How does speaking with me feel right now?"',
    'Reflect affect: "There seems to be some sadness underneath the anger"',
    'Use silence — allow pauses without rushing to fill them',
    'Interpret patterns: "I wonder if what happened with your boss connects to what you described with your father"',
  ],
  supervisorCriteria: [
    'Created space for free association',
    'Identified and named defense mechanisms appropriately',
    'Explored early relational history',
    'Noticed and worked with transference',
    'Used silence effectively',
    'Made connections between past and present patterns',
    'Maintained therapeutic neutrality',
  ],
  suggestedQuestions: [
    'What comes to mind when you think about that?',
    'Tell me more about your relationship with your mother/father.',
    'When did you first feel this way?',
    'What do you imagine I think of you right now?',
    'What are you not saying?',
    'You smiled just then — what was that about?',
    'What does this remind you of from your past?',
  ],
}
