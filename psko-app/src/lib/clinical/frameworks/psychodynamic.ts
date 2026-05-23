/**
 * Psychodynamic Framework — CCRT method
 * Source: Luborsky, L. (1984). Principles of Psychoanalytic Psychotherapy. Basic Books.
 *         Shedler, J. (2010). The efficacy of psychodynamic psychotherapy. American Psychologist.
 */
import type { ApproachConfig } from '@/types'
import { psychodynamic as base } from '@/lib/approaches/psychodynamic'

export const psychodynamicFramework: ApproachConfig = {
  ...base,
  phases: [
    {
      index: 0,
      name: 'Rapport & Free Association',
      objective: 'Build a safe therapeutic alliance; encourage uncensored expression and begin listening for relational themes.',
      techniques: [
        'Open-ended exploration: "Tell me about what brought you here"',
        'Reflective listening: reflect content and emotion without interpretation',
        'Encourage free association: "Say whatever comes to mind"',
        'Track affect: notice shifts in tone, pauses, non-verbal cues',
      ],
      watchFor: [
        'Intellectualisation — client talks about feelings rather than feeling them',
        'Early signs of idealisation or devaluation of the therapist',
        'Sudden topic changes as avoidance of difficult material',
      ],
      triggerTurnMin: 0,
    },
    {
      index: 1,
      name: 'CCRT Theme Identification',
      objective: 'Identify the Core Conflictual Relationship Theme: Wish (W), Response of Other (RO), Response of Self (RS).',
      techniques: [
        'Relationship episode elicitation: "Tell me about a recent interaction that stood out"',
        'Listen for the wish: "What did you want from this person?"',
        'Identify the feared/actual response of others',
        'Reflect the response of self: "And how did you react when they did that?"',
        'Tentative linking: "I notice a pattern — does this feel familiar?"',
      ],
      watchFor: [
        'Resistance to exploring relational patterns ("That\'s just who I am")',
        'Splitting: all-good or all-bad representations of others',
        'Denial of the wish — client minimises their own needs',
      ],
      triggerTurnMin: 5,
    },
    {
      index: 2,
      name: 'Defence Analysis',
      objective: 'Identify and gently name the defences the client uses to manage anxiety around the core theme.',
      techniques: [
        'Naming defences neutrally: "I notice when this topic comes up you tend to shift to humour"',
        'Defence ladder: surface defences (intellectualisation) → deeper ones (projection)',
        'Explore the function: "What does this help you avoid feeling?"',
        'Validate the defence before challenging: "It makes sense this protected you"',
      ],
      watchFor: [
        'Premature confrontation of defences causing rupture',
        'Primitive defences suggesting more disturbed functioning (splitting, projection)',
        'Therapist counterransference — own reactions to the client',
      ],
      triggerTurnMin: 10,
    },
    {
      index: 3,
      name: 'Transference & Working Through',
      objective: 'Explore how the CCRT theme appears in the therapeutic relationship and work through it collaboratively.',
      techniques: [
        'Transference interpretation: "I wonder if what you just described is happening between us too"',
        'Here-and-now focus: "What are you feeling toward me right now?"',
        'Link past to present: "How does this pattern connect to your earlier relationships?"',
        'Working through: revisit the theme multiple times from different angles',
        'Alliance repair if rupture: acknowledge and explore therapeutic relationship tensions',
      ],
      watchFor: [
        'Intense negative or erotic transference requiring careful management',
        'Re-traumatisation from moving too fast into early material',
        'Client confusion between therapist and significant other',
      ],
      triggerTurnMin: 18,
    },
    {
      index: 4,
      name: 'Integration & Consolidation',
      objective: 'Help client integrate insights, recognise growth, and carry the CCRT awareness into daily relationships.',
      techniques: [
        'Narrative integration: "How has your understanding of this pattern shifted?"',
        'Generalisation: "Where else in your life is this showing up differently now?"',
        'Termination processing (if applicable): explore feelings about ending',
        'Leaving the door open: "What would bring you back?"',
      ],
      watchFor: [
        'Regression as termination approaches',
        'Denial of progress or inability to acknowledge change',
        'Unresolved grief or loss themes emerging',
      ],
      triggerTurnMin: 28,
    },
  ],
}
