# /tech-stack

Create or update the tech stack documentation.

## Usage

```
/tech-stack           # Analyze and document current stack
/tech-stack "add X"   # Add new technology decision
```

## Workflow

1. **Scan** codebase for technology indicators:
   - Package files (package.json, requirements.txt, go.mod, etc.)
   - Configuration files (tsconfig, webpack, docker, etc.)
   - Directory structure patterns
   - Import statements
2. **Document** each technology with rationale
3. **Ask** about undocumented decisions if needed

## Output Format

`.catalyst/main/tech-stack.md`:

```markdown
# Tech Stack

## Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |

**Key Decisions:**
- [Why React over Vue/Angular?]
- [State management approach]

## Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | API framework |

**Key Decisions:**
- [API design approach]
- [Authentication strategy]

## Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary data store |
| Redis | Caching, sessions |

**Key Decisions:**
- [Schema design approach]
- [Migration strategy]

## Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Vercel | Deployment |

## Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code quality |
| Prettier | Formatting |
| Jest | Testing |

---
*Last updated: YYYY-MM-DD*
```

