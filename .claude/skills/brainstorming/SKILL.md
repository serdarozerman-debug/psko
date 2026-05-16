# Brainstorming

> **When to invoke:** Before any creative work — creating features, building components, adding functionality, or modifying behavior. Any time design decisions are needed.
> **Used by:** Oracle agent, Catalyst orchestrator, any agent facing design decisions.

## Purpose

Explore user intent, requirements, and design through collaborative dialogue BEFORE implementation. Prevents building the wrong thing by ensuring alignment first.

## Core Principle

**One question at a time. Suggest when you can. Listen before you build.**

## The Rules

```
1. NEVER batch questions — ask one at a time
2. NEVER ask open-ended when you have options — present multiple choice
3. ALWAYS lead with your recommendation and explain why
4. ALWAYS acknowledge the answer before asking the next question
5. NEVER exceed 3 rounds of 3 questions each (9 questions max)
6. STOP asking when requirements are clear — don't interrogate
```

## One Question at a Time

Batching overwhelms users and produces lower-quality answers. One focused question gets a focused answer.

```
WRONG:
  "What users will this serve? What's the timeline?
   Any technical constraints? What about the database?"

RIGHT:
  "Who is the primary user for this feature?"
  [wait for answer]
  "What's the most important thing they need to accomplish?"
  [wait for answer]
```

**Why:** Users answer the easiest question and skip the rest. One at a time forces thoughtful responses.

## Multiple Choice with Recommendations

When known options exist, present them. Lead with your recommendation and explain why.

```
WRONG:
  "What database should we use?"

RIGHT:
  "For the database, I'd recommend one of these:

   1. **Supabase** (recommended) — already in your tech stack,
      gives you auth + storage + realtime out of the box
   2. **Prisma + PostgreSQL** — more control, better for
      complex queries, but more setup
   3. **Firebase** — fast prototyping, but vendor lock-in

   Which fits your needs best?"
```

**When to use open-ended instead:**
- Genuinely novel problems with no obvious options
- Understanding user intent ("What problem are you trying to solve?")
- Exploring scope ("What should be excluded?")

## Suggest Based on Context

Before asking questions, check existing project context:
- `.catalyst/main/tech-stack.md` — suggest compatible technologies
- `.catalyst/main/architecture.md` — suggest patterns that fit
- `.catalyst/main/conventions.md` — align with existing conventions
- `.catalyst/library/` — reference patterns from completed specs

```
WRONG:
  "How should we handle authentication?"

RIGHT:
  "Your tech stack includes Supabase, which has built-in auth.
   Should we use Supabase Auth, or do you need something custom?"
```

## Build on Answers

After each answer, acknowledge what you heard and connect it to the next question. Don't rapid-fire.

```
"Got it — so the primary users are small business owners who need
 to manage invoices. That tells me we should prioritize simplicity
 over power-user features.

 Next question: should this work offline, or is online-only acceptable?"
```

## Question Flow

### Round 1: Intent (1-3 questions)
- What problem does this solve?
- Who is the primary user?
- What does success look like?

### Round 2: Scope (1-3 questions)
- What's included? What's explicitly excluded?
- What's the simplest version that would be useful?
- Any hard constraints (timeline, tech, etc.)?

### Round 3: Details (1-3 questions, only if needed)
- Edge cases and error handling
- Integration points with existing features
- Performance or scale requirements

**Maximum 3 rounds, maximum 3 questions per round.** If requirements are clear after Round 1, stop asking and move on.

## YAGNI at the Requirements Phase

Actively push back on scope creep during requirements:

```
User: "And it should also support PDF export, CSV download,
       and integration with Google Sheets."

Oracle: "Those are all useful, but for the first version,
         which ONE of those is essential? We can add the
         others in a follow-up spec."
```

## Incremental Design Validation

For complex features, validate the design in sections before compiling the full spec:

1. **Present architecture overview** (200-300 words)
2. **Ask:** "Does this look right so far?"
3. **If pushback:** adjust and re-present that section
4. **If approved:** present next section

**Why:** Fixing a misunderstanding in a 200-word section is cheap. Fixing it after a 5-page spec is expensive.

## Gate Function

```
BEFORE starting implementation on any feature:
  Ask: "Have I brainstormed with the user?"

  IF no brainstorming happened:
    STOP — ask at least Round 1 questions first

  IF brainstorming was too brief (< 2 exchanges):
    Consider: Is the feature truly simple, or am I rushing?

  IF 1% chance the user meant something different:
    ASK — the cost of one question is nothing
    compared to the cost of building the wrong thing
```

## Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| Batching 5+ questions | One at a time |
| Open-ended when options exist | Multiple choice with recommendation |
| Asking without checking context | Read tech-stack, architecture first |
| Rapid-fire without acknowledgment | Build on each answer |
| Asking too many questions | Stop after Round 1 if clear |
| Not pushing back on scope creep | YAGNI — what's essential for v1? |
| Skipping brainstorming entirely | Always brainstorm before creative work |
