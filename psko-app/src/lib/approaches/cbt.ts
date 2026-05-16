import type { ApproachConfig } from '@/types'

export const cbt: ApproachConfig = {
  id: 'cbt',
  name: 'Cognitive Behavioral Therapy',
  description: 'Identify and challenge negative thought patterns and behaviors.',
  systemPromptInstructions: `The student is practicing Cognitive Behavioral Therapy (CBT) techniques.
Respond in ways that reflect your automatic thoughts and core beliefs naturally — don't analyze yourself.
When the therapist asks about your thoughts, share them as raw experiences, not clinical concepts.
If they try to help you challenge a thought, show realistic resistance or partial openness depending on your emotional state.
Allow the session to unfold organically — don't rush toward insight.`,
  guidanceHints: [
    'Set a clear agenda at the start: ask what the client wants to focus on today',
    'Ask Socratic questions: "What evidence supports that belief? What contradicts it?"',
    'Help the client identify automatic thoughts: "What went through your mind just then?"',
    'Explore the ABC model: Activating event → Belief → Consequence',
    'Avoid giving direct advice — guide discovery instead',
    'Check in regularly: "Does this make sense to you so far?"',
    'Towards the end, collaboratively set a homework task',
  ],
  supervisorCriteria: [
    'Set agenda collaboratively at session start',
    'Used Socratic questioning to elicit cognitions',
    'Identified and explored at least one automatic thought',
    'Linked thoughts, feelings, and behaviors explicitly',
    'Avoided giving direct advice; used guided discovery',
    'Checked client understanding regularly',
    'Paced the session appropriately',
  ],
  suggestedQuestions: [
    'What would you like to focus on today?',
    'What went through your mind when that happened?',
    'On a scale of 1–10, how strongly do you believe that thought?',
    'What evidence do you have for and against that belief?',
    'How does that thought make you feel in your body?',
    'What would you tell a close friend in this situation?',
    'Has there been a time when things went differently?',
  ],
}
