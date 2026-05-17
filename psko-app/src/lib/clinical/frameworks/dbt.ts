/**
 * DBT Framework — Dialectical Behavior Therapy
 * Source: Linehan, M.M. (2014). DBT Skills Training Manual (2nd ed.). Guilford Press.
 */
import type { ApproachConfig } from '@/types'
import { dbt as base } from '@/lib/approaches/dbt'

export const dbtFramework: ApproachConfig = {
  ...base,
  phases: [
    {
      index: 0,
      name: 'Biosocial Model & Orientation',
      objective: 'Explain the biosocial model of emotional dysregulation; validate the client\'s experience and build commitment.',
      techniques: [
        'Psychoeducation: "Emotional sensitivity + invalidating environment = dysregulation"',
        'Validate both poles of the dialectic: "You are doing your best AND you need to change"',
        'Commitment strategies: "What brings you here? What is one thing you want to be different?"',
        'Devil\'s advocate: gently challenge ambivalence to strengthen commitment',
        'Identify primary and secondary emotions',
      ],
      watchFor: [
        'Active suicidal ideation — DBT has a specific hierarchy: life-threatening behaviour first',
        'Therapy-interfering behaviours: lateness, session disruption',
        'Extreme black-and-white framing of the self',
      ],
      triggerTurnMin: 0,
    },
    {
      index: 1,
      name: 'Mindfulness Core Skills',
      objective: 'Introduce the "what" (observe, describe, participate) and "how" (non-judgmentally, one-mindfully, effectively) mindfulness skills.',
      techniques: [
        'Observe: "Just notice what is happening without labelling it good or bad"',
        'Describe: "Put words to the experience without adding judgement"',
        'Wise Mind: "Find the balance between emotion mind and reasonable mind"',
        'One-mindfully: "Do one thing at a time with full attention"',
        'Non-judgmentally: "Describe facts, not evaluations — what would a camera see?"',
      ],
      watchFor: [
        'Mindfulness triggering dissociation or trauma responses',
        'Client using "mindfulness" as avoidance of action',
        'Difficulty distinguishing emotion mind from reasonable mind',
      ],
      triggerTurnMin: 5,
    },
    {
      index: 2,
      name: 'Distress Tolerance',
      objective: 'Teach crisis survival skills for tolerating intense emotional pain without making things worse.',
      techniques: [
        'TIPP: Temperature (cold water), Intense exercise, Paced breathing, Paired muscle relaxation',
        'ACCEPTS: Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations',
        'Self-soothe with five senses: what can you see/hear/smell/taste/touch that is soothing?',
        'Radical acceptance: "Reality is what it is — fighting it causes suffering"',
        'Pros and cons: "What are the pros and cons of tolerating this vs. acting on urges?"',
      ],
      watchFor: [
        'Crisis skills being used as permanent avoidance rather than bridge to change',
        'Radical acceptance being confused with approval of the situation',
        'Impulsive high-risk behaviours between sessions',
      ],
      triggerTurnMin: 10,
    },
    {
      index: 3,
      name: 'Emotion Regulation',
      objective: 'Reduce emotional vulnerability and intensity; increase positive emotional experiences.',
      techniques: [
        'PLEASE: treat PhysicaL illness, balance Eating, avoid mood-Altering substances, balance Sleep, get Exercise',
        'Opposite action: identify emotion → identify action urge → do opposite',
        'Check the facts: "Is the emotion justified given the facts of the situation?"',
        'Problem-solving: "Is there a concrete problem to solve here?"',
        'Build mastery: schedule one activity per day that creates a sense of achievement',
        'Accumulate positive events: increase pleasant activities based on personal values',
      ],
      watchFor: [
        'Secondary emotions about emotions ("I\'m ashamed that I feel angry")',
        'Emotional avoidance masquerading as regulation',
        'Difficulty identifying body sensations linked to emotions',
      ],
      triggerTurnMin: 18,
    },
    {
      index: 4,
      name: 'Interpersonal Effectiveness',
      objective: 'Build skills for maintaining relationships, self-respect, and achieving objectives in interactions.',
      techniques: [
        'DEAR MAN: Describe, Express, Assert, Reinforce, stay Mindful, Appear confident, Negotiate',
        'GIVE: Gentle, Interested, Validate, Easy manner (for maintaining relationships)',
        'FAST: Fair, no Apologies, Stick to values, Truthful (for self-respect)',
        'Identify priorities: "In this situation, what matters most — the objective, the relationship, or your self-respect?"',
        'Role-play difficult conversations',
      ],
      watchFor: [
        'Passivity → aggression swing without middle ground',
        'Shame-based avoidance of assertive communication',
        'Intense fear of abandonment driving relationship behaviours',
      ],
      triggerTurnMin: 25,
    },
  ],
}
