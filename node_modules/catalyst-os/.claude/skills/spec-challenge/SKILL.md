# Spec Challenge

> **When to invoke:** When stress-testing a freshly shaped spec — interviewing the user across every branch of the design tree until shared understanding is reached.
> **Invoked by:** `/challenge-spec` command.
> **Position:** Optional intermediate step between `/catalyze-spec` and `/forge-spec`.

## Purpose

Shaping produces a spec. Challenge proves the spec is forge-ready. The orchestrator interviews the user one question at a time about every unresolved branch — assumptions, edge cases, integration points, scope ambiguity — patching `spec.md` and logging the trail to `handoff.md` as each answer lands.

This is not a sign-off step. It is an interrogation step. The bar is "every branch of the design tree resolved", not "user said yes".

## Skills Referenced

- `brainstorming` — same form (one question at a time, recommend an answer, acknowledge before moving on). The 9-question cap **does not apply** here; challenge is exhaustive by design.
- `agent-delegation` — if a question becomes a research task, spawn Seer/Scout rather than guessing.

## When NOT to Use

- Spec is trivial (rename, copy change, single-file fix) — go straight to `/forge-spec`.
- Spec is still in DRAFT and missing whole sections — finish `/catalyze-spec` first.
- Implementation has already started (`tasks.md` exists with completed tasks) — use `/update-spec` instead.
- Spec is COMPLETE — challenge is meaningless after the fact.

## Prerequisites

- Target spec folder exists at `.catalyst/specs/{slug}/`.
- `spec.md` exists with at minimum: Overview, Requirements, Acceptance Criteria, Technical Approach.
- `handoff.md` exists (create if missing — Catalyst should have left one).

If any prerequisite is missing, STOP and tell the user to run or finish `/catalyze-spec` first.

## Workflow

### Phase 1: Inventory the Decision Tree

Read in order: `spec.md`, `research.md`, `handoff.md`, plus any assets.

Build a working list (kept in your head or a scratch section in `handoff.md`) of every branch that needs resolution. Look for:

| Source | What to extract |
|--------|-----------------|
| `spec.md` → Open Questions | Each one is an explicit branch. |
| `spec.md` → Requirements | Vague verbs ("handle", "support", "manage") hide branches. |
| `spec.md` → Acceptance Criteria | Missing thresholds, missing failure modes. |
| `spec.md` → Out of Scope | Anything that *could* be in scope but isn't justified. |
| `spec.md` → Technical Approach | Library/framework choices without a stated reason. |
| `research.md` | Findings the spec didn't actually use. |
| `handoff.md` | Prior decisions that may now be in tension. |

Surface anything that, if guessed wrong, would cause `/forge-spec` to backtrack.

### Phase 2: Codebase First, User Second

> **Rule from grill-me:** "If a question can be answered by exploring the codebase, explore the codebase instead."

Before asking the user anything, walk the list and ask: can I answer this myself? Use `Read`, `grep`, or spawn **Seer** for deeper analysis. Only the residue — genuine product/scope/intent decisions — goes to the user.

### Phase 3: The Interview

For each remaining branch, ask **one question at a time** following these rules:

1. **Lead with your recommendation.** "I'd recommend X because Y. Agree, or push back?"
2. **Multiple choice when options exist.** Numbered. Each option has a one-line tradeoff.
3. **Acknowledge the answer.** One sentence. Connect it to the next question.
4. **Walk depth-first.** If an answer opens a new branch, resolve that branch before returning to the trunk.
5. **Resolve dependencies in order.** Don't ask about caching strategy before storage backend is chosen.
6. **No artificial cap.** Keep going until every branch is resolved. Stop only when:
   - The user says "good enough" / "ship it" / "stop".
   - You can no longer surface a branch that would cause `/forge-spec` to backtrack.

### Phase 4: Patch As You Go

After **each** resolved question, update the spec immediately. Do not batch.

**`spec.md` patches** — find the right home for the answer:

| Answer type | Goes in |
|-------------|---------|
| Removes an unknown | Delete from Open Questions |
| Adds a verifiable behavior | Append to Acceptance Criteria |
| Tightens scope | Add to Requirements or Out of Scope |
| Picks a library/pattern | Update Technical Approach |
| Reframes the problem | Update Overview / User Stories |

**`handoff.md` log** — append every Q&A under a `## Challenge Log` section:

```markdown
## Challenge Log

### {YYYY-MM-DD HH:MM} — {short topic}
**Q:** {the question, including the recommendation you led with}
**A:** {user's answer, verbatim or close to it}
**Spec impact:** {which section of spec.md was patched and how}
```

The log is the audit trail. Future-you (or anyone running `/primer-spec`) can read it and understand *why* the spec looks the way it does.

### Phase 5: Close Out

When the interview ends:

1. Re-read `spec.md` end-to-end. Check that patches are coherent and don't contradict each other.
2. Confirm Open Questions is empty (or every remaining item is explicitly deferred with a note).
3. Append a closing entry to `handoff.md`:
   ```markdown
   ### Challenge complete — {YYYY-MM-DD HH:MM}
   Branches resolved: {N}
   Spec sections updated: {list}
   Deferred (not blocking forge): {list or "none"}
   ```
4. Leave `spec.md` Status as `DRAFT` — challenge does not mark the spec ready for production. `/forge-spec` is still next.

## Output

```
Spec challenged.

Branches resolved: {N}
spec.md sections updated: {list}
handoff.md: +Challenge Log ({N} entries)
Deferred: {list or "none"}

Next steps:
- /forge-spec @{slug} to start TDD build
- /update-spec @{slug} "..." if you want further structural changes first
```

## Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| Asking the user something `grep` would answer | Phase 2 first — codebase before user. |
| Batching 4 questions because "they're related" | One at a time. Always. Related questions go in sequence, not in a list. |
| Asking without a recommendation | Lead with your pick + why. The user's job is to push back, not to design from scratch. |
| Logging answers in batch at the end | Patch `spec.md` and append to `handoff.md` after each answer — context is freshest then. |
| Stopping at 9 questions because brainstorming says so | Brainstorming caps apply to scoping. Challenge is exhaustive — keep going until branches are resolved. |
| Treating user's "looks fine" as resolution | If you have a branch in mind, ask it. "Looks fine" without a specific answer is not a resolution. |
| Marking spec READY / APPROVED at the end | Status stays DRAFT. `/forge-spec` is next. Challenge is not approval. |
