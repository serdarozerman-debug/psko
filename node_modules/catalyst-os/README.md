# Catalyst OS

> An AI-powered development system for building production-ready applications through spec-driven development.

---

## Quick Start

```bash
npx catalyst-os                        # Install to your project
/catalyze-project                      # Initialize project foundation
/catalyze-spec "description"           # Shape a feature specification
/challenge-spec @spec-name             # (optional) Interrogate the spec branch by branch
/forge-spec @spec-name                 # Implement with TDD
/audit-spec @spec-name                 # Run quality checks
/seal-spec @spec-name                  # Accept and archive
```

---

## Installation

```bash
npx catalyst-os
```

This installs `.claude/` (agents, skills, commands) to your project root.

Then run `/catalyze-project` to initialize — this detects your workspace type, generates foundation docs, and bootstraps `CLAUDE.md` with the skill enforcement directive.

---

## Architecture

```
.claude/
├── agents/              # WHO - Agent personas and behavior
├── skills/              # HOW - Process knowledge and workflows
│   ├── using-skills/    # Bootstrap: enforces skill loading
│   ├── brainstorming/
│   ├── test-driven-development/
│   ├── systematic-debugging/
│   ├── verification-before-completion/
│   ├── agent-delegation/
│   ├── receiving-code-review/
│   ├── workspace-detection/
│   ├── spec-shaping/
│   ├── spec-challenge/
│   ├── build-orchestration/
│   ├── spec-validation/
│   ├── spec-approval/
│   ├── spec-archival/
│   ├── project-initialization/
│   ├── project-sync/
│   └── spec-update/
└── commands/            # WHEN - Thin triggers (invoke skills)

.catalyst/
├── main/                # Mission, roadmap, tech-stack, project-config
├── specs/               # Active specifications
├── completed/           # Archived specs
└── library/             # Reusable patterns
```

---

## Three-Layer Separation

| Layer | Contains | Location | Role |
|-------|----------|----------|------|
| **Command** | WHEN - User trigger | `.claude/commands/` | Thin wrapper (16-18 lines) |
| **Skill** | HOW - Process knowledge | `.claude/skills/` | Rich workflow logic |
| **Agent** | WHO - Persona + behavior | `.claude/agents/` | Specialized executor |

Commands invoke skills. Skills define process. Agents execute within skill boundaries.

### Skill Enforcement

`CLAUDE.md` bootstraps the system by loading `using-skills` at conversation start. This skill contains the full index and the hard rule:

> **If there is even a 1% chance a skill applies, you MUST load it.**

Without this, skills are optional documentation. With it, they're mandatory process gates.

---

## Skills

### Process Skills (cross-cutting)

| Skill | Purpose |
|-------|---------|
| `using-skills` | Bootstrap — enforces all other skill loading |
| `brainstorming` | One-question-at-a-time requirement gathering |
| `test-driven-development` | Red-Green-Refactor with mandatory test failure verification |
| `systematic-debugging` | Root cause investigation before fixes |
| `verification-before-completion` | Evidence before completion claims |
| `agent-delegation` | Orchestrators never implement, verify agent claims |
| `receiving-code-review` | Technical evaluation over performative agreement |
| `workspace-detection` | Detect single_repo, monorepo, or multirepo structure |

### Orchestration Skills (workflow-specific)

| Skill | Command | Purpose |
|-------|---------|---------|
| `spec-shaping` | `/catalyze-spec` | Shape feature requests into specifications |
| `spec-challenge` | `/challenge-spec` | Interrogate a shaped spec branch by branch (optional) |
| `build-orchestration` | `/forge-spec` | DAG-based TDD implementation |
| `spec-validation` | `/audit-spec` | Quality checks via Guardian agents |
| `spec-approval` | `/seal-spec` | Final verification and archival |
| `spec-archival` | `/archive-spec` | Lightweight completion and archival |
| `project-initialization` | `/catalyze-project` | Workspace detection + foundation docs |
| `project-sync` | `/sync-project` | Batch sync and archive specs |
| `spec-update` | `/update-spec` | Modify spec during planning phase |

---

## The Four Orders

### Agent Specialization

```
Catalysts (Orchestrators)
├── Catalyst      → Spec orchestration
├── Forge-Master  → Build orchestration
└── Arbiter       → Validation orchestration

Seekers (Research)
├── Oracle   → Requirements gathering
├── Seer     → Codebase analysis
├── Scout    → Web research
├── Surveyor → UI/UX research
└── Scribe   → Documentation

Technologists (Builders)
├── Forger     → Task breakdown
├── Alchemist  → Database
├── Smith      → Backend
├── Shaper     → Frontend
└── Necromancer → ML/AI

Guardians (Quality)
├── Enforcer   → Unit tests
├── Sentinel   → E2E tests
├── Inquisitor → Code review
└── Watcher    → Security
```

### Agent Capabilities

| Order | Agent | Responsibility |
|-------|-------|----------------|
| **CATALYSTS** | Catalyst | Spec orchestration, spawns Seekers |
| | Forge-Master | Build orchestration, spawns Technologists |
| | Arbiter | Validation orchestration, spawns Guardians |
| **SEEKERS** | Oracle | Gather requirements from user |
| | Scribe | Write and manage documentation |
| | Seer | Analyze codebase patterns |
| | Scout | Research web, GitHub, Reddit |
| | Surveyor | Research UI/UX patterns |
| **TECHNOLOGISTS** | Forger | Break down specs into tasks |
| | Smith | Implement backend/API code |
| | Shaper | Implement frontend/UI code |
| | Alchemist | Design schemas, create migrations |
| | Necromancer | Implement ML/AI features |
| **GUARDIANS** | Enforcer | Write and run unit tests |
| | Sentinel | Run E2E tests |
| | Inquisitor | Code review, linting |
| | Watcher | Security audit, dependency scan |

---

## Complete Lifecycle

```
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │              │     │              │     │              │     │              │
  │   CATALYZE   │────>│    FORGE     │────>│    AUDIT     │────>│     SEAL     │
  │              │     │              │     │              │     │              │
  │ /catalyze-   │     │ /forge-spec  │     │ /audit-spec  │     │ /seal-spec   │
  │    spec      │     │              │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │                    │
         v                    v                    v                    v
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  spec.md     │     │  tasks.md    │     │ validation.md│     │   Commit +   │
  │  research.md │     │  (updated)   │     │  handoff.md  │     │   Archive    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
  Context full? New conversation?
  Run /primer-spec @slug to restore awareness before continuing.

  Optional gate between CATALYZE and FORGE:
  /challenge-spec @slug — interrogate every branch of the design tree
  before tests are written. Patches spec.md, logs to handoff.md.
```

---

## Commands

| Command | When to Use | Output |
|---------|-------------|--------|
| `/catalyze-project` | Start new project | mission.md, roadmap.md, tech-stack.md |
| `/catalyze-spec "feature"` | New feature request | spec.md, research.md |
| `/challenge-spec @slug` | Stress-test the spec before forging (optional) | spec.md (patched), handoff.md (Challenge Log) |
| `/forge-spec @slug` | Implement feature | tasks.md (updated) |
| `/primer-spec @slug` | Restore context (new conversation) | Brief status summary |
| `/audit-spec @slug` | Quality checks | validation.md, handoff.md |
| `/seal-spec @slug` | Finalize | Commit + Archive |
| `/archive-spec @slug` | Lightweight archive | Archive (no git ceremony) |
| `/sync-project` | Batch sync spec statuses | Sync report + archives |
| `/discard-spec @slug "reason"` | Discard implementation | Status: REJECTED |
| `/status-spec @slug` | Check progress | Current status |
| `/update-spec @slug "change"` | Modify spec (planning phase) | Updated spec.md |
| `/mission` | Create/update mission.md | mission.md |
| `/roadmap` | Create/update roadmap.md | roadmap.md |
| `/tech-stack` | Create/update tech-stack.md | tech-stack.md |

---

## Spec Folder Structure

```
.catalyst/specs/YYYY-MM-DD-{slug}/
├── spec.md           <- Requirements (Scribe owns)
├── research.md       <- Research findings (Scribe compiles)
├── tasks.md          <- Task breakdown + progress (Forger owns)
├── validation.md     <- Test results (Arbiter owns)
├── handoff.md        <- Human-readable summary (Scribe owns)
└── assets/           <- Images, diagrams, mockups
```

---

## TDD Enforcement

```
  1. FORGER creates tasks.md
         │
         v
  2. ENFORCER writes ALL tests
         │
         v
  ┌──────────────────────────────────────────┐
  │  GATE 1: RED PHASE                       │
  │  All tests must FAIL                     │
  │  If any pass -> STOP                     │
  └──────────────────────────────────────────┘
         │
         v (only after gate passes)
  3. BUILDERS implement (Alchemist, Smith, Shaper)
         │
         v
  ┌──────────────────────────────────────────┐
  │  GATE 2: GREEN PHASE                     │
  │  All tests must PASS                     │
  └──────────────────────────────────────────┘
```

---

## Workspace Support

Catalyst OS detects and adapts to your workspace structure:

| Type | Detection | Example |
|------|-----------|---------|
| **Single Repo** | `.git/` in CWD, no workspace config | Standard project |
| **Monorepo** | `.git/` + pnpm-workspace.yaml / turbo.json / etc. | apps/ + packages/ |
| **Multirepo** | No `.git/` in CWD, subdirs have `.git/` | Workspace with 3 repos |

Detected during `/catalyze-project` and stored in `project-config.yaml`. Affects scoping, branching, and build strategy.

---

## Parallelization Rules

```
PARALLELIZE (No Dependencies)
──────────────────────────────
Research phase  │ Seer + Scout + Surveyor
Build phase     │ Smith + Shaper (backend + frontend)
Validation      │ Enforcer + Sentinel + Inquisitor + Watcher

RUN SEQUENTIALLY (Has Dependencies)
────────────────────────────────────
Oracle     -> All research  │ Need requirements first
Forger     -> All builders  │ Need task breakdown
Alchemist  -> Smith         │ DB schema before API
Enforcer   -> Builders      │ TDD: tests before code
```

---

## Pattern Library

Reusable implementation patterns extracted from completed specs via `/seal-spec`, `/archive-spec`, or `/sync-project`.

**Location:** `.catalyst/library/`

| Category | Keywords |
|----------|----------|
| Payments | stripe, billing, subscription |
| Authentication | oauth, sso, jwt, login |
| File Storage | s3, upload, media |
| Real-time | websocket, live updates |
| Notifications | email, push, sms |
| Search | elasticsearch, fulltext |
| Caching | redis, performance |
| Background Jobs | queue, worker, cron |
