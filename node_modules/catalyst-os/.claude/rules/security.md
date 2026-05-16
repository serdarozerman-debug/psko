# Security Rules

These rules apply to ALL actions, regardless of which skill is active.

## Secrets

- **NEVER** commit `.env`, `.env.*`, credentials, API keys, or tokens
- **NEVER** hardcode secrets in source code — use environment variables
- Verify `.gitignore` includes `.env*` before any git operations
- If a secret is accidentally staged, **unstage immediately** and rotate the key

## Dependencies

- Do not install packages with known critical CVEs
- Prefer well-maintained packages with active security practices
- Pin major versions in production dependencies

## Code

- Sanitize all user input at system boundaries
- Use parameterized queries — never string-concatenate SQL
- Escape output to prevent XSS
- Validate file paths to prevent traversal attacks
