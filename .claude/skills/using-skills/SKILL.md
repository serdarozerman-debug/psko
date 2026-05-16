# Using Skills

> Load this skill FIRST. Before any other action. Before clarifying questions. Before exploring code.
> This is the bootstrap skill — it ensures all other skills get used.

## The Rule

**If there is even a 1% chance a skill applies to what you are doing, you MUST load it.**

This is not optional. This is not negotiable. You cannot rationalize your way out of this.

```
BEFORE any action:
  1. Check: Does a skill apply to this task?
  2. IF yes (even 1% chance): Read the SKILL.md file
  3. Follow the skill's process
  4. THEN proceed with the task

Skills tell you HOW. User instructions tell you WHAT.
"Add X" or "Fix Y" does not mean skip the skill workflow.
```

---

## Skill Index

### Process Skills (cross-cutting — check these first)

| Skill | Path | Load when... |
|-------|------|-------------|
| **using-skills** | `.claude/skills/using-skills/SKILL.md` | Starting any work (this file) |
| **brainstorming** | `.claude/skills/brainstorming/SKILL.md` | Gathering requirements, exploring options, creative decisions |
| **test-driven-development** | `.claude/skills/test-driven-development/SKILL.md` | Writing any code — tests FIRST, always |
| **systematic-debugging** | `.claude/skills/systematic-debugging/SKILL.md` | Any bug, test failure, or unexpected behavior |
| **verification-before-completion** | `.claude/skills/verification-before-completion/SKILL.md` | About to claim work is done — evidence before claims |
| **agent-delegation** | `.claude/skills/agent-delegation/SKILL.md` | Orchestrating agents — never implement as orchestrator |
| **receiving-code-review** | `.claude/skills/receiving-code-review/SKILL.md` | Receiving feedback from Inquisitor, user, or reviewer |
| **workspace-detection** | `.claude/skills/workspace-detection/SKILL.md` | Initializing a project — detect single_repo, monorepo, or multirepo |

### Orchestration Skills (workflow-specific)

| Skill | Path | Load when... |
|-------|------|-------------|
| **spec-shaping** | `.claude/skills/spec-shaping/SKILL.md` | `/catalyze-spec` — shaping a new specification |
| **spec-challenge** | `.claude/skills/spec-challenge/SKILL.md` | `/challenge-spec` — interrogating a shaped spec branch by branch (optional) |
| **build-orchestration** | `.claude/skills/build-orchestration/SKILL.md` | `/forge-spec` — implementing a specification |
| **spec-validation** | `.claude/skills/spec-validation/SKILL.md` | `/audit-spec` — quality checks on implementation |
| **spec-approval** | `.claude/skills/spec-approval/SKILL.md` | `/seal-spec` — final commit and archival |
| **spec-archival** | `.claude/skills/spec-archival/SKILL.md` | `/archive-spec` — lightweight completion and archival |
| **project-initialization** | `.claude/skills/project-initialization/SKILL.md` | `/catalyze-project` — setting up a new project |
| **spec-update** | `.claude/skills/spec-update/SKILL.md` | `/update-spec` — modifying an existing spec |
| **project-sync** | `.claude/skills/project-sync/SKILL.md` | `/sync-project` — batch sync and archive specs |

---

## Skill Priority

When multiple skills could apply, load in this order:

1. **Process skills first** — these determine HOW to approach the task
2. **Orchestration skills second** — these guide the specific workflow

Examples:
- "Build this feature" → `brainstorming` first, then `build-orchestration`
- "Fix this bug" → `systematic-debugging` first, then `test-driven-development`
- "Review says to change X" → `receiving-code-review` first, then implement

---

## Skill Types

**Rigid** (follow exactly, no shortcuts):
- `test-driven-development` — Red → Green → Refactor, no exceptions
- `systematic-debugging` — Root cause before fixes, no guessing
- `verification-before-completion` — Evidence before claims, no self-reports
- `agent-delegation` — Orchestrators never implement, no "just this once"
- `receiving-code-review` — Verify before implementing, no blind agreement
- `workspace-detection` — Detect repo structure before any project work, no assumptions

**Flexible** (adapt principles to context):
- `brainstorming` — Scale questions to task complexity
- Orchestration skills — Adapt workflow to project needs

The skill itself tells you which type it is. When in doubt, treat it as rigid.

---

## Rationalization Prevention

These thoughts mean STOP — you're about to skip a skill:

| Thought | Reality |
|---------|---------|
| "This is just a simple fix" | Simple things become complex. Check for skills. |
| "I need more context first" | Skill check comes BEFORE exploring code. |
| "Let me look at the code quickly" | Skills tell you HOW to look at code. Check first. |
| "I already know this skill" | Skills evolve. Read the current version. |
| "The skill is overkill for this" | That's what everyone says before the bug ships. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This doesn't need a formal process" | If a skill exists for it, use it. |
| "I can handle this without the skill" | The skill exists because people said that and failed. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This is just a question" | Questions trigger actions. Check for skills. |

---

## How Skills Are Loaded

Skills are SKILL.md files. To use a skill:

1. **Read** the SKILL.md file at the path listed in the index above
2. **Follow** the process defined in the skill
3. Skills may reference **companion files** in the same directory (anti-patterns, templates)

Skills are NOT invoked via the Skill tool — that's for commands. Skills are loaded by reading the file.

---

## The Bottom Line

**Skills are mandatory, not optional. Check before every action. 1% chance = must load.**

The skill-driven architecture only works if skills actually get loaded. This skill ensures they do.
