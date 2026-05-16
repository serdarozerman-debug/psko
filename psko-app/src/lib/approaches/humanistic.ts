import type { ApproachConfig } from '@/types'

export const humanistic: ApproachConfig = {
  id: 'humanistic',
  name: 'Humanistic / Person-Centered Therapy',
  description: 'Facilitate self-discovery through empathy, unconditional positive regard, and authenticity.',
  systemPromptInstructions: `The student is practicing Person-Centered therapy techniques.
Respond to genuine empathy by opening up gradually — warmth and acceptance make you feel safer to share.
If the therapist gives advice or judges you, subtly withdraw or become less forthcoming.
React positively to accurate empathic reflections — they help you feel understood.
Your self-concept is fragile in some areas; genuine acceptance helps you explore those parts.`,
  guidanceHints: [
    'Offer empathic reflections: "It sounds like you\'re feeling..."',
    'Provide unconditional positive regard — accept without judgment',
    'Use active listening: mirror and reflect content AND emotion',
    'Avoid giving advice or directing the client',
    'Be congruent: share genuine reactions when appropriate',
    'Follow the client\'s lead — don\'t impose structure',
    'Reflect the client\'s self-concept: "You described yourself as..."',
  ],
  supervisorCriteria: [
    'Demonstrated empathic attunement consistently',
    'Maintained unconditional positive regard',
    'Used reflective listening accurately',
    'Avoided advice-giving and directing',
    'Followed the client\'s pace and agenda',
    'Showed congruence appropriately',
    'Created a psychologically safe space',
  ],
  suggestedQuestions: [
    'How are you feeling right now, in this moment?',
    'What does that experience mean to you?',
    'It sounds like this has been really painful — can you tell me more?',
    'What would feel right for you?',
    'How long have you been carrying this?',
    'What do you need right now?',
    'I hear you saying... is that right?',
  ],
}
