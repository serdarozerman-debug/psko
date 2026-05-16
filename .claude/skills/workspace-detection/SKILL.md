# Workspace Detection

> Load this skill when: initializing a project, or any time you need to understand the repository structure of the working directory.
> Used by: project-initialization (mandatory gate), build-orchestration, spec-shaping, any workflow that needs repo context.

## Overview

Before any project work, you MUST know the workspace structure. A monorepo and a multirepo workspace require fundamentally different approaches to branching, building, testing, and scoping.

**Core principle:** Detect first, configure second, work third. Never assume the structure.

---

## Detection Algorithm

Run this in the current working directory (CWD):

```
Step 1: Check CWD for .git/
  │
  ├── YES → .git/ exists in CWD
  │   │
  │   └── Step 2: Check for workspace/package indicators
  │       │
  │       ├── HAS workspace config → MONOREPO
  │       │   (pnpm-workspace.yaml, package.json.workspaces,
  │       │    lerna.json, turbo.json, nx.json,
  │       │    Cargo.toml with [workspace], go.work)
  │       │
  │       └── NO workspace config → SINGLE_REPO
  │
  └── NO → No .git/ in CWD
      │
      └── Step 3: Scan immediate subdirectories for .git/
          │
          ├── 1+ subdirs have .git/ → MULTIREPO
          │
          └── 0 subdirs have .git/ → UNKNOWN (ask user)
```

### Detection Commands

```bash
# Step 1: Is CWD a git repo?
ls -d .git 2>/dev/null

# Step 2: Workspace indicators (run all, check which exist)
ls pnpm-workspace.yaml 2>/dev/null
grep -l '"workspaces"' package.json 2>/dev/null
ls lerna.json turbo.json nx.json 2>/dev/null
grep -l '\[workspace\]' Cargo.toml 2>/dev/null
ls go.work 2>/dev/null

# Step 3: Subdirectories with their own .git/
for dir in */; do [ -d "$dir/.git" ] && echo "$dir"; done
```

---

## Workspace Types

### SINGLE_REPO

One git repository, one project. The simplest case.

```yaml
# project-config.yaml additions
workspace:
  type: single_repo
  root: "."
  git_root: "."
```

### MONOREPO

One git repository, multiple packages/apps.

```yaml
# project-config.yaml additions
workspace:
  type: monorepo
  root: "."
  git_root: "."
  package_manager: "pnpm"  # or npm, yarn, cargo, go
  workspace_config: "pnpm-workspace.yaml"  # file that defines packages
  packages:
    - path: "apps/web"
      name: "web"
      type: "app"
    - path: "apps/api"
      name: "api"
      type: "app"
    - path: "packages/shared"
      name: "shared"
      type: "library"
```

**How to discover packages:**
```bash
# pnpm
pnpm list --recursive --depth 0 --json 2>/dev/null

# npm/yarn workspaces
npm query '.workspace' --json 2>/dev/null

# Manual fallback: read workspace config and glob
cat pnpm-workspace.yaml  # lists patterns like "apps/*", "packages/*"
```

### MULTIREPO

Multiple git repositories in a parent workspace directory. CWD is the parent.

```yaml
# project-config.yaml additions
workspace:
  type: multirepo
  root: "."
  repos:
    - path: "frontend"
      name: "frontend"
      git_root: "frontend"
      branch: "main"
      description: "React web application"
    - path: "backend"
      name: "backend"
      git_root: "backend"
      branch: "main"
      description: "API server"
    - path: "shared"
      name: "shared"
      git_root: "shared"
      branch: "main"
      description: "Shared types and utilities"
```

**How to discover repos:**
```bash
# List all subdirs with .git/ and their current branches
for dir in */; do
  if [ -d "$dir/.git" ]; then
    branch=$(git -C "$dir" branch --show-current)
    echo "$dir → $branch"
  fi
done
```

---

## Writing to project-config.yaml

After detection, **merge** the `workspace:` section into `project-config.yaml`. Do NOT overwrite existing config — add to it.

```
IF project-config.yaml exists:
  Read it
  Add/update the workspace: section
  Write back

IF project-config.yaml does NOT exist:
  Create it with workspace: section
  (other sections will be added by project-initialization)
```

---

## Multirepo-Specific Rules

When workspace type is `multirepo`:

### Git Operations
- Each repo has its own git history and branches
- Spec branches must be created in ALL relevant repos
- Commits reference the spec but happen per-repo

### Scope Boundaries
- Agent scope MUST include the repo path prefix
  - `scope: frontend/src/components/**` (not just `src/components/**`)
- Parallel agents can work across repos safely (different git roots)

### Build & Test
- Each repo may have different test commands
- Build order may depend on inter-repo dependencies
- Document per-repo commands in `workspace.repos[].scripts`

### Spec Placement
- `.catalyst/` lives in the workspace root (parent directory), NOT inside individual repos
- Specs can span multiple repos — the `affects` field in spec frontmatter should list which repos

---

## Monorepo-Specific Rules

When workspace type is `monorepo`:

### Scope Boundaries
- Agent scope includes the package path: `apps/web/src/**`
- Shared packages are read-only for feature agents
- Changes to shared packages need their own task

### Build & Test
- Use workspace-aware commands: `pnpm --filter web test`
- Respect the dependency graph between packages

---

## Gate Rule

```
BEFORE any project-initialization work:
  1. Run workspace detection
  2. Write result to project-config.yaml
  3. ONLY THEN proceed with Phase 1 (greenfield/brownfield)

This is non-negotiable. Workspace type affects EVERYTHING downstream.
```

---

## Refresh

When running `/catalyze-project --refresh`:
1. Re-run workspace detection
2. Compare with stored config
3. Report changes (new repos added, packages removed, etc.)
4. Update project-config.yaml

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Assume single repo | Always run detection |
| Skip detection for "simple" projects | Gate rule — no exceptions |
| Scope without repo prefix in multirepo | Always include repo path |
| Create .catalyst inside a sub-repo | .catalyst lives at workspace root |
| Same branch name across multirepo without checking | Each repo tracks its own branch |
| Overwrite project-config.yaml | Merge, don't overwrite |
