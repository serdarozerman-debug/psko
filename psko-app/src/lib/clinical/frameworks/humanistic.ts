/**
 * Humanistic / Person-Centred Framework — Rogers' core conditions
 * Source: Rogers, C.R. (1961). On Becoming a Person. Houghton Mifflin.
 *         Egan, G. (2014). The Skilled Helper (10th ed.). Cengage.
 */
import type { ApproachConfig } from '@/types'
import { humanistic as base } from '@/lib/approaches/humanistic'

export const humanisticFramework: ApproachConfig = {
  ...base,
  phases: [
    {
      index: 0,
      name: 'Presence & Safety',
      objective: 'Establish a safe, non-judgmental presence; communicate unconditional positive regard from the first moment.',
      techniques: [
        'Fully attend: minimise distractions, make gentle eye contact, open body posture',
        'UPR opener: "Whatever you share here, I am not here to judge you"',
        'Minimal encouragers: "Mm-hmm", "Go on", "Tell me more"',
        'Silence as tool: allow pauses for the client to feel heard',
        'Mirroring: gently reflect back key words the client uses',
      ],
      watchFor: [
        'Rushed or closed questions disrupting the client\'s narrative',
        'Premature problem-solving — humanistic work prioritises being before doing',
        'Client testing whether it is safe to share something difficult',
      ],
      triggerTurnMin: 0,
    },
    {
      index: 1,
      name: 'Empathic Reflection',
      objective: 'Demonstrate accurate empathy by reflecting both content and the emotional subtext of what the client shares.',
      techniques: [
        'Content reflection: "So what you\'re saying is…"',
        'Feeling reflection: "It sounds like you\'re feeling… about…"',
        'Double-sided reflection: "Part of you feels… and another part feels…"',
        'Empathy check: "Does that capture it, or is there more?"',
        'Tentative language: "I wonder if…", "It seems like…", "Correct me if I\'m wrong"',
      ],
      watchFor: [
        'Parroting — mechanical repetition without emotional resonance',
        'Therapist leading — introducing content the client hasn\'t raised',
        'Discrepancy between the client\'s words and affect',
      ],
      triggerTurnMin: 4,
    },
    {
      index: 2,
      name: 'Advanced Empathy & Congruence',
      objective: 'Move to advanced empathy — reflecting what is implied or not yet fully articulated; model congruence.',
      techniques: [
        'Advanced empathy: "I get a sense that underneath the frustration there might be some hurt"',
        'Immediacy: "Right now, in this moment, I notice you seem…"',
        'Therapist congruence: share genuine reactions carefully — "I notice I feel moved by what you\'ve just shared"',
        'Acknowledge what is hard to say: "It takes courage to talk about this"',
        'Reflect contradictions gently: "I notice you smile when you say that — what\'s that about?"',
      ],
      watchFor: [
        'Therapist\'s own emotional reactions being projected onto the client',
        'Advanced empathy landing as interpretation rather than reflection',
        'Client shame response to being seen deeply',
      ],
      triggerTurnMin: 10,
    },
    {
      index: 3,
      name: 'Facilitation & Growth',
      objective: 'Hold space for the client\'s own insight and growth; trust the actualising tendency.',
      techniques: [
        'Open exploration: "What feels most important to explore further?"',
        'Strength spotting: "I notice that even in saying that, you showed a lot of insight"',
        'Ownership language: support client in owning their experience ("I feel" not "you make me feel")',
        'Meaning-making: "What does this experience mean to you now?"',
        'Future self: "What would a version of you who was living more fully look like?"',
      ],
      watchFor: [
        'Therapist directing growth — the goal is to facilitate, not prescribe',
        'Client dependence on therapist approval for self-worth',
        'Existential themes (meaninglessness, isolation) surfacing',
      ],
      triggerTurnMin: 18,
    },
    {
      index: 4,
      name: 'Integration & Affirmation',
      objective: 'Support the client in integrating their experience and recognising their own resourcefulness.',
      techniques: [
        'Summarise the journey of the session: "We started with… and arrived at…"',
        'Affirm growth: "I\'m struck by how much clarity you\'ve found"',
        'Leave next steps with the client: "What do you take away from today?"',
        'Validate autonomy: "You already have so much of what you need"',
      ],
      watchFor: [
        'Empty validation — affirmation must be grounded in specific things the client did',
        'Client discomfort with praise (common in low self-worth)',
        'Unfinished emotional business needing to be named but not forced to resolve',
      ],
      triggerTurnMin: 26,
    },
  ],
}
