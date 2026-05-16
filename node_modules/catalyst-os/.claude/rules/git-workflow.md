# Git Workflow Rules

These rules apply to ALL git operations, regardless of which skill is active.

## Branch Naming

- Feature branches: `{branch_prefix}/{spec-slug}` (e.g., `feat/2026-01-11-user-auth`)
- Read `branch_prefix` from `.catalyst/main/project-config.yaml`
- Never commit directly to protected branches (`main`, `master`)

## Commit Messages

- Red phase: `test({scope}): write failing tests for {spec}`
- Green phase: `feat({scope}): implement {spec}`
- Bug fixes: `fix({scope}): description`
- Refactors: `refactor({scope}): description`
- Keep subject line under 72 characters
- Use imperative mood ("add", not "added")

## Operations

- Always check `git status` before destructive operations
- Never force-push to shared branches without user confirmation
- Prefer creating new commits over amending published ones
- Stage specific files — avoid `git add -A` which may catch secrets
