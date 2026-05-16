# /mission

Create or update the project mission document.

## Usage

```
/mission              # Create new or update existing
/mission "new vision" # Update with specific direction
```

## Workflow

1. **Read existing** `.catalyst/main/mission.md` if present
2. **Analyze** current codebase for context
3. **Ask** clarifying questions about:
   - Core problem being solved
   - Target users and their needs
   - Unique value proposition
   - Success metrics
4. **Create/Update** the mission document

## Output Format

`.catalyst/main/mission.md`:

```markdown
# Project Mission

## Vision
[One sentence describing the ultimate goal]

## Problem
[What problem does this solve and why does it matter?]

## Users
[Who are the primary users and what do they need?]

## Value Proposition
[What makes this solution unique or better?]

## Success Metrics
[How will we know we've succeeded?]

---
*Last updated: YYYY-MM-DD*
```

