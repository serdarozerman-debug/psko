# Pattern: Session Guidance UI (Real-Time Sidebar)

> Extracted from: `2026-05-17-clinical-psychology-platform`
> Extracted: 2026-05-18
> Domain: simulation, ui, clinical-ai

## Summary

A real-time session guidance sidebar component that polls a phase API and shows the current protocol phase, clinical objective, next technique suggestion, and watchpoint. Updates every N turns. Designed for clinical training simulations where students need live coaching without interrupting the conversation flow.

## When to Use

- AI simulation interfaces where the user needs live, structured guidance without it blocking the conversation
- Any training app where "what should I do next?" is a key learning moment
- Situations where you want approach-specific color theming and phase-aware UI

## Component: SessionGuidancePanel

**Key file:** `src/components/simulation/SessionGuidancePanel.tsx`

### What It Displays

```
[ Phase 2 of 4: Assessment ]     ████████░░░░ 52%

Clinical objective:
Elicit the client's automatic thoughts about the presenting problem.

Next move:
Ask: "When you notice yourself feeling anxious, what's the first thought that comes to mind?"

Watch for:
Early signs of resistance to exploring cognitions — normalize gently.

▼ Phase history
  Phase 0 → 1 at turn 3: "Sufficient rapport established"
  Phase 1 → 2 at turn 8: "Initial complaint mapped; ready for cognitive exploration"
```

### Data Source

The panel polls `GET /api/session/[id]/phase` after each message (or every 5 turns for efficiency). The route is query-only — no AI call — so it responds in < 100ms.

Returns `PhaseGuidance`:
```typescript
interface PhaseGuidance {
  currentPhaseIndex: number
  currentPhase: ProtocolPhase
  progressPercent: number
  nextTechniqueHint: string
  watchpoint: string
  phaseTransitionJustification?: string
}
```

### Polling Logic

```typescript
// Poll after each message, debounced to 500ms
useEffect(() => {
  const fetchGuidance = async () => {
    const res = await fetch(`/api/session/${sessionId}/phase`)
    const data = await res.json()
    setGuidance(data)
  }
  fetchGuidance()
}, [messageCount])
```

For efficiency: only trigger on turns divisible by 5 to avoid hammering the API.

### Phase Transition Animation

When `currentPhaseIndex` changes, apply a brief highlight animation (Tailwind `animate-pulse` or custom CSS transition). Show the transition justification in the phase history list.

### Approach-Specific Color Scheme

| Approach | Primary Color | Tailwind Class |
|----------|---------------|----------------|
| CBT | Blue | `bg-blue-500` / `text-blue-700` |
| Psychodynamic | Purple | `bg-purple-500` / `text-purple-700` |
| ACT | Green | `bg-green-500` / `text-green-700` |
| DBT | Orange | `bg-orange-500` / `text-orange-700` |
| Humanistic | Warm Red | `bg-rose-500` / `text-rose-700` |

### Error Handling

If the phase API fails (network error, session not found), fall back to static generic hints. Never show a broken/empty guidance panel.

```typescript
const fallbackGuidance = {
  currentPhaseIndex: 0,
  currentPhase: { name: 'Session in progress', objective: 'Listen actively and respond empathically.' },
  progressPercent: 0,
  nextTechniqueHint: 'Ask an open question about what brought the client here today.',
  watchpoint: 'Notice the client\'s emotional tone and pacing.'
}
```

### Responsive Behavior

- Desktop: right sidebar, ~300px wide
- Mobile: collapsible bottom panel (toggle with "Guidance" button)
- Use CSS grid or flex to adjust layout at `md:` breakpoint

## Multilingual Support

All UI labels, phase names, technique suggestions, and watchpoints support Turkish via the `text: { en, tr }` pattern on ProtocolPhase objects. Detect language from user session preference and pass as query param or header to the phase API.

## Key Decisions

**Why poll instead of WebSocket?**
Phase changes are infrequent (every 5+ turns). Polling is simpler, stateless, and avoids WebSocket connection management complexity. Acceptable latency for a guidance sidebar.

**Why not inline in the chat view?**
Keeping guidance in a sidebar preserves the therapeutic conversation frame. Mixing coaching text into the chat would break immersion and make it harder for students to distinguish their own messages from system coaching.

**Why show phase history?**
Phase transition history is a learning artifact. Students can review why the session moved from one phase to the next — this is core pedagogical value of the protocol-phase approach.

## Related Patterns

- `therapeutic-framework-system.md` — defines the ProtocolPhase data this component consumes
- `clinical-assessment-workflow.md` — the intake flow that determines which framework/approach is active
