# Coding Standards

These rules apply to ALL code generation, regardless of which skill is active.

## Language

- All generated artifacts MUST be in English (code, comments, docs, commit messages)
- Communicate with the user in their preferred language

## File Hygiene

- Keep files under 300 lines — split if larger
- No deep nesting (max 3 levels of indentation for logic)
- One concept per file — don't mix unrelated concerns

## Quality

- Write minimal code that solves the current requirement
- Don't add features, abstractions, or config that wasn't requested
- Prefer clarity over cleverness
- Delete dead code — don't comment it out
