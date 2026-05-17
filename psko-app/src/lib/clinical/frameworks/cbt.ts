/**
 * CBT Framework — Beck's Cognitive Behavior Therapy model
 * Source: Beck, J.S. (2020). Cognitive Behavior Therapy: Basics and Beyond (3rd ed.). Guilford Press.
 */
import type { ApproachConfig } from '@/types'
import { cbt as base } from '@/lib/approaches/cbt'

export const cbtFramework: ApproachConfig = {
  ...base,
  phases: [
    {
      index: 0,
      name: 'Engagement & Socialisation',
      objective: 'Build rapport, normalise the therapeutic process, set a collaborative agenda, and introduce the CBT model.',
      techniques: [
        'Warm, non-judgmental opening: "What brings you in today?"',
        'Brief psychoeducation on how thoughts → feelings → behaviours connect',
        'Collaborative agenda setting: agree on 1-2 focus areas for the session',
        'Normalise the presenting concern: "Many people experience this"',
      ],
      watchFor: [
        'Catastrophic thinking about the therapy process itself',
        'Excessive self-criticism or shame when describing the problem',
        'Signs of crisis or immediate risk',
      ],
      triggerTurnMin: 0,
    },
    {
      index: 1,
      name: 'Problem Assessment',
      objective: 'Identify the specific situation, automatic thoughts, emotions, and behaviours using the ABC / situational analysis model.',
      techniques: [
        'Guided situational analysis: "Walk me through a recent moment when you felt this way"',
        'Thought record (first column): Situation → Automatic thoughts → Emotion → Intensity',
        'Downward arrow: "If that thought were true, what would it mean?"',
        'Decatastrophising: "What is the worst / best / most realistic outcome?"',
        'Socratic questions: "What evidence supports this thought? What contradicts it?"',
      ],
      watchFor: [
        'Thought–action fusion (believing a thought = performing it)',
        'All-or-nothing thinking patterns',
        'Emotional reasoning ("I feel worthless, therefore I am")',
      ],
      triggerTurnMin: 4,
    },
    {
      index: 2,
      name: 'Case Formulation',
      objective: 'Connect surface automatic thoughts to intermediate and core beliefs; introduce the cognitive model collaboratively.',
      techniques: [
        'Map the cognitive model: core belief → intermediate belief → automatic thought → emotion',
        'Identify recurring themes across multiple situations',
        'Validate the historical origins of core beliefs',
        'Introduce the idea of schemas as learned patterns, not facts',
        'Feedback check: "Does this map resonate with your experience?"',
      ],
      watchFor: [
        'Premature closure on core belief identification',
        'Client overwhelm at the depth of the formulation',
        'Possible comorbid presentation (anxiety + depression)',
      ],
      triggerTurnMin: 9,
    },
    {
      index: 3,
      name: 'Intervention',
      objective: 'Apply evidence-based CBT techniques to challenge distorted cognitions and modify maladaptive behaviours.',
      techniques: [
        'Thought challenging: examine evidence for and against the automatic thought',
        'Behavioural experiment: design a real-world test of the belief',
        'Activity scheduling: introduce pleasurable / mastery activities',
        'Graded task assignment: break avoidance into small achievable steps',
        'Guided discovery: lead client to alternative perspectives through questioning',
        'Pie chart technique for responsibility apportionment',
      ],
      watchFor: [
        'Client dismissing alternative perspectives too quickly',
        'Avoidance or homework non-compliance',
        'Safety behaviours undermining exposure work',
      ],
      triggerTurnMin: 15,
    },
    {
      index: 4,
      name: 'Consolidation & Relapse Prevention',
      objective: 'Reinforce progress, identify early warning signs, develop a relapse prevention plan, and discuss session-end homework.',
      techniques: [
        'Session summary: "What have we covered today? What stands out?"',
        'Collaborative homework assignment: "What one thing could you try this week?"',
        'Early warning sign identification: "What would tell you things are slipping?"',
        'Coping card: write out 2-3 key adaptive thoughts to use between sessions',
        'Celebrate progress: validate the effort taken',
      ],
      watchFor: [
        'Resistance to homework ("I already know it but can\'t do it")',
        'Over-reliance on therapist validation',
        'Unprocessed material emerging at the end of session',
      ],
      triggerTurnMin: 25,
    },
  ],
}
