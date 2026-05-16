# Project Initialization

> **When to invoke:** When initializing the project foundation.
> **Invoked by:** `/catalyze-project` command.

## Purpose

Detect project type (greenfield/brownfield), gather information, set up git workflow, and generate all foundation documents.

## Skills Referenced

- `workspace-detection` — **Mandatory gate** before any other phase
- `brainstorming` — Oracle uses for greenfield questioning
- `agent-delegation` — Parallel Seer agents for brownfield analysis

## Workflow

### Phase 0: Workspace Detection (Mandatory Gate)

**Before anything else**, load `.claude/skills/workspace-detection/SKILL.md` and run detection.

This determines:
- **Workspace type**: single_repo, monorepo, or multirepo
- **Repo locations**: paths, branches, package structure
- **Where .catalyst/ lives**: always at workspace root

Write results to `project-config.yaml` under the `workspace:` section. This is non-negotiable — workspace type affects everything downstream (scoping, branching, testing, spec placement).

### Phase 1: Detection (Silent)

Silently scan to determine greenfield or brownfield:

| Signal | Greenfield | Brownfield |
|--------|------------|------------|
| Source files | Few or none | Many |
| Package files | Minimal deps | Established deps |
| Git history | < 10 commits | > 10 commits |
| Lines of code | < 500 | > 500 |

### Phase 2: Gather Information

**Greenfield** — Heavy questioning via Oracle (9 questions about problem, users, features, constraints)

**Brownfield** — Heavy scanning via 3 parallel Seer agents:
```
Seer 1: Architecture + Tech Stack
Seer 2: Conventions + Patterns
Seer 3: Concerns + TODOs
```
Then ask only what can't be inferred.

### Phase 3: Git Branch Setup

Ask user about development branch preference (development, develop, staging, custom).

1. Check if branch exists
2. Create from main if needed
3. Store in project-config.yaml

### Phase 4: Generate Config and Documents

Create in `.catalyst/main/`:

| File | Source |
|------|--------|
| `project-config.yaml` | User preferences |
| `mission.md` | Questions or README |
| `roadmap.md` | Questions or TODOs |
| `tech-stack.md` | Detected or recommended |
| `architecture.md` | Analyzed or planned |
| `conventions.md` | Learned or best-practice |
| `concerns.md` | Found or empty |

### Phase 5: Bootstrap CLAUDE.md

The project's `CLAUDE.md` must contain the Catalyst OS bootstrap directive. This is what makes skills load automatically.

```
IF CLAUDE.md exists:
  Read it
  Check if it already contains the Catalyst OS bootstrap section
  IF missing: Append the bootstrap section at the TOP of the file
  IF present: Leave it as-is

IF CLAUDE.md does NOT exist:
  Create it with the bootstrap section
```

**Bootstrap section to add:**
```markdown
## Catalyst OS

Before any action, read `.claude/skills/using-skills/SKILL.md` and follow it.
```

**Rules:**
- NEVER overwrite an existing CLAUDE.md — only append
- Add the section at the TOP so it's read first
- Keep it minimal — the skill file has the full index
- Preserve all existing project-specific content

## Output

```
CLAUDE.md                  (bootstrap — created or updated)
.catalyst/main/
├── project-config.yaml
├── mission.md
├── roadmap.md
├── tech-stack.md
├── architecture.md
├── conventions.md
└── concerns.md

Next: /catalyze-spec "feature description"
```

## Refresh

`/catalyze-project --refresh` re-analyzes and updates docs after major changes.
