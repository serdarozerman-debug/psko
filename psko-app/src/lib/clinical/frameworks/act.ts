/**
 * ACT Framework — Acceptance & Commitment Therapy Hexaflex
 * Source: Hayes, S.C., Strosahl, K., & Wilson, K.G. (2012). ACT (2nd ed.). Guilford Press.
 */
import type { ApproachConfig } from '@/types'
import { act as base } from '@/lib/approaches/act'

export const actFramework: ApproachConfig = {
  ...base,
  phases: [
    {
      index: 0,
      name: 'Creative Hopelessness',
      objective: 'Help the client see that their current control strategies are not working, opening space for a new approach.',
      techniques: [
        'Explore what the client has tried: "What have you done to feel better or make this go away?"',
        'Gently reflect the cost of control strategies without pathologising',
        'Not-working question: "Has fighting this thought/feeling ultimately reduced your suffering?"',
        'Introduce the idea that the struggle itself may be part of the problem',
      ],
      watchFor: [
        'Client defensiveness about past efforts',
        'Premature reassurance — resist the urge to comfort; sit with hopelessness',
        'Confusion: creative hopelessness targets the system, not the client',
      ],
      triggerTurnMin: 0,
    },
    {
      index: 1,
      name: 'Acceptance & Defusion',
      objective: 'Introduce acceptance of internal experiences as an alternative to control; practise cognitive defusion.',
      techniques: [
        'Acceptance metaphor: "What if you could carry these feelings without fighting them?"',
        'Defusion: "Notice you are having the thought that… rather than the thought is true"',
        'Leaves on a stream: visualise thoughts floating by without attachment',
        'Label thoughts: "My mind is telling me…"',
        'Willingness scale: "On a 0-10 scale, how willing are you to feel that feeling right now?"',
      ],
      watchFor: [
        'Client interpreting acceptance as approval or giving up',
        'Dissociation from painful material — defusion should not become avoidance',
        'Cultural or linguistic barriers to metaphor-based work',
      ],
      triggerTurnMin: 5,
    },
    {
      index: 2,
      name: 'Present-Moment Awareness & Self-as-Context',
      objective: 'Anchor the client in present experience and introduce the observing self as a stable vantage point.',
      techniques: [
        'Brief grounding: "Where do you notice this feeling in your body right now?"',
        'Observer exercise: "Notice who is noticing your thoughts — that is the observing you"',
        'Chessboard metaphor: pieces (thoughts/feelings) move; the board (self) remains',
        'Continuity of self: "You have always been the one observing, even as experiences changed"',
      ],
      watchFor: [
        'Depersonalisation — distinguish healthy self-as-context from dissociative experience',
        'Over-intellectualising the observer concept',
        'Trauma history — proceed gently with present-moment awareness',
      ],
      triggerTurnMin: 10,
    },
    {
      index: 3,
      name: 'Values Clarification',
      objective: 'Help the client identify what truly matters to them across life domains, independent of feelings.',
      techniques: [
        'Values compass: "If you could choose how you live, what would matter most?"',
        'Funeral exercise: "What would you want people to say about how you lived?"',
        'Distinguish values from goals: "Values are directions, not destinations"',
        'Identify life domains: work, relationships, health, personal growth, community',
        'Check for compliance vs. chosen values: "Is this what YOU want, or what others expect?"',
      ],
      watchFor: [
        'Values contaminated by "have to" rather than "want to"',
        'Difficulty accessing values due to depression or trauma numbing',
        'Values conflicts (e.g. career vs. family) requiring compassionate exploration',
      ],
      triggerTurnMin: 16,
    },
    {
      index: 4,
      name: 'Committed Action',
      objective: 'Build patterns of values-consistent action despite the presence of difficult thoughts and feelings.',
      techniques: [
        'ACT matrix: map towards-moves (values) vs. away-moves (avoidance)',
        'SMART values-based goals: specific, meaningful actions toward identified values',
        'Identify barriers: "What shows up inside that pulls you away from this action?"',
        'Defusion + commitment: "Even with that thought, can you take this step?"',
        'Review and adjust: "How did the experiment go? What did you learn?"',
      ],
      watchFor: [
        'Action plans that are actually avoidance in disguise',
        'Perfectionistic goals that set the client up for perceived failure',
        'Insufficient link back to identified values',
      ],
      triggerTurnMin: 22,
    },
  ],
}
