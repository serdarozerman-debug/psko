# Agent Registry

Quick reference for all agents and the skills they use.

---

## Parallel Execution Strategy

**CRITICAL**: Always spawn multiple agents in parallel when their tasks are independent.

### Parallelize These (No Dependencies)

| Scenario | Run Together |
|----------|--------------|
| Research phase | Oracle + Seer + Scout + Surveyor |
| Build phase | Smith x N + Shaper x M (multiple instances) |
| Validation phase | Inquisitor + Watcher + Sentinel |

### Run Sequentially (Has Dependencies)

| First | Then | Why |
|-------|------|-----|
| Forger | All builders | Need task breakdown (DAG) first |
| Alchemist | Smith/Shaper | DB schema before API/UI that uses it |
| Enforcer | Builders | TDD: tests before implementation |
| Contracts | Parallel work | Shared types before parallel divergence |

### Multi-Instance Parallelization (DAG-Based)

Forger creates a **Build DAG** that identifies:
- **Scope boundaries** — exclusive file ownership per agent instance
- **Dependencies** — which tasks block others
- **Parallel opportunities** — tasks that can run simultaneously

```
alchemist (DB) ──────────────────────────────────────>
                │
                └── contracts (shared types) ────────>
                        │
                        ├── smith-1 (api/auth/**) ──> }
                        ├── smith-2 (api/posts/**) ─> } PARALLEL
                        ├── shaper-1 (pages/profile) > } (5 agents)
                        ├── shaper-2 (pages/feed) ──> }
                        └── shaper-3 (pages/settings) >
```

### Scope Isolation Rules

Each parallel agent has:
- **Scope**: Files it can write (exclusive)
- **Reads**: Files it can read but NOT modify (shared)

**CRITICAL**: Parallel tasks MUST have non-overlapping scopes. If scopes overlap -> make sequential.

---

## CATALYSTS (Orchestrators)

All orchestrators load `using-skills` first and follow `agent-delegation`.

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Catalyst](.claude/agents/catalyst.md) | Spec orchestration | `spec-shaping`, `brainstorming`, `agent-delegation` |
| [Forge-Master](.claude/agents/forge-master.md) | Build orchestration | `build-orchestration`, `agent-delegation`, `verification-before-completion` |
| [Arbiter](.claude/agents/arbiter.md) | Validation orchestration | `spec-validation`, `agent-delegation`, `verification-before-completion` |

## SEEKERS (Research)

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Oracle](.claude/agents/oracle.md) | Gather requirements | `brainstorming` |
| [Scribe](.claude/agents/scribe.md) | Write documentation | — |
| [Seer](.claude/agents/seer.md) | Analyze codebase | — |
| [Scout](.claude/agents/scout.md) | Web research | — |
| [Surveyor](.claude/agents/surveyor.md) | UI/UX research | — |

## TECHNOLOGISTS (Builders)

All builders follow `test-driven-development`, `systematic-debugging`, `verification-before-completion`, and `receiving-code-review`.

| Agent | Role | Additional Skills |
|-------|------|-------------------|
| [Forger](.claude/agents/forger.md) | Task breakdown | — |
| [Smith](.claude/agents/smith.md) | Backend/API | `test-driven-development`, `systematic-debugging` |
| [Shaper](.claude/agents/shaper.md) | Frontend/UI | `test-driven-development`, `systematic-debugging` |
| [Alchemist](.claude/agents/alchemist.md) | Database/schemas | `test-driven-development`, `systematic-debugging` |
| [Necromancer](.claude/agents/necromancer.md) | ML/AI | — |

## GUARDIANS (Quality)

| Agent | Role | Skills Used |
|-------|------|-------------|
| [Enforcer](.claude/agents/enforcer.md) | Unit tests | `test-driven-development` |
| [Sentinel](.claude/agents/sentinel.md) | E2E tests | — |
| [Inquisitor](.claude/agents/inquisitor.md) | Code review | — |
| [Watcher](.claude/agents/watcher.md) | Security audit | — |

---

## Language Policy

**CRITICAL: All generated artifacts MUST be in English.**

| Context | Language |
|---------|----------|
| User Communication | Match user's language |
| Generated Artifacts | **Always English** |
| Code & Comments | **Always English** |

**Artifacts include:** `.catalyst/` contents, spec documents, mission.md, roadmap.md, tech-stack.md, code comments, commit messages.

---

## Documentation Output Policy

**CRITICAL: All spec documentation MUST go through Scribe agent.**

> **Structure defined in:** `.catalyst/spec-structure.yaml` (single source of truth)

### STRICT ALLOWLIST

Spec folders may **ONLY** contain:

| File | Owner | Purpose |
|------|-------|---------|
| `spec.md` | Scribe | Requirements + frontmatter |
| `research.md` | Scribe | Compiled research findings |
| `tasks.md` | Forger | Build DAG + progress |
| `validation.md` | Arbiter | Test results |
| `handoff.md` | Arbiter | Human-readable summary |
| `assets/` | Any | Images, diagrams |

**ANY OTHER FILE IS FORBIDDEN.** No README.md, no notes.md, no implementation/.

### Rules

1. **Scribe is gatekeeper** — All .md writes in specs go through Scribe
2. **DENY by default** — If not in allowlist, don't create it
3. **Researchers hand off** — Scout/Seer/Oracle give findings to Scribe, don't write directly
4. **tasks.md is THE living document** — ONE file to read when resuming work
5. **handoff.md is colleague summary** — Human-readable walkthrough, finalized at end

---

## Context Assembly

**spec.md has YAML frontmatter** for cross-spec knowledge transfer:

```yaml
---
spec: YYYY-MM-DD-slug
status: draft | in-progress | complete
domain: auth | payments | etc
provides: [what this spec creates]
requires: [specs this depends on]
affects: [specs this impacts]
patterns_established: [reusable patterns created]
key_files: [important files created/modified]
key_decisions: [major choices made]
---
```

Catalyst reads frontmatter from all specs to understand project context before shaping new specs.
