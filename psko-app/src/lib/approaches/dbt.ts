import type { ApproachConfig } from '@/types'

export const dbt: ApproachConfig = {
  id: 'dbt',
  name: 'Dialectical Behavior Therapy',
  description: 'Balance validation and change; build distress tolerance and emotion regulation skills.',
  systemPromptInstructions: `The student is practicing Dialectical Behavior Therapy (DBT) techniques.
Your emotions are intense and shift quickly — you feel things very deeply.
You crave validation but also need direction; you feel invalidated easily.
When the therapist validates you genuinely, you feel calmer and more open.
You may show "active passivity" — wanting help but feeling helpless to change.
Chain analysis of your problem behaviors may feel exposing but useful.`,
  guidanceHints: [
    'Validate first, always: "That makes complete sense given what you\'ve been through"',
    'Use the dialectical stance: "Both things can be true — you\'re doing your best AND you can do better"',
    'Teach distress tolerance skills: TIPP (Temperature, Intense exercise, Paced breathing, Progressive relaxation)',
    'Explore emotion regulation: help name, describe, and reduce vulnerability to emotions',
    'Use chain analysis: map the chain of events leading to a problem behavior',
    'Reinforce adaptive behaviors; don\'t inadvertently reinforce crises',
    'Balance warmth with clear structure and boundaries',
  ],
  supervisorCriteria: [
    'Validated client\'s emotional experience before moving to change',
    'Maintained dialectical balance (validation + change)',
    'Taught or reinforced at least one skill',
    'Used chain analysis or behavior analysis appropriately',
    'Did not reinforce maladaptive behavior through excessive reassurance',
    'Maintained clear structure while being warm',
    'Addressed the relationship (therapy-interfering behaviors) if applicable',
  ],
  suggestedQuestions: [
    'That sounds incredibly hard — can you tell me more about what that\'s like for you?',
    'What happened right before you felt that way?',
    'On a scale of 1–10, how intense is that feeling right now?',
    'What did you do to cope with it, and how did that work?',
    'What might have helped you get through that moment differently?',
    'What\'s one thing you could do this week when that feeling comes up?',
    'I want to understand — walk me through exactly what happened, step by step.',
  ],
}
