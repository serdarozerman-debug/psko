# Handoff: Clinical Intelligence Engine

> Status: DRAFT
> Iteration: 3 (following dual-role simulation flows)

## TL;DR

Three upgrades that transform PSKO from a chat simulation into an academically grounded clinical trainer:

1. **Clinical Framework Library** — Each therapeutic approach gets a 4-6 phase protocol (Beck CBT, CCRT psychodynamic, ACT Hexaflex, DBT stages, Rogers empathy ladder) with per-phase techniques drawn from peer-reviewed sources.

2. **Pre-Session Intake Questionnaire** — PHQ-9 + GAD-7 inspired 10-15 question form before session. Claude analyzes answers → generates case formulation → recommends approach. Student confirms or overrides.

3. **Dynamic Guidance Panel** — Right panel updates in real time as the session progresses through protocol phases. No more static hints — phase-aware, turn-count + content-triggered.

## Future Iterations (not this spec)

| Feature | Why deferred |
|---------|-------------|
| Voice recognition + TTS | Separate technology stack (Web Speech API / Whisper / ElevenLabs). Independent of clinical content. |
| Live video avatar | Requires D-ID/HeyGen API, very high cost & complexity. Needs voice first. |
| Face/emotion recognition | Requires video first. Privacy-sensitive. Highest complexity of all 6 features. |

## Roadmap Impact

Updates Phase 2 roadmap to include this iteration:
- ✅ Competency scoring (already delivered via CTS-R feedback)
- 🔜 Clinical framework library with protocol phases
- 🔜 Pre-session intake + case formulation
- 🔜 Dynamic real-time guidance panel

Phase 4 roadmap already includes voice simulation — that remains as is.

## Key Design Decisions

**Intake is Claude-driven, not rule-based.** PHQ-9/GAD-7 scores are inputs to a Claude case formulation call, not deterministic switch statements. This mirrors how a real supervisor reasons about case presentations.

**Phase detection is lightweight.** Every 5 turns, a 150-token non-blocking Claude call classifies the session phase. Not every message — cost-effective and adds < 1s async.

**No clinical diagnosis output.** Scores feed the AI's recommendation reasoning. The UI never shows "PHQ-9 score: 14 = Moderate Depression". Always framed as educational context.

**Backward compatible.** Existing `ApproachConfig` interface is extended, not replaced. Sessions without intake data default to the existing static guidance behavior.

## Next Lifecycle Step

Run `/forge-spec @2026-05-16-clinical-intelligence-engine` to build.
